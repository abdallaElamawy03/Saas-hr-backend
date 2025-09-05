const User = require('../models/User')
const asyncHandler = require('express-async-handler')// keep us from using try and catch alot 
const jwt = require("jsonwebtoken")
const Company = require('../models/Company')

const bcrypt = require('bcrypt')
//@desc get all users 
//@route get/users
//@access Private
const getallUsers =asyncHandler (async (req,res)=>{
    const users = await User.find().select('-password').lean() // no reason to send the password back to the client 
    if(!users?.length){
        return res.status(400).json({message:'no users found'})

    }
    res.json(users)
    


})
//@desc Create new user
//@route Post/users
//@access Private
const createNewUser =asyncHandler (async (req,res)=>{
    const{username,password,roles,c_Name,dob,firstName,lastName}=req.body
    const today = new Date()
    const date_of_birth = new Date(dob)
   
    // Confirm data 

    if(!username || !password || !c_Name ){
        return res.status(400).json({message:"all fields are required "})

    } 
    const company = await Company.findOne({c_Name}).exec();
    if (!company)return res.status(404).json({ message: "Company not found" });

    const duplicate = await User.findOne({username:username}).exec()
    if(duplicate)return res.status(400).json({message:"find another name there is an employee with the same name"})
    
    const age = today.getFullYear()-date_of_birth.getFullYear()

    const hashPwd = await bcrypt.hash(password,10) // 10 is the salting 
    const userObject = (!Array.isArray(roles)||!roles.length)?{c_Name:company.id,username,"password":hashPwd,firstName,lastName,age,dob}:{c_Name:company.id,username,"password":hashPwd,firstName,lastName,roles,age,dob}

    //Create and store the new user 
    const user = await User.create(userObject)
    if(!user)return res.status(409).json({message:"error creating"})
    
       const accessToken = jwt.sign(
            {
                "UserInfo": {
                    "username": user.username,
                    "roles": user.roles,
                    "c_Name":user.c_Name
                }
            },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: '60m' }
        );

        const refreshToken = jwt.sign(
            { "username": user.username },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: '1d' }
        );

        // Set cookie and send response
        res.cookie('jwt', refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'None',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

     res.json({message:`the user created ${user.username} successfully `,user:{
        user:user.username,
        roles:user.roles,
        age:user.age,
        c_Name:company.c_Name
     }})
    


})
//@desc Update a user
//@route PATCH/users
//@access Private
const updateuser =asyncHandler (async (req,res)=>{
    const{username,password}=req.body 
    const{id}= req.params

    // Confirm data 
    if(!id || !username ){
        return res.status(400).json({message:"All field are required"})
    }
    const user = await User.findById(id).exec()
    if(!user){
        return res.status(400).json({message:"User not found"})
    }
    //Check for duplicate 
    const duplicate = await User.findOne({username}).collation({locale:'en',strength:2}).lean().exec()
    // Allow updates to the original user permission to the owned user 
    if(duplicate && duplicate?._id.toString()!==id){
        return res.status(409).json({message:"Duplicate username"})

    }
    user.username=username
    
    if(password){
        //Hashpassword
        user.password=await bcrypt.hash(password,10)//salt rounds

    }
    const updatedUser=await user.save()
    res.json({message:`${updatedUser.username} updated `})
})
const getUser  = asyncHandler(async (req, res) => {
    const { username } = req.body; // Extract the user ID from the request parameters

    // Find the user by ID and exclude the password field from the result
    const user = await User.findOne({username}).select("-password").populate('c_Name','c_Name').lean().exec();

    // Check if the user was found
    if (!user) {
        return res.status(404).json({ message: "User  not found" }); // Return 404 if user is not found
    }

    // Return the user data
    res.json({ user });
});
//for users
const users_company = asyncHandler(async(req,res)=>{
    const {c_Name,username} = req.body
    if(!c_Name ||!username)return res.status(400).json({message:"all fields are required"})
    const requesteduser = await User.findOne({username}).select('-password').lean().exec()
    if(!requesteduser)return res.status(404).json({message:"user not found"})
   

    const name = await Company.findOne({c_Name}).select('-password').lean().exec()
    if(!name)return res.status(404).json({message:"company name required"})
    if(requesteduser.c_Name.toString() !== name._id.toString() )return res.status(403).json({message:"forbidden"})
    const allowedRoles = ['hr', 'manager'];
    const hasAllowedRole = requesteduser.roles.find(role => allowedRoles.includes(role.toLowerCase()));
    if(!hasAllowedRole)return res.status(404).json({message:"not allowed"})
    const users = await User.find( {c_Name:name._id} ).select('-password') .lean().exec();
    if(!users)return res.status(404).json({message:"no users found to this company"})

    return res.json ({users});

})



const get_user_id = asyncHandler(async(req,res)=>{
    const {username} = req.params 
    if(!username) return res.status(400).json({msg:"the usernmae field is required"})
    const user = await User.findOne({username:username},'-password').populate('c_Name','c_Name').lean().exec()
    if(!user) return res.status(404).json({msg:"the user not found"})
    return res.status(200).json({user:user})
})

module.exports = {
    getallUsers,
    createNewUser,
    updateuser,
    getUser,
    users_company,
    get_user_id
}
