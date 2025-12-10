const User = require('../models/User')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const asyncHandler = require("express-async-handler")
const Company = require('../models/Company')


// @desc Login  
// @route POST /auth
// @access public 
const login = asyncHandler(async(req,res)=>{
    const {username , password} = req.body
    if (!username ) {
        return res.status(400).json({ message: 'username required' });
    }
    if(!password)return res.status(400).json({msg:'password required'})
    const foundUser = await User.findOne({username}).populate('c_Name','c_Name').lean().exec()
    if(!foundUser || !foundUser.active)return res.status(401).json({message:"Unauthorized"})

    
    const match = await bcrypt.compare(password,foundUser.password)
    if(!match)return res.status(401).json({message:"Unauthorized"})
    
    // confirm the roles data and the roles length       
    if(foundUser.roles.length === 0)return res.status(404).json({message:"user have no role"})
    
    
        const accessToken = jwt.sign(
    {
        "UserInfo":{
            "username":foundUser.username,
            "roles":foundUser.roles,
            'c_Name':foundUser.c_Name
        }
    },
    process.env.ACCESS_TOKEN_SECRET,{expiresIn:'30m'}
)
const refreshToken=jwt.sign(
    {"username":foundUser.username},
    process.env.REFRESH_TOKEN_SECRET,
    {expiresIn:'30m'}

)
res.cookie('jwt',refreshToken,{
    httpOnly:true,
    secure:true,
    sameSite:'None',
    maxAge:7*24*60*60*1000
})
return res.status(200).json({
    accessToken,
    id:foundUser._id,
    username:foundUser.username,
    companyid:foundUser.c_Name.id,
    roles:foundUser.roles,
    company:foundUser.c_Name.c_Name

})

    

    
})
// @desc Refresh 
// @route Get /auth/refresh 
// @access Public - because access token has expires 
const refresh = (req,res)=>{
    const cookies = req.cookies 
    if(!cookies?.jwt) return res.status(401).json({message:"Unauthorized"})
    const refreshToken=cookies.jwt
    jwt.verify(refreshToken,process.env.REFRESH_TOKEN_SECRET,asyncHandler(async(err,decoded)=>{
        if(err)return res.status(403).json({message:"Forbidden"})
            const foundUser = await User.findOne({username:decoded.username}).populate('c_Name','c_Name')
            if(!foundUser)return res.status(401).json({message:"Unauthorized"})
            const roles = Object.values(foundUser.roles)
            if(!roles.length ||!roles)return res.status(400).json({message:"there is no roles found"})
            const username = foundUser.username
            if(!username)return res.status(404).json({msg:"the username not found"})

        const accessToken = jwt.sign(
    {
        "userInfo":{
            "username":foundUser.username,
            "roles":foundUser.roles,
            'c_Name':foundUser.c_Name

        }
    },process.env.ACCESS_TOKEN_SECRET,
    {expiresIn:"30m"}

)
return res.status(200).json({
    accessToken,
    id:foundUser._id,
    username:foundUser.username,
    company:foundUser.c_Name.c_Name,
    roles:foundUser.roles,
    

})
    }))



}


// @desc Logout 
// @route POST /auth/Logout 
// @access Public - just to clear cookie if exists 

const logout = (req,res)=>{
    const cookies = req.cookies
    if(!cookies?.jwt)return res.sendStatus(204) // 204 => No Content
    res.clearCookie('jwt',{httpOnly:true,sameSite:'None',secure:true})
    res.json({message:"Cookie Cleared"})

}


///@Company Controllers

// @v1.00
// @route post/auth/clogin
// @access public
const c_Login = asyncHandler(async(req,res)=>{
    const {c_Name,password} = req.body 
    //Confirm data 
    if(!c_Name ){
        return res.status(400).json({message:`company name required`})
    }
    if(!password)return res.status(409).json({msg:"password required"})
    const foundCompany = await Company.findOne({c_Name}).exec()
    if(!foundCompany || !foundCompany.active){
        return res.status(401).json({message:"Unauthorized"})

    }
    const match = await bcrypt.compare(password,foundCompany.password)
    if(!match)return res.status(401).json({message:"Unauthorized"})
    const active = foundCompany.active
       
    if(!active)res.status(400).json({message:"The company is no longer active "})


    
     const accessToken = jwt.sign(
    {
         "companyinfo":{
                    "c_Name":foundCompany.c_Name,   
                    "id":foundCompany._id,
                    "roles":foundCompany.roles
                }
    },
    process.env.ACCESS_TOKEN_SECRET,{expiresIn:'30m'}
)
const refreshToken=jwt.sign(
    {"c_Name":foundCompany.c_Name},
    process.env.REFRESH_TOKEN_SECRET,
    {expiresIn:'30m'}

)
res.cookie('jwt',refreshToken,{
    httpOnly:true,
    secure:true,
    sameSite:'None',
    maxAge:7*24*60*60*1000
})
 res.json({accessToken ,id:foundCompany._id,company:foundCompany.c_Name,roles:foundCompany.roles})


    



})
// @v1.00
// @route get/auth/crefresh
// @access public

const c_refresh = (req,res)=>{
         const cookies = req.cookies 
    if(!cookies?.jwt) return res.status(401).json({msg:"Unauthorized"})
    const refreshToken=cookies.jwt
    jwt.verify(refreshToken,process.env.REFRESH_TOKEN_SECRET,asyncHandler(async(err,decoded)=>{
        if(err)return res.status(403).json({message:"Forbidden"})
        const foundCompany = await Company.findOne({c_Name:decoded.c_Name})
        if(!foundCompany)return res.status(401).json({message:"Unauthorized"})
        const active = foundCompany.active
        if(!active)return res.status(401).json({message:"un authorized"})
        
        
         
        const accessToken = jwt.sign(
    {
       "companyinfo":{
                    "c_Name":foundCompany.c_Name,   
                    "id":foundCompany._id,
                    'roles':foundCompany.roles
                }
    },
    process.env.ACCESS_TOKEN_SECRET,{expiresIn:"30m"}

)
return res.status(200).json({accessToken,roles:foundCompany.roles,c_Name:foundCompany.c_Name})

    }))



}


    
  





module.exports = {
    login,refresh,logout,c_Login,c_refresh
}
// {} is for destruction 