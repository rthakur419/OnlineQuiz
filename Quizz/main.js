var fs = require('fs');
//var data =[];
var un;
var data = (JSON.parse(fs.readFileSync('data.txt')));
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var path = require('path');
var cookieParser=require('cookie-parser');
var session =  require("express-session");
var flash = require("flash");
var mysql=require('mysql');


const db  = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1234567890',
    database: 'onlinequizz',
    port: 3306
  });
  db.connect(function(err){
    if (err) throw err;
    console.log("Connected To Mysql");
  });
  app.use(session({
    key:'user_sid',
    secret:'wwaf5s4132a1s56d',
    saveUninitialized:false,
    resave:false,
    cookie:{
      expires:60000000
    }
  }));
  app.use(cookieParser());
  app.use(bodyParser.json());
app.get('/', function(req, res) {
	res.sendFile(path.join(__dirname + '/login.html'));
});
var urlencodedParser=bodyParser.urlencoded({extended:true});
app.use(flash());
app.use(function(req, res, next){
    res.locals.success_messages = req.flash('success_messages');
    res.locals.error_messages = req.flash('error_messages');
    next();
});
app.post('/login',urlencodedParser,async (req,res)=>{
    var a=req.body;
    var sql1="select password from users where name=?";
    un = a.username;
    db.query(sql1,[a.username],async (err,result)=>{
      if(err)
      console.log(err);
      if(result.length == 0)
      {
        req.flash('signinuser','Email or Password incorrect !');
        res.redirect('/');
      }
      else
      {
        try{
        if(a.password==result[0].password)
        {
            console.log(a.password);
            console.log(result[0].password);
          req.session.name=req.body.name;
          res.redirect('/home');
        }
        else
        {
          req.flash('signinuser','Email or Password incorrect !');
          res.redirect('/');
        }
      }
      catch(e)
      {
        console.log(a.password);
        console.log(result[0].password);
        console.log("error in matchingpassword");
      }
      }
    })
    });
    

app.set('view engine','ejs');
app.get('/home',function(req, res){
 var username = un;
 console.log(username);
res.render( 'home',{username});
});
app.get('/signup',function(req, res){
    res.sendFile(path.join(__dirname + '/signup.html'))
});
app.post('/signup',urlencodedParser,(req,res)=>{
    var a=req.body;
    var sql1="select name from users where name=?";
    db.query(sql1,[a.username],(err,result)=>{
      if(err)
      console.log(err);
      if(result.length==0)
      {
        var password=a.password;
        var sql="insert into users values(?,?,?,?)";
        db.query(sql,[a.username,a.email,a.phoneno,a.password],(err,result)=>{
          if(err)
          console.log(err);
          res.redirect('/');
        })
      }
      else
      {
        req.flash('signupMessage','Username Already Exist !');
        res.redirect('/signup');
      }
    })
   });
   app.post('/createquiz2',(req,res)=>{
    var link='localhost:8000/tests/'+makeid(6);
    connection.query('insert into test values(?,?,?)',[req.body.username,req.body.testname,link],(err,result,f)=>{
        if(err){
            res.send(err);
        }else{
            console.log("Successfully generated quiz");
            connection.query('select * from questions',(err,result)=>{
                res.render('admin',{status:'quizcreation2',username:req.body.username,testlink:link,questions:result});
            })
            
        }
    })

})

app.post('/addques',(req,res)=>{
    connection.query('insert into questions values(?,?,?,?,?,?,?)',[req.body.question,req.body.option1,req.body.option2,req.body.option3,req.body.option4,req.body.rightanswer,req.body.testlink],(err,result)=>{
        if(err){
            res.send("Please try again");
        }else{
            connection.query('select * from questions where testlink =?',[req.body.testlink],(err,result1)=>{
                if(err){
                    res.send(err);
                }else{
                    res.render('admin',{status:'quizcreation',questions:result,username:req.body.username,testlink:req.body.testlink});
                }
            })
           
        }
    })
})
app.post('/addques2',(req,res)=>{
    connection.query('insert into questions values(?,?,?,?,?,?,?)',[req.body.question,req.body.option1,req.body.option2,req.body.option3,req.body.option4,req.body.rightanswer,req.body.testlink],(err,result)=>{
        if(err){
            res.send("Please try again");
        }else{
            connection.query('select * from questions',(err,result)=>{
                res.render('admin',{status:'quizcreation2',username:req.body.username,testlink:req.body.testlink,questions:result});
            })
           
        }
    })
})
app.post('/sharequiz',(req,res)=>{
    res.render('admin',{status:'share',link:req.body.link,username:req.body.username});
})

app.get('/tests/:id',(req,res)=>{
    console.log(req.originalUrl);
    connection.query('select * from questions where testlink=?',("localhost:8000"+req.originalUrl),(err,result)=>{
        
        if(err){
            res.send(err);
        }else{
            res.render('user',{status:'test',questions:result,score:0,msg:"All the best Let's see what you got!",questionNo:0,testlink:"localhost:8000"+req.originalUrl});
        }
    })
})
app.post('/login',(req,res)=>{
    connection.query('select * from admins where username=? and password=?',[req.body.username,req.body.password],(err,result)=>{
        console.log("object");
        if(result.length>0){
            
            connection.query('select testlink from test where username =?',[req.body.username],(err,result)=>{
                if(err){
                    res.send(err);
                }else
                res.render('admin',{status:'loggedin',links:result,username:req.body.username});
            })
            
        }else{
            res.send("Invalid Credentials");
        }
    })
})

app.post('/submit',(req,res)=>{
    connection.query('select * from questions where testlink=? and question=?',[req.body.testlink,req.body.question],(err,result,fields)=>{
        if(err){
            res.send(err);
        }else{
            if(result[0].rightanswer===req.body.rightanswer){
                connection.query('select * from questions where testlink=?',[req.body.testlink],(err,result)=>{
                    if(err){
                        res.send(err);
                    }else{
                        console.log(req.body.questionNo +" "+ result.length);
                        if(req.body.questionNo<result.length-1)
                        res.render('user',{status:'test',questions:result,testlink:req.body.testlink,score:( +req.body.score + 1),questionNo:( +req.body.questionNo + 1),msg:"Congrats that was a correct answer"});
                        else{
                            console.log("score="+req.body.score);
                            res.render('user',{status:'finalscore',score:(+req.body.score +1)});
                        }
                    }
                })
            }else{
                connection.query('select * from questions where testlink=?',[req.body.testlink],(err,result)=>{
                    console.log("Invalid Answer");
                    if(err){
                        res.send(err);
                    }else{
                        if(req.body.questionNo<result.length-1){
                        res.render('user',{status:'test',testlink:req.body.testlink,questions:result,score:req.body.score,questionNo:req.body.questionNo+1,msg:"Thats a wrong answer"});
                        }
                        else{
                            res.render('user',{status:'finalscore',testlink:req.body.testlink,score:req.body.score});
                        }
                    }
                })
            }
        }
    })
   
})
app.listen(80,()=>{
console.log("Server is up");
});