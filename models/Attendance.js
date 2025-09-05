const mongoose = require('mongoose')
const attendanceSchema = new mongoose.Schema({
    user : {
            type:mongoose.Schema.Types.ObjectId,
            required:true,
            ref:'User'
    
        },
    log:[{
        date:{
            type:Date,
            Default:new Date()
        },
        status:{
            type:String,
            Default:'absent',
           
          
        },
        description:{
            type:String,
            default:"description"
        }
    }],

    totalFullday: {
        type: Number,
        default: 0
    },
    totalAbsent: {
        type: Number,
        default: 0
    },
    totalLate: {
        type: Number,
        default: 0
    },
    totalHalfday:{
        type:Number,
        default:0
    },
    weekEnd:{
        type:Number,
        default:0

    }
});


module.exports = mongoose.model('attendance',attendanceSchema); 