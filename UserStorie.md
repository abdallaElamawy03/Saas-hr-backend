1. [E] this is the user stories
# A = task with project + project 
# B = task with tags #IMPORTANT #NEW
# C = task with CONTEXT #HOME
# D = task with DUEDATE {DDMMYY} 
# E completed 



# [E] Company Model
# [E] User Model 
# [E] Task Model
# [E] Attendance Model 
//// Company Api's
# [E] Company Api => {GET} GET ALL COMPANIES  
# [E] Company Api => {post} create , login , logout 
# [E] Company Api => {get} getting every Employee details signed to this company 
# [E] Company Api => {patch} to edit every user access and role 
# [E] Company Api => {delete} delete the selected user 
# [E] User Api => create every user 
// User Api's

# [E]  User Api =>{post} create the user identified with the company
# [E] User Api => {Get} User by ID 
# [E] User Api => {Get} All Users 
# [E] User Api => {patch} Update User by ID 
# [A] User Api => {post} handle the firstname and lastname of the user if it doesn't exist  
# [A] User Api => {patch} add the attributes user firstname and lastname 


// Attendance Api's
# [E] Attend Api => {get}every user attend
# [E] Attend Api => {get}every company users attend
# [E] Attend Api => {post}new attend
# [E] Attend Api => {delete} attend (log)
# [E] Attend Api => {update} attend (log) //there is an edit 

# [E] Attend Api => {get} attends with params 

///
# [E] User Api => {patch} (update_user) => only make it for his info
# [E] Attend Api => {get} (get_company_user_attend) in attend to check if the user related to the company and change it to req.params 


///

then start for the tasks api 

// Task Api 
# [E] {post} to every user his own task ,by{id} => hr,managers,owners
# [E] {get} to every user his own task ,by{id} => hr,managers,owners
# [E] {get} to every user his own task ,by{username} => owned users
# [E] {patch} to edit the task {id}=>{id} => hr,managers,owners
# [E] {delete} to delete the task {id}=>{id} => hr,managers,owners
# [E] {get} to get all the company tasks => hr,managers,owners

// note Api
# [E] {post} post new note assigned to taskid/subtaskid
# [E] {get} notes to taskid/subtask
# [E] {delete} note and check if the user is the owner of the task or not









