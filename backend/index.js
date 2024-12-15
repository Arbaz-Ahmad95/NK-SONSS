require("dotenv").config(); // To use environment variables
const port = process.env.PORT || 4000;
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require('multer');
const jwt = require("jsonwebtoken");
const path = require('path');
const fs = require('fs');
const { body, validationResult } = require("express-validator");

// Middleware setup
app.use(express.json());
app.use(cors());

// Database connection with MongoDB
const MONGO_URL = process.env.MONGO_URL;
async function main() {
    await mongoose.connect(MONGO_URL);
}
main()
    .then(() => {
        console.log("Connected to DB");
        app.listen(port, () => console.log(`Server running on port ${port}`));
    })
    .catch((err) => {
        console.error("DB Connection Error:", err);
    });

// API Home Route
app.get("/", (req, res) => {
    res.send("Express app is running");
});

// Image Storage Engine
const storage = multer.diskStorage({
    destination: './upload/images',
    filename: (req, file, cb) => {
        return cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`);
    }
});
const upload = multer({ storage: storage });

// Upload Endpoint for images
app.use('/images', express.static('upload/images'));
app.post("/upload", upload.single('product'), (req, res) => {
    res.json({
        success: 1,
        image_url: `http://localhost:${port}/images/${req.file.filename}`
    });
});

// Product Schema
const Product = mongoose.model("Product", {
    id: { type: Number, required: true },
    name: { type: String, required: true },
    image: { type: String, required: true },
    category: { type: String, required: true },
    new_price: { type: Number, required: true },
    old_price: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    available: { type: Boolean, default: true },
});

// Add Product Endpoint
app.post('/addproduct', async (req, res) => {
    try {
        let products = await Product.find({});
        let id = products.length > 0 ? products[products.length - 1].id + 1 : 1;

        const product = new Product({
            id: id,
            name: req.body.name,
            image: req.body.image,
            category: req.body.category,
            new_price: req.body.new_price,
            old_price: req.body.old_price,
        });
        await product.save();
        res.json({ success: true, name: req.body.name });
    } catch (err) {
        console.error("Error adding product:", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});

// Remove Product Endpoint
app.post('/removeproduct', async (req, res) => {
    try {
        await Product.findOneAndDelete({ id: req.body.id });
        res.json({ success: true });
    } catch (err) {
        console.error("Error removing product:", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});

// Get All Products Endpoint
app.get('/allproducts', async (req, res) => {
    try {
        let products = await Product.find({});
        res.json({ success: true, products });
    } catch (err) {
        console.error("Error fetching products:", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});

// User Schema
const Users = mongoose.model('Users', {
    name: { type: String },
    email: { type: String, unique: true },
    password: { type: String },
    cartData: { type: Object },
    date: { type: Date, default: Date.now },
});

// User Signup Endpoint
app.post('/signup', [
    body('email').isEmail().withMessage('Invalid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
        let check = await Users.findOne({ email: req.body.email });
        if (check) {
            return res.status(400).json({ success: false, errors: "User already exists" });
        }

        let cart = {};
        for (let i = 0; i < 300; i++) cart[i] = 0;

        const user = new Users({
            name: req.body.username,
            email: req.body.email,
            password: req.body.password,
            cartData: cart,
        });
        await user.save();

        const token = jwt.sign({ user: { id: user.id } }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ success: true, token });
    } catch (err) {
        console.error("Error signing up user:", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});

// User Login Endpoint
app.post('/login', async (req, res) => {
    try {
        let user = await Users.findOne({ email: req.body.email });
        if (!user) {
            return res.status(400).json({ success: false, errors: "Invalid email or password" });
        }

        const passCompare = req.body.password === user.password;
        if (!passCompare) {
            return res.status(400).json({ success: false, errors: "Invalid email or password" });
        }

        const token = jwt.sign({ user: { id: user.id } }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ success: true, token });
    } catch (err) {
        console.error("Error logging in user:", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});

// Fetch User Middleware
const fetchUser = async (req, res, next) => {
    const token = req.header('auth-token');
    if (!token) {
        return res.status(401).json({ errors: "Please authenticate using a valid token" });
    }

    try {
        const data = jwt.verify(token, process.env.JWT_SECRET);
        req.user = data.user;
        next();
    } catch (err) {
        res.status(401).json({ errors: "Invalid token" });
    }
};

// Add to Cart API
app.post('/addtocart', fetchUser, async (req, res) => {
    try {
        let userData = await Users.findOne({ _id: req.user.id });
        userData.cartData[req.body.itemId] += 1;
        await Users.findOneAndUpdate({ _id: req.user.id }, { cartData: userData.cartData });
        res.json({ success: true });
    } catch (err) {
        console.error("Error adding to cart:", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});

// Remove from Cart API
app.post('/removefromcart', fetchUser, async (req, res) => {
    try {
        let userData = await Users.findOne({ _id: req.user.id });
        if (userData.cartData[req.body.itemId] > 0) userData.cartData[req.body.itemId] -= 1;
        await Users.findOneAndUpdate({ _id: req.user.id }, { cartData: userData.cartData });
        res.json({ success: true });
    } catch (err) {
        console.error("Error removing from cart:", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});

// Get Cart Data API
app.post('/getcart', fetchUser, async (req, res) => {
    try {
        let userData = await Users.findOne({ _id: req.user.id });
        res.json({ success: true, cartData: userData.cartData });
    } catch (err) {
        console.error("Error fetching cart data:", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});
