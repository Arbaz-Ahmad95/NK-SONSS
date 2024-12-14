import React, { useState } from 'react'
import './CSS/LoginSignUp.css';
const LoginSignUp=()=>{


    const [state,setState]=useState("Login")
      const [formData, setFormData]=useState({
        username:"",
        password:"",
        email:""
      })

      const changeHandler=(e)=>{
            setFormData({...formData,[e.target.name]:e.target.value})
      }
     
   const login=async ()=>{
       console.log("Login function Executed",formData)
       let responseData;
       await fetch(`${process.env.REACT_APP_BACKEND_URL}/login`,{
           method:'POST',
           headers:{
               Accept:'application/form-data',
               'Content-Type':'application/json'
           },
   
           body: JSON.stringify(formData),
       }).then((response)=> response.json()).then((data)=>responseData=data)
       if(responseData.success){
             localStorage.setItem('auth-token',responseData.token);
             window.location.replace("/")
       }
       else{
           alert("existing user found with same email address")
       }
   
      
      
   }
   const signup=async ()=>{
    console.log("signup function Executed",formData)
    let responseData;
    await fetch(`${process.env.REACT_APP_BACKEND_URL}/signup`,{
        method:'POST',
        headers:{
            Accept:'application/form-data',
            'Content-Type':'application/json'
        },

        body: JSON.stringify(formData),
    }).then((response)=> response.json()).then((data)=>responseData=data)
    if(responseData.success){
          localStorage.setItem('auth-token',responseData.token);
          window.location.replace("/")
    }
    else{
        alert("existing user found with same email address")
    }

   
   }
    return (
        <div>
           <div className="loginsignup">
              <div className="loginsignup-container">
                  <h1>{state}</h1>
                  <div className="loginsignup-fields">
                     {state==="Sign Up"?<input name='username' value={formData.username} onChange={changeHandler} type="text" placeholder='user name ' />:<></>}
                      <input name='email' value={formData.email} onChange={changeHandler} type="email" placeholder='Email Address' />
                      <input name='password' value={formData.password} onChange={changeHandler} type="password" placeholder='Password' />
                  </div>
                 <button onClick={()=>{state==="Login"?login():signup()}}>Continue</button>

                 {state==="Sign Up"? <p className="loginsignup-login">
                    Already have an account? <span onClick={()=>{setState("Login")}}>Login here </span>
                 </p>:<p className="loginsignup-login">
                    Create an account ? <span  onClick={()=>{setState("Sign Up")}}>Click here </span>
                 </p>}
                

                 
                 <div className="loginsignup-agree">
                     <input type="checkbox" name='' id='' />
                     <p>By continuing , i agree to the terms of use & privacy policy. </p>
                 </div>
              </div>
           </div>
        </div>
    )
}
export default LoginSignUp