const express = require('express')
const router = express.Router()
const verifyjwt = require('../middleware/verifyJwt')
const attend = require('../controllers/Attend')

// router.use(verifyjwt)
router.route('/company').post(attend.get_company_user_attend)
//
router.route('/user').post(attend.get_User_Attend)  
//:username
router.route('/:username').post(attend.dailyattend).get(attend.get_User)

//:attendid/:logid
router.route('/:id/:logs').patch(attend.update_log_id).delete(attend.delete_log_id)


module.exports=router 
