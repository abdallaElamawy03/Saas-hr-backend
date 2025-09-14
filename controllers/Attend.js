const Attendance = require('../models/Attendance')
const asyncHandler = require('express-async-handler')// keep us from using try and catch alot 
const jwt = require("jsonwebtoken")
const bcrypt = require('bcrypt')
const User = require('../models/User')
const Company = require('../models/Company')
// @v1.00
//@route post/attend/
//@access Private
const dailyattend = asyncHandler(async(req,res)=>{
    const {c_Name, status,description} = req.body 
    const{username} = req.params

    if (!username || !status||!c_Name )return res.status(400).json({message:"fields are required"})
    const validStatuses = ['fullday', 'halfday', 'weekend', 'late', 'absent'];
    if (!validStatuses.includes(status)) return res.status(400).json({ message: 'Invalid status value' });
    
    const user = await User.findOne({username}).select("-password").exec()
    if(!user) return res.status(404).json({message:"user not found"})
    let attendance = await Attendance.findOne({ user: user._id });
    
    if (!attendance) {
        attendance = new Attendance({
            user: user._id,
            log: [{
                date:new Date(),
                status:status,
                description:description
            }]
        });
    }else{

        attendance.log.unshift({
            date:new Date(),
            status: status,
            description:description
        });
    
    }
    switch (status) {
            case 'fullday':
                attendance.totalFullday += 1;
                break;
            case 'halfday':
                attendance.totalHalfday += 1;
                break;
            case 'late':
                attendance.totalLate += 1;
                break;
            case 'weekend':
                attendance.weekEnd += 1;
                break;
            case 'absent':
                attendance.totalAbsent += 1;
                break;
        }
    const savedAttendance = await attendance.save();
    if(!savedAttendance)return res.status(409).json({message:"did not saved please try again"})

    return res.json({savedAttendance})        
})
// @v1.00
//@route get/attend/
//@access Private
const get_company_user_attend = asyncHandler(async (req, res) => {
  const { c_Name } = req.body;
    
    const company = await Company.findOne({c_Name}).exec()
  // Validate input
    if (!c_Name) return res.status(400).json({ message: "Company ID (c_Name) is required" });
    
    const attendances = await Attendance.find({}).populate({path:'user',match:{c_Name:company.id},select:'-password'}).lean().exec()

    if(!attendances)return res.status(400).json({message:"The attendance not found"})


    //filter users with null value
    const filteredAttendances = attendances.filter(att => att.user !== null);
    if(filteredAttendances.length === 0)return res.status(404).json({message:"no any one having attendance yet"})

    const result = filteredAttendances.map(att=>({
        username : att.user.username,
        id:att.user._id,
        firstname:att.user.firstName,
        company:att.user.c_Name,
        attendance:att._id,

        log:att.log.map(log=>({
            logid : log._id,
            status:log.status,
            description:log.description
        })),
        Totalfulldays:att.totalFullday,
        Totalhalfdays:att.totalHalfday,
        Totalabsent : att.totalAbsent,
        Totallate:att.totalLate,
        Totalweekends:att.weekEnd

    }))
    if(!result)return res.status(400).json({message:"error result "})
    
    
   

    return res.status(200).json({result})
})



// @v1.00
//@route get/attend/user/username
//@access Private
const get_User_Attend =asyncHandler(async(req,res)=>{
    const{username}= req.body
    if(!username)return res.status(400).json({message:"username for the attend profile"})
    const user = await User.findOne({username}).exec()

    const attend = await Attendance.findOne({user:user._id}).lean().exec()
    if(!attend)return res.status(400).json({message:"the attend with the this id not found"})
    
    return res.status(200).json({attend})

})
const get_User =asyncHandler(async(req,res)=>{
    const{username}= req.params
    if(!username)return res.status(400).json({message:"username for the attend profile"})
    const user = await User.findOne({username}).exec()

    const attend = await Attendance.findOne({user:user.id}).lean().exec()
    if(!attend)return res.status(400).json({message:"the attend with the this id not found"})
    
    return res.status(200).json({attend})

})



// @v1.00
//@route update/attend/attend:id/log:id
//@access Private
const update_log_id = asyncHandler(async(req, res) => {
    const { id, logs } = req.params;
    const { status, description } = req.body;
    
    // Input validation
    const validStatuses = ['fullday', 'halfday', 'weekend', 'late', 'absent'];
    if (!validStatuses.includes(status?.toLowerCase())) {
        return res.status(400).json({ message: 'Invalid status value' });
    }
    if (!id || !logs) {
        return res.status(400).json({ message: "Attendance ID and log ID required" });
    }

    // Find attendance record
    const attendance = await Attendance.findById(id).exec();
    if (!attendance) {
        return res.status(404).json({ message: "Attendance record not found" });
    }

    // Find the log index
    const logIndex = attendance.log.findIndex(log => log.id === logs);
    if (logIndex === -1) {
        return res.status(404).json({ message: "Log not found" });
    }

    // Store current status before updating
    const currentStatus = attendance.log[logIndex].status.toLowerCase();
    const newStatus = status.toLowerCase();

    // Prepare updated log
    const updatedLog = {
        ...attendance.log[logIndex],
        date: new Date(),
        status: newStatus,
        description: description
    };

    // Update counters if status changed
    if (newStatus !== currentStatus) {
        // Decrement old status counter
        switch (currentStatus) {
            case 'fullday':
                attendance.totalFullday = Math.max(0, attendance.totalFullday - 1);
                break;
            case 'halfday':
                attendance.totalHalfday = Math.max(0, attendance.totalHalfday - 1);
                break;
            case 'late':
                attendance.totalLate = Math.max(0, attendance.totalLate - 1);
                break;
            case 'weekend':
                attendance.weekEnd = Math.max(0, attendance.weekEnd - 1);
                break;
            case 'absent':
                attendance.totalAbsent = Math.max(0, attendance.totalAbsent - 1);
                break;
        }

        // Increment new status counter
        switch (newStatus) {
            case 'fullday':
                attendance.totalFullday += 1;
                break;
            case 'halfday':
                attendance.totalHalfday += 1;
                break;
            case 'late':
                attendance.totalLate += 1;
                break;
            case 'weekend':
                attendance.weekEnd += 1;
                break;
            case 'absent':
                attendance.totalAbsent += 1;
                break;
        }
    }

    // Update the log in the array
    attendance.log[logIndex] = updatedLog;

    // Save the changes
    try {
        const savedAttendance = await attendance.save();
        return res.status(200).json({
            message: "Log updated successfully",
            updatedLog: updatedLog
           
        });
    } catch (error) {
        console.error("Error saving attendance:", error);
        return res.status(500).json({ message: "Error saving attendance record" });
    }
});
// @v1.00
//@route get/attend/attend:id/log:id
//@access Private
const get_log_id = asyncHandler(async(req,res)=>{
    const{id,logs} = req.params
    if(!id||!logs)return res.status(400).json({message:"the attend id and log id required"})

    const attendance = await Attendance.findById(id).exec()    
    if(!attendance)return res.status(404).json({message:"the attendance is not found"})
    const log = attendance.log.find((log)=>{
            return log.id === logs
        })
    if(!log)return res.status(404).json({message:"log not found"})

    return res.json({log})
 
    
    


})
// @v1.00
//@route update/attend/attend:id/log:id
//@access Private
const delete_log_id = asyncHandler(async (req, res) => {
    const { id, logs } = req.params;

    const attendance = await Attendance.findById(id).exec();
    if (!attendance) return res.status(404).json({ message: "Attendance record not found" });

    // Find the log to be deleted
    const logToDelete = attendance.log.find(log => log.id === logs);
    if (!logToDelete) return res.status(404).json({ message: "Log not available" });

    // Store the status before deleting for counter adjustment
    const currentStatus = logToDelete.status.toLowerCase();

    // Remove the log from the array
    attendance.log = attendance.log.filter(log => log.id !== logs);

    // Update the counters based on the deleted log's status
    switch (currentStatus) {
        case 'fullday':
            attendance.totalFullday =  attendance.totalFullday - 1;
            break;
        case 'halfday':
            attendance.totalHalfday =  attendance.totalHalfday - 1;
            break;
        case 'late':
            attendance.totalLate =  attendance.totalLate - 1;
            break;
        case 'weekend':
            attendance.weekEnd = attendance.weekEnd - 1;
            break;
        case 'absent':
            attendance.totalAbsent = attendance.totalAbsent - 1;
            break;
        default:
            console.warn(`Unknown status encountered: ${currentStatus}`);
    }

    try {
        const savedAttendance = await attendance.save();
        if (savedAttendance) {
            return res.status(200).json({ 
                message: "Log deleted successfully"
                
            });
        } else {
            return res.status(409).json({ message: 'Failed to save attendance record' });
        }
    } catch (error) {
        console.error("Error saving attendance:", error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});
// TESTING 
// const getallattend = async(req,res)=>{
//     const attend = await Attendance.find({}).exec()

//     res.json({attend})
// }



module.exports={
    dailyattend,
    get_company_user_attend,
    delete_log_id,
    get_User_Attend,
    // getallattend,
    update_log_id,get_log_id,
    get_User

}