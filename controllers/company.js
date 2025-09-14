const Company = require('../models/Company')
const asyncHandler = require('express-async-handler')// keep us from using try and catch alot 
const jwt = require("jsonwebtoken")
const bcrypt = require('bcrypt')
const User = require('../models/User')


//@v1.00


//@desc get all companies
//@ get/getall
//@access Private
const getallcompanies =asyncHandler  (async (req,res)=>{
    //middleware to handle the request
    
    const comp = await Company.find().select('-password').lean()  
    if(!comp?.length){
        return res.status(400).json({message:'no companies found'})

    }
    res.json(comp)
    


})
//@v1.00
//@desc create a new company account
//@route post
//@access public
const create_New_Company = asyncHandler(async(req,res)=>{
    //Take the data
    const {c_Name,password,email}=req.body 
    //Confirm data
    if(!c_Name || !password) {
        return res.status(400).json({message:"ALL FIELDS ARE REQURIED"})

    }
    
    const duplicate = await Company.findOne({c_Name}).collation({locale:'en'}).lean().exec()
    if(duplicate){
        return res.status(409).json({message:`please choose another company name`})
    }
    const hashPwd = await bcrypt.hash(password,10); // 10 is the salting 
    const comp_obj = {c_Name,"password":hashPwd,email};
    const company = await Company.create(comp_obj);
    if(!company){
         res.status(400).json({message:`not created try again`})
    }
    const accessToken = jwt.sign(
            {
                "companyinfo":{
                    "c_Name":c_Name,   
                    
                }
            },
            process.env.ACCESS_TOKEN_SECRET,{expiresIn:'60m'}
        )
        const refreshToken=jwt.sign(
            {"comapny":c_Name},
            process.env.REFRESH_TOKEN_SECRET,
            {expiresIn:'1d'}
        
        )
        res.cookie('jwt',refreshToken,{
            httpOnly:true,
            secure:true,
            sameSite:'None',
            maxAge:7*24*60*60*1000
        })
        return res.status(200).json({message:`Account created Success ${c_Name}`,accessToken})






})
// @v1.00
// @get/company/
// @private Access
const getCompanyUsers = asyncHandler(async(req,res)=>{
    const {c_Name , username} = req.body
    
    if(!c_Name )return res.status(400).json({message:"all fields are required"})
    if(!username)return res.status(400).json({message:"user field required"})
    const user = await User.findOne({username}).exec()
    if(!user)return res.status(404).json({msg:"the user not found"})
    const allowedRoles = ['hr', 'manager'];
    const hasAllowedRole = user.roles.find(role => allowedRoles.includes(role.toLowerCase()));
    if(!hasAllowedRole) return res.status(403).json({message:"forbidden you are not hr or manager"})
        
        
        const name = await Company.findOne({c_Name}).select('-password').lean().exec()
        if(!name)return res.status(404).json({message:"no company found"})
        if(user.c_Name.toString() !== name._id.toString()) return res.status(403).json({msg:"the user is not assigned to this company "})
    const users = await User.find( {c_Name:name._id,roles:'Employee' } ).select('-password') .lean().exec();
    if(!users)return res.status(404).json({message:"no users found to this company"})

    return res.json ({users});

})
// @v1.00
// @patch /company/:usernameid
// @Private Access

const updateUser = asyncHandler(async (req, res) => {
    const { c_Name, firstname, lastname, active, roles, dob } = req.body;
    const { username } = req.params;

    // Input validation
    if (!c_Name || !firstname || !lastname || !active ) {
        return res.status(400).json({ message: "All fields are required." });
    }

    // Find the user by username, not by ID
    const user = await User.findOne({ username }).select("-password").exec();

    if (!user) {
        return res.status(404).json({ message: "User not found." });
    }

    // Authorization check
    // if (c_Name.toString() !== user.c_Name.toString()) {
    //     return res.status(403).json({ message: "Forbidden: You cannot update a user outside your company." });
    // }

    // Calculate age
    const today = new Date();
    const date_of_birth = new Date(dob);
    const age = today.getFullYear() - date_of_birth.getFullYear();

    // Update user properties
    user.active = active;
    user.roles = roles;
    user.dob = date_of_birth; // Store date as a Date object
    user.age = age;
    user.firstName = firstname;
    user.lastName = lastname;

    // Save the updated user
    const updatedUser = await user.save();

    if (updatedUser) {
        return res.status(200).json({ message: `${updatedUser.username} updated successfully.` });
    } else {
        return res.status(500).json({ message: "Failed to update user." });
    }
});
//@v1.00
//@desc deleting a specific user related to the company
//@route /delete
//@access private
const delete_select = asyncHandler(async (req, res) => {
    const { username } = req.params;

    // Step 1: Validate input
    if (!username) {
        return res.status(400).json({ message: 'Please provide a username to delete.' });
    }

    // Step 2: Find the user by username
    const user = await User.findOne({ username }).select("-password").exec();

    // Step 3: Handle case where user is not found
    if (!user) {
        return res.status(404).json({ message: 'User not found.' });
    }

 

    // Step 5: Delete the user
    const result = await user.deleteOne();

    // Step 6: Check for successful deletion
    if (result && result.deletedCount === 1) {
        return res.status(200).json({ message: `The user ${user.username} has been deleted successfully.` });
    } else {
        // This case would typically indicate an issue on the server,
        // as the user was found but not deleted.
        return res.status(500).json({ message: "Failed to delete user." });
    }
});
//testing api 
//!IMPORTANT

// const testing = asyncHandler(async(req,res)=>{
//     const {username} = req.body 
//     if(!username)return res.status(400).json({message:"field user required"})
//     const user = await User.findOne({username}).select("-password").populate('c_Name','-password').lean().exec()
//     if(!user)return res.status(400).json({message:"user not found"})
    
//         return res.json({user:{
//             user:user
//         }})
// })
const get_users_comp = asyncHandler(async(req,res)=>{
    const{c_Name} = req.body 
    if(!c_Name) return res.status(400).json({message:"company field required"})
    const company = await Company.findOne({c_Name}).select('-password').lean().exec()
    
    const users = await User.find({c_Name:company._id}).select('-password') .lean().exec();
    if(!users)return res.status(404).json({message:"no users found to this company"})

    return res.json ({users});


})



module.exports={
    getallcompanies,
    create_New_Company,
    getCompanyUsers,
    updateUser,
    delete_select,
    get_users_comp
    
}