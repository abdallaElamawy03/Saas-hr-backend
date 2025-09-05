const express = require("express")
const router = express.Router()
const authController = require("../controllers/authController")
const loginLimiter = require("../middleware/loginLimiter")
// @user routes
router.route('/')
.post(loginLimiter, authController.login)

router.route('/refresh')
.get(authController.refresh)
router.route('/logout')
.post(authController.logout)
////////////
// @company routers 
router.route('/clogin').post(loginLimiter,authController.c_Login)
router.route('/crefresh').get(authController.c_refresh)

module.exports=router