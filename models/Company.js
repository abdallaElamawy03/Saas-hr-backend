const mongoose = require('mongoose')
const companySchema = new mongoose.Schema ({
    c_Name :{
        type:String,
        required : true
    },
    
    password:{
        type:String,
        required:true

    }, email:{
        type:String,
        required:true
    },
    active:{
        type:Boolean,
        default:true
    },roles:{
        type:[String],
        default:'company'
    }


})
module.exports = mongoose.model('company',companySchema);
