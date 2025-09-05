const express = require('express')
const router = express.Router()
const company = require('../controllers/company')
const verifyjwt = require('../middleware/verifyJwt')
// router.use(verifyjwt)
// //
router.route('/getall',verifyjwt).get(company.getallcompanies)
//

router.route('/').post(company.create_New_Company).delete(company.delete_select)
//users
router.route('/users').post(company.getCompanyUsers)
// id 
router.route("/:username").patch(company.updateUser)
//test
router.route('/t').get(company.testing)


module.exports=router 

