const express = require('express')
const router = express.Router()
const company = require('../controllers/company')
const verifyjwt = require('../middleware/verifyJwt')
// router.use(verifyjwt)
// //
router.route('/getall',verifyjwt).get(company.getallcompanies)
//

router.route('/').post(company.create_New_Company)
//users
router.route('/users').post(company.getCompanyUsers)
// id 
router.route("/:username").patch(company.updateUser).delete(company.delete_select)
//get by company name only 
router.route('/company').post(company.get_users_comp)



module.exports=router 

