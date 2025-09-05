const express = require('express')
const router = express.Router()
const verifyjwt = require('../middleware/verifyJwt')
const task = require('../controllers/task')
router.route('/').get(task.get_Alltasks)
router.route('/user').post(task.getuser_task)
//company
router.route('/company').post(task.get_company_tasks)

router.route('/:id').post(task.new_Task)
router.route('/taskprofile/:id').post(task.get_user_task_id)
router.route('/gettask/:taskid/:subtask').get(task.view_Task)
router.route('/:id/:task_id').patch(task.update_task).delete(task.delete_subtask)
//notes
router.route('/note/:id/:subtask').post(task.add_Note).delete(task.delete_Note).get(task.get_allNotes)



module.exports=router