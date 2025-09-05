    const mongoose = require("mongoose")
    const autoIncrement = require('mongoose-sequence')(mongoose)
  

    const taskSchema = new mongoose.Schema({
        user : {
            type:mongoose.Schema.Types.ObjectId,
            required:true,
            ref:'User'

        },
        task:[{
            taskDate:{
                type:Date,
                
            },
            title:{
                type:String,
                default:"Title",
            
            },
            description:{
                type:String,
                default:'description',
                
            },
            dueDate:{
                type:Date
                
            },
            status:{
                type:String,
                default:"inprogress"
            },
            notes:[{
                user : {
                type:mongoose.Schema.Types.ObjectId,
                ref:'User',
                
                },
                note:{
                    type:String,
                    required:true
                    
                },
                date:{
                    type:Date,
                    default:new Date()
                }
            }]
                
            
            



            
        }],
        totalCompleted:{
            type:Number,
            default:0
        },
        totalLate:{
            type:Number,
            default:0
        },
        totalInprogress:{
            type:Number,
            default:0

        }


    },
    {
        timestamps:true
    }
    )
    taskSchema.plugin(autoIncrement,{
        inc_field:'taskId',
        id:'taskNum',
        start_seq:1
    })
    module.exports=mongoose.model('Task',taskSchema)