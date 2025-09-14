const asyncHandler = require('express-async-handler')// keep us from using try and catch alot 


const User = require('../models/User')
const Company = require('../models/Company')
const Task = require('../models/Task')
//@v1.00
//TESTING API 
//!IMPORTANT
const get_Alltasks = asyncHandler(async(req,res)=>{
    const task = await Task.find().lean().exec()
    if(!task)return res.status(404).json({message:"no tasks found"})
    
    return res.json({task})
})
//@v1.00
//@desc to create new or assign a task to the user , only hr,managers can assign the task 
//@route {post}/:userid
//@access Private
const new_Task = asyncHandler(async(req,res)=>{
    const {username,title,description,duedate,status}=req.body
    if(!username)return res.status(400).json({message:"username of requester required"})
    const{id}=req.params
    if(!id)return res.status(400).json({message:"user{id}receiver is required"})
    const requestedUser = await User.findOne({username}).select('-password').lean().exec()
    if(!requestedUser)return res.status(404).json({message:"the requested user is not found"})
    const taskRece = await User.findOne({username:id}).select("-password") // the username
    if(!taskRece)return res.status(404).json({message:"the task receiver is not found"})
    if(requestedUser.c_Name.toString() !== taskRece.c_Name.toString()) return res.status(403).json({message:"forbidden not the same company assigned"})
    const allowedRoles = ['hr', 'manager'];
    const hasAllowedRole = requestedUser.roles.find(role => allowedRoles.includes(role.toLowerCase()));
    if(!hasAllowedRole) return res.status(403).json({message:"forbidden you are not hr or manager"})
    
let task = await Task.findOne({user:taskRece._id}).exec()
if(!task){
    task = new Task({
        user:taskRece._id,
        task:[{
            taskDate:Date.now(),
            title:title,
            description:description,
            dueDate:duedate,
            status:status
            
            
        }]
    })
}else{
    task.task.unshift({
        taskDate:Date.now(),
        title:title,
        description:description,
        dueDate:duedate,
        status:status
    })
}

    switch(status){
    case 'inprogress':
        task.totalInprogress +=1
        break;
    case 'completed':
        task.totalCompleted +=1
        break;
    case 'late':
        task.totalLate +=1
        break;
    default:
        task.totalInprogress+=1


}

 try {
        const savedTask = await task.save();
        return res.status(200).json({ 
            msg: "The task updated successfully",
            task: savedTask 
        });
    } catch (error) {
        return res.status(500).json({ 
            msg: "Error saving the task",
            error: error.message 
        });
    }

})
//@v1.00
//@desc get user task profile by the task profile :id only hr,managers can access
//@route {get}/:taskid
//@access Private

const get_user_task_id = asyncHandler(async(req,res)=>{
    const {username} = req.body // the requester
    const{id} = req.params // the task id 
    if(!username)return res.status(400).json({msg:"username are required"})
    if(!id) return res.status(400).json({msg:"the id task is required"})
    const requestedUser = await User.findOne({username:username}).exec()
    const allowedRoles = ['hr', 'manager'];
    const hasAllowedRole = requestedUser.roles.find(role => allowedRoles.includes(role.toLowerCase()));
    if(!hasAllowedRole)return res.status(401).json({msg:"the user is not allowed"})
    const found = await Task.findById(id).populate('user','-password').populate('task.notes.user','username').exec()
    if(!found)return res.status(404).json({msg:"This user Tasks not found"})
    if(found.user.c_Name.toString() !== requestedUser.c_Name.toString())return res.status(403).json({msg:"you are not manager or hr for this company"})



    return res.status(200).json({found})
    

})
//@v1.00
//@desc get every user his own task profile 
//@route get/user
//@access Private only for the user assigned to this profile

const getuser_task = asyncHandler(async(req,res)=>{
    const{username}=req.body 
    if(!username)return res.status(400).json({msg:"username field required"})
    const user = await User.findOne({username}).exec()
    if(!user)return res.status(404).json({msg:"the user not found"})
    const user_id = user.id
    const task = await Task.find({user:user_id}).lean().exec()
    if(!task) return res.status(404).json({msg:"the user tasks not found"})
    if (!task.length)return res.status(200).json({msg:"no tasks assigned to this user"})
    
    return res.status(200).json({task})

})
//@v1.00
//@desc update the assigned task title ,or description ,and status
//@route patch/:taskid/:sub_task
//@access Private

//#EDIT THIS RESTAPI MAKE ONLY HR ,MANGER CAN UPDATE {E}
const update_task = asyncHandler(async (req, res) => {
    const { username, title, description, duedate, status } = req.body;
    const { id, task_id } = req.params;

    if (!username || !id || !task_id) {
        return res.status(400).json({ msg: "The fields are required" });
    }

    const task = await Task.findById(id).populate('user', 'c_Name').exec();
    if (!task) {
        return res.status(404).json({ msg: "The task not found" });
    }

    const requester_User = await User.findOne({ username }).exec();
    if (!requester_User) {
        return res.status(404).json({ msg: "The requested user is not found" });
    }

    if (requester_User.c_Name.toString() !== task.user.c_Name.toString()) {
        return res.status(403).json({ msg: "The requested user is not related to the company " });
    }

    const allowedRoles = ['hr', 'manager'];
    const hasAllowedRole = requester_User.roles.find(role => allowedRoles.includes(role.toLowerCase()));
    if (!hasAllowedRole) {
        return res.status(401).json({ msg: "The user is not allowed" });
    }

    const validate_status = ['inprogress', 'completed', 'late'];
    if (status && !validate_status.includes(status.toLowerCase())) {
        return res.status(400).json({ msg: "Invalid input for status" });
    }

    const subTask = task.task.find(tk => tk.id === task_id);
    if (!subTask) {
        return res.status(404).json({ msg: "The sub-task not found" });
    }

    const currentStatus = subTask.status;

    // Build an object with only the fields that were provided in the request body
    const updateFields = {};
    if (title !== undefined) updateFields.title = title;
    if (description !== undefined) updateFields.description = description;
    if (duedate !== undefined) updateFields.dueDate = duedate;
    if (status !== undefined) updateFields.status = status.toLowerCase();

    //using object.assign is to only change the fields you want to be changed onlly in mongoDb
    

    Object.assign(subTask, updateFields);

    if (status && currentStatus !== status.toLowerCase()) {
        // Decrement the old status count
        switch (currentStatus) {
            case 'inprogress':
                task.totalInprogress -= 1;
                break;
            case 'completed':
                task.totalCompleted -= 1;
                break;
            case 'late':
                task.totalLate -= 1;
                break;
        }

        // Increment the new status count
        switch (status.toLowerCase()) {
            case 'inprogress':
                task.totalInprogress += 1;
                break;
            case 'completed':
                task.totalCompleted += 1;
                break;
            case 'late':
                task.totalLate += 1;
                break;
        }
    }

    try {
        const savedTask = await task.save();
        return res.status(200).json({
            msg: "The task updated successfully",
            task: savedTask
        });
    } catch (error) {
        return res.status(500).json({
            msg: "Error saving the task",
            error: error.message
        });
    }
});
//@v1.00
//@desc create a new company account
//@route {delete}/:taskid/:subtaskid
//@access Private


const delete_subtask = asyncHandler(async (req, res) => {
    const { id, task_id } = req.params;
    const { username } = req.body;

    if (!username) return res.status(400).json({ msg: "The username is required." });
    if (!id || !task_id) return res.status(400).json({ msg: "The task id and subtask id are required." });

    const task = await Task.findById(id).populate('user', 'c_Name').exec();
    if (!task) return res.status(404).json({ msg: "The task profile not found." });

    const requester_User = await User.findOne({ username }).exec();
    if (!requester_User) return res.status(400).json({ msg: "The requester user is not found." });

    const allowedRoles = ['hr', 'manager'];
    const hasAllowedRole = requester_User.roles.find(role => allowedRoles.includes(role.toLowerCase()));
    if (!hasAllowedRole) return res.status(401).json({ msg: "The user is not allowed." });

    if (requester_User.c_Name.toString() !== task.user.c_Name.toString()) {
        return res.status(403).json({ msg: "Forbidden, you're not related to this company." });
    }

    // Find the subtask to be deleted
    const f_Sub_task = task.task.find(tk => tk.id === task_id);
    if (!f_Sub_task) return res.status(404).json({ msg: "The subtask not found." });

    // Use a switch case to decrement the total counts based on the subtask's status before deleting it
    switch (f_Sub_task.status) {
        case 'inprogress':
            task.totalInprogress -= 1;
            break;
        case 'completed':
            task.totalCompleted -= 1;
            break;
        case 'late':
            task.totalLate -= 1;
            break;
        default:
            break; // Do nothing if the status is unrecognized
    }

    // Filter out the subtask to delete it from the array
    task.task = task.task.filter(tk => tk.id !== task_id);

    try {
        const savedTask = await task.save();
        return res.status(200).json({
            msg: "The task was successfully deleted.",
            task: savedTask
        });
    } catch (error) {
        return res.status(500).json({
            msg: "Error deleting the task.",
            error: error.message
        });
    }
});
//@v1.00
//@desc get company tasks for every one responsible hr,managers
//@route {get}/company
//@access Private


const get_company_tasks = asyncHandler(async(req, res) => {
    const { c_Name } = req.body;
    if (!c_Name) return res.status(400).json({ message: "Company name (c_Name) is required" });

    // Find the company first
    const company = await Company.findOne({ c_Name }).exec();
    if (!company) return res.status(400).json({ message: "The company not found" });

    // Find all users belonging to this company
    const users = await User.find({ c_Name: company._id }).select('-password').lean().exec();
    if (!users || users.length === 0) return res.status(404).json({ message: "No users found for this company" });

    // Get user IDs to query tasks
    const userIds = users.map(user => user._id);

    // Find tasks for these users and populate user details
    const tasks = await Task.find({ user: { $in: userIds } })
        .populate({
            path: 'user',
            select: 'username firstName lastName c_Name'
        })
        .populate({
            path: 'task.notes.user',
            select: 'username firstName lastName'
        })
        .lean()
        .exec();

    if (!tasks || tasks.length === 0) return res.status(404).json({ message: "No tasks found for this company's users" });

    // Format the response
    const result = tasks.map(task => ({
        username: task.user?.username,
        userid: task.user?._id,
        firstname: task.user?.firstName,
        lastname: task.user?.lastName,
        company: task.user?.c_Name,
        taskid: task._id,
        tasks: task.task?.map(t => ({
            taskDate: t.taskDate,
            title: t.title,
            description: t.description,
            dueDate: t.dueDate,
            status: t.status,
            subtask_ID: t._id,
            notes: t.notes?.map(note => ({
                user: note.user?.username,
                firstname: note.user?.firstName,
                lastname: note.user?.lastName,
                note: note.note,
                date: note.date,
                noteId: note._id
            })) || []
        })) || [],
        totalCompleted: task.totalCompleted,
        totalLate: task.totalLate,
        totalInprogress: task.totalInprogress
    }));

    return res.status(200).json({ result });
});
//@v1.00
//@desc posting a new note for the user in his task also user can post a note
//@route {post}/note/:taskid/:subtaskid
//@access Private
const add_Note = asyncHandler(async(req,res)=>{
    const{id,subtask}=req.params
    const{username,note,date}=req.body 
    if(!id||!subtask||!username)return res.status(400).json({msg:'the id or subtask or username not found'})
    const user = await User.findOne({username}).exec()
    if(!user)return res.status(404).json({msg:"the user not found"})
    const task = await Task.findById(id).exec()
    if(!task)return res.status(404).json({msg:"the task not found"})
    const subTaskIndex = task.task.findIndex(tk => tk.id === subtask);
    if (subTaskIndex === -1)return res.status(404).json({ msg: "The sub-task not found" });
    
    const new_Note = {
        user:user.id,
        note:note,
        date:date
    }
    task.task[subTaskIndex].notes.unshift(new_Note)
    
    try {
        const savedTask = await task.save();
        return res.status(200).json({ 
            msg: "The task updated successfully",
            task: savedTask 
        });
    } catch (error) {
        return res.status(500).json({ 
            msg: "Error saving the task",
            error: error.message 
        });
    }



    })


//@v1.00
//@desc get all the notes to the subtask
//@route {get}/note/:id/:subtask
//@access Private

const get_allNotes = asyncHandler(async(req,res)=>{
    const{id,subtask}=req.params
    if(!id||!subtask)return res.status(400).json({msg:"the {taskId} and {subtaskId} required"})
    const task = await Task.findById(id).populate('user','-password').populate('task.notes.user','-password').exec()
    if(!task)return res.status(404).json({msg:"the Task profile not found"})
    const subTaskIndex = task.task.findIndex(tk => tk.id === subtask);
    if (subTaskIndex === -1)return res.status(404).json({ msg: "The sub-task not found" });
    try{

        const notes = task.task[subTaskIndex].notes.map(ne=>({
            username:ne.user.username,
            firstName:ne.user.firstName,
            userId:ne.user.id,
            note:ne.note,
            postedDate:ne.date,
            noteId:ne.id
    
        }))
        return res.status(200).json({notes})
    }catch(error){
        return res.status(500).json({msg:error.message})
    }
    
    

})

//@v1.00
//@desc create a new company account
//@route {delete}/note/:id/:subtask
//@access Private
const delete_Note =asyncHandler(async(req,res)=>{
    const{id,subtask} = req.params
    const {note_id,username}= req.body 
    if(!id||!subtask||!note_id)return res.status(400).json({msg:"TaskId , subTaskId , noteId required"})
    if(!username)return res.status(400).json({msg:"the username is required"})
    const user = await User.findOne({username}).exec()
    if(!user)return res.status(404).json({msg:"the user is not found "})
    const user_id = user.id
    const task = await Task.findById(id).exec()
    if(!task) return res.status(404).json({msg:"the task is not found"})
    const subTaskIndex = task.task.findIndex(tk => tk.id === subtask);
    if (subTaskIndex === -1) {
        return res.status(404).json({ msg: "The sub-task not found" });
    }

    const get_Note = task.task[subTaskIndex].notes.find((ne)=>{
        return ne.id === note_id
    })
    if(get_Note.user.toString() !== user_id.toString())return res.status(403).json({msg:"forbidden you are not the owner of the note"})
        try{
    task.task[subTaskIndex].notes= task.task[subTaskIndex].notes.filter((ne)=>{
        return ne.id !== note_id
    })
    }catch(error){
        return res.status(500).json({msg:error.message})
    }
      try {
        const savedTask = await task.save();
        return res.status(200).json({ 
            msg: "The note deleted successfully",
            task: savedTask 
        });
    } catch (error) {
        return res.status(500).json({ 
            msg: "Error saving the task",
            error: error.message 
        });
    }


     
        

    


})





//viewing the subtask info 

const view_Task =asyncHandler(async(req,res)=>{
    const {taskid,subtask} = req.params 
    if(!taskid || !subtask) return res.status(400).json({msg:"the task id and the subtask id is required"})
    const task = await Task.findById(taskid).populate("user",'username').exec()
    if(!task)return res.status(404).json({msg:"the task profile is not found"})
    const subTaskIndex = task.task.findIndex(tk => tk.id === subtask);
    if (subTaskIndex === -1) {
        return res.status(404).json({ msg: "The sub-task not found" });
    }

    return res.status(200).json({task:task,subtask:task.task[subTaskIndex]})
    
    
    

    

})

const checkLateTasks = asyncHandler(async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to the beginning of the day

    // Find all task documents
    const allTaskDocs = await Task.find({});

    if (!allTaskDocs || allTaskDocs.length === 0) {
      return res.status(200).json({ message: "No tasks found to check." });
    }

    let updatedCount = 0;

    // Loop through each user's task document
    for (const taskDoc of allTaskDocs) {
      // Loop through the tasks array for that user
      for (const taskItem of taskDoc.task) {
        // Check if the due date has passed and the status isn't 'completed' or 'late'
        if (
          new Date(taskItem.dueDate) < today &&
          taskItem.status !== 'completed' &&
          taskItem.status !== 'late'
        ) {
          // Update the status
          taskItem.status = 'late';
          // Update the counts
          taskDoc.totalInprogress -= 1;
          taskDoc.totalLate += 1;
          updatedCount++;
        }
      }
      // Save the changes to the task document
      await taskDoc.save();
    }

    if (updatedCount > 0) {
      res.status(200).json({
        message: `${updatedCount} tasks updated to 'late' status.`,
      });
    } else {
      res.status(200).json({ message: "No tasks needed to be updated." });
    }
  } catch (error) {
    res.status(500).json({
      msg: "Error checking for late tasks",
      error: error.message,
    });
  }
});


module.exports={
    get_Alltasks,
    new_Task,
    get_user_task_id,
    getuser_task,
    update_task,
    delete_subtask,
    get_company_tasks,
    add_Note,
    delete_Note,
    get_allNotes,
    view_Task,
    checkLateTasks

}