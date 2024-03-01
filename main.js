const express = require('express')
const app = express()
const port = 8000
const path = require("path");
const uuid = require('uuid');
const uuidId = uuid.v4();
const cookieParser = require('cookie-parser');
const multer = require('multer');

app.set("view engine", "ejs")
app.use(express.static(path.join(__dirname, 'public')))
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser())
// db.js
const connection = require('./views/database');



// linkId = 5(profile), 1=dashboard, 2=alltasks, 3.2=viewEmp, 3.3=allocatoin


app.get('/', (req, res) => {
  
  let getCookie = req.cookies.user;
  let total;
  if(req.cookies.user){
    connection.query('SELECT count(pid) as total FROM allprojects where ownerId= ?',getCookie,(error, results) => {
      if (error) throw error;
      if(results[0].total<=0){
        total=results[0].total;
        res.render('homeLite.ejs',{getCookie,total});
      }
      else{
        let selectQuery = `select * from signups as s join allprojects as p on s.id=p.ownerId where p.ownerId= ?;`;
        let val = [getCookie]
        connection.query(selectQuery, val,(e, r) => {
          if (e) throw e;
          total=results[0].total;

          res.render('homeLite.ejs',{getCookie,data:r,total});
        });
      }
      
    });
  }
  else{
    res.render('homeLite.ejs',{getCookie});
  }

})

// middleware used in sending cookies in navbar
app.use((req, res, next) => {
  res.locals.getCookie = req.cookies.user; 
  next();
});

let signUp;

app.get('/signup',(req,res)=>{
  
  signUp=true;
  let exist = req.query.exist;

  res.render('signup.ejs',{signUp,exist})
})

app.post('/signupData',(req,res)=>{
  let {name,email,password} = req.body;

  let q=`select count(email) as total from signups where email = ?;`;
  let v=[email]
  connection.query(q,v,(e,emailExistence)=>{
    if(e)throw e;
    if(emailExistence[0].total != 0){
      let exist=1;
      res.redirect(`/signup?exist=${exist}`)
    }
    else{
      const signUpQuery = `insert into signups(id,email,password,name) values(?,?,?,?);`;
      let value = [uuidId,email,password,name];
      connection.query(signUpQuery,value,(err,success)=>{
        if(err) throw err;
        res.redirect('/')
      })
    }
  })
  
})

app.get('/login',(req,res)=>{
  signUp = false; 
  let exist=0;
  res.render('signup.ejs',{signUp,exist})
})

app.post('/loginData',(req,res)=>{
  let {email,password} = req.body;
  let q=`select * from signups where email = ? and password=?;`;
  let v=[email,password]
  connection.query(q,v,(e,data)=>{
    if(e)throw e;
    else{
      if(data.length <= 0){
        res.send('email or paswrd is incorrect')
      }
      else{
        if(data[0].email == email && data[0].password == password ){
          res.cookie('user', data[0].id, { expires: new Date(Date.now() + 900000), httpOnly: true });
          
          res.redirect('/')
        }
      }
    }
  })
})

app.get('/logout',(req,res)=>{
  
  res.clearCookie('user')
  res.redirect('/')
})

app.get('/dashBoard', (req, res) => {
  if(req.cookies.user){
    const projId = req.query.projectId;
    const linkId = req.query.linkId;
    const allocateId = req.query.allocateId;
    

    // task completion updation   
    const done = req.query.done;
    
    let taskComplete;
    const task_completed=req.query.task_completed; 
    if(task_completed == 1){
      const taskId=req.query.taskId;
      taskComplete = `update tasks set completed = ${task_completed} where taskId=${taskId} and pid=${projId};`;
      connection.query(taskComplete,(e,ms)=>{
        if(e) throw e;
        res.redirect(`/dashBoard?projectId=${projId}&linkId=2&done=1`)
      })
    }

  // query for allocat button to show emp name and task name
    const allocationData = `select * from employes as e join tasks as t on e.taskId = t.taskId and t.pid = e.pid;`;

    let query = `select * from allprojects where ${projId} = pid;`;
    // let task_query = `select t.taskId,t.taskName,t.taskDesc, t.completed from allprojects as ap join tasks as t on ap.pid=t.pid where ap.pid and t.pid = ${projId};`;
    let task_query = `select t.taskId,t.taskName,t.taskDesc, t.completed from allprojects as ap join tasks as t on ap.pid=t.pid where ap.pid and t.pid = ${projId};`;

    let employe_query = `select * from employes where pid = ${projId};`;
    
    // data for profile
    
    connection.query(query, (err,projectData)=>{
      if(err) throw err;
      connection.query(task_query,(er,taskData)=>{
        connection.query(employe_query, (ee,employesData)=>{
          // for allocation connection
          connection.query(allocationData,(e,allocatedData)=>{
              res.render('dashboard.ejs',{data:projectData,taskData,linkId,employesData,allocateId,allocatedData,done});            
          })
        })
      })

    })
  }
  else{
    res.redirect('/login')
  }
})

app.get('/addproject', (req, res) => {
  if(req.cookies.user){
    res.render("addProduct.ejs")
  }
  else{
    res.redirect("/login");
  }
})

const upload = multer({storage:multer.memoryStorage()});

app.post('/addprojectData',upload.single('imageFile'), (req, res) => {

    const projectImage=req.file.buffer.toString('base64');
    

    let sc = req.cookies.user

    var data = req.body;
    var title = data.title;
    var subtitle =  data.subtitle
    var description = data.description
  
  
    let queryForpId="select pid from allprojects order by pid desc limit 1;";
    const query = "INSERT INTO allprojects (pid, ptitle, psubtitle,projectimg,pdescription,ownerId) VALUES (?, ?, ?, ?,?,?)";
  
    connection.query(queryForpId,(ee,result)=>{
      if(ee) throw ee;
      let pid;
      if(result.length == 0){
        pid=0;
      }
      else{
        pid = result[0].pid;
      }
      
      pid=pid+1;
      const values = [pid,title, subtitle, projectImage, description,sc];
  
      connection.query(query, values, (error, results) => {
        if (error) throw error;
        res.redirect("/")
      })
    })
})

app.post('/taskform', (req, res) => {
  let currentProjectId = req.query.projectId;

  var data = req.body;
  let taskName = data.tn;
  let taskdesc = data.tdesc;

  var newTaskqueryId = `select taskId from tasks order by taskId desc limit 1;`;
  connection.query(newTaskqueryId,(err,msg)=>{    
    if(err) throw err;
    let taskId;
    let length = msg.length;

    if(length == 0){
      taskId=1;
    }
    
    else{
      let fetchedTId = msg[0].taskId;
      fetchedTId+=1;
      taskId=fetchedTId;
    }

    const newTaskInsertQuery = "INSERT INTO tasks(taskId,taskName,taskDesc,pid) VALUES (?, ?, ?, ?)";
    const values = [taskId, taskName, taskdesc, currentProjectId];
    
    connection.query(newTaskInsertQuery,values,(e,m)=>{
      if (e)throw e;
    })

  })

  res.redirect(`/dashBoard?projectId=${currentProjectId}&linkId=2`)

})

app.get('/deleteProject', (req, res) => {
  const projId = req.query.projectId;

  let query = `delete from allprojects where ${projId} = pid;`;

  connection.query(query, (err,data)=>{
    if(err) throw err;
    res.redirect('/')

  })
})

app.post('/addEmploye',(req,res)=>{
  const projId = req.query.projectId;
  
  var data = req.body;

  var ename = data.en;
  var elname =  data.eln
  var eemail = data.ee;
  
  
  let query="insert into employes(ename,elname,eemail,pid) values(?,?, ?, ?)";
  let values = [ename,elname,eemail,projId];

  connection.query(query,values,(err,msg)=>{

    if(err){
      res.send('wrong');
      throw err;
    }
    else{
      res.redirect(`/dashBoard?projectId=${projId}&linkId=3.2`)
    }
  })
})

app.post('/allocation',(req,res)=>{
  const projId = req.query.projectId;

  var {employeName, taskName} = req.body;
  
  let taskIdFind = `select taskId from tasks where taskName = ?;`;
  let v=[taskName]
  
  let empIdFind = `select eid from employes where ename = ?;`;
  let va=[employeName]

  let updateQuery = "update employes set taskId = ? where eid = ? and pid = ?;";

  connection.query(taskIdFind,v,(err,tId)=>{
    if (err)throw err;
    connection.query(empIdFind,va,(e,eId)=>{
    if (e)throw e;
    
      let taskId = tId[0].taskId;
      let empId = eId[0].eid;
      console.log(empId);
    
      let value = [taskId,empId,projId]

      connection.query(updateQuery,value,()=>{
        res.redirect(`/dashBoard?projectId=${projId}&linkId=3.3`);
      })

    })
  })  
})

app.get('/delete1task',(req,res)=>{
  const taskId = req.query.taskId;
  let projId = req.query.projId;

  let deleteTask = req.query.deleteTask;
  let deleteAllocatedEmp = req.query.deleteAllocatedEmp;

  let deleted = req.query.deleted;
  if(deleted==1)
  {
    let empId = req.query.empId;
    let deleteEmpquery = `delete from employes where eid = ${empId} and pid = ${projId};`;
    connection.query(deleteEmpquery,(err,del)=>{
      if(err)throw err;
      res.redirect(`/dashBoard?projectId=${projId}&linkId=3.2`)
    })
  }
  else if(deleteAllocatedEmp == 1){
    let empId = req.query.empId;
    let delAllocatedEmpquery = `update employes set taskId=null where eid = ${empId} and pid=${projId};`;
    connection.query(delAllocatedEmpquery,(err,succ)=>{
      if(err)throw err;
      res.redirect(`/dashBoard?projectId=${projId}&linkId=3.3`)
      
    })
  }
  
// deleting a task
  else if(deleteTask == 1){

    let deletingTask = `delete from tasks where taskId=${taskId};`;

      connection.query(deletingTask,(err,data)=>{
        if(err)throw err;
        res.redirect(`/dashBoard?projectId=${projId}&linkId=2`)
      })
  }
})

app.get("/deleteAllTasks",(req,res)=>{
  let q = "truncate table tasks;";
  let query = connection.query(q,(err,data)=>{
    if(err)throw err;
    res.send("hey")
})
})


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
  
})



