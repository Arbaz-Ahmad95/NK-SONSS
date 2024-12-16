import React, { useEffect, useState } from 'react'
import './popular.css'
import data_product from '../Assets/data'

import {Link} from 'react-router-dom'

const Popular = () => {


       
    
    return (
        <div className='popular'>
            <h1>POPULAR IN WOMEN</h1>
            <hr />
            <div className="popular-item">
                {data_product.map((item) => (
                    <div key={item.id} className="product-card">
                        <Link to ={`/product/${item.id}`}><img src={item.image} alt={item.name} className="product-image" /> </Link>
                        <p className="product-name">{item.name}</p>
                      
                        <div className="item-prices">
                        <p className="new-price">${item.new_price}</p>
                        <p className="old-price">${item.old_price}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default Popular
