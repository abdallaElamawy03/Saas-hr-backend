const mongoose = require("mongoose")
const today = new Date()
const userSchema = new mongoose.Schema({
    c_Name:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref:'company'
    },
    username : {
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    firstName:{
        type:String,
        default:"firstName"
    },
    lastName:{
        type:String,
        default:"lastName"
    },
    roles:{
        type:[String],
        default:["Employee"]
        
    },
    active:{
        type:Boolean,
        default:true

    },age:{
        type:String,
        default:today
    },
    dob:{
        type:Date,
        default:today
    }


})
module.exports=mongoose.model('User',userSchema)