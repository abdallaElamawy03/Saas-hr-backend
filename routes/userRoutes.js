//the router file for the users api 
const express = require('express')
const router = express.Router()
const users = require('../controllers/users')
const verifyjwt = require("../middleware/verifyJwt")
// router.use(verifyjwt)
router.route('/')
    .get(users.getallUsers)
    .post(users.createNewUser);
    
    ///users
    router.route('/t').get(users.users_company)
    router.route('/:id').patch(users.updateuser);
    router.route('/getuser/:username').get(users.get_user_id)
    router.route('/getuser').post(users.getUser)

module.exports = router