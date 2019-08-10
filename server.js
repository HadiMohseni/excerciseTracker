'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');

var cors = require('cors');

var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
// mongoose.connect(process.env.MONGOLAB_URI);

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: false}));
app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

  
// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});
/////////////////////////////////////////////////////////////////////////////////////////////
function checkDate(str) {
  console.log(str);
  let regExp = /[0-9]{4}-[0-9][0-2]-[0-9]{2}/; // fragment locator
  return regExp.test(str);
}

mongoose.connect(process.env.MONGO_URI, {useNewUrlParser: true})
  .then(() => console.log('Connected'))
  .catch(error => console.log(error));

var Schema = mongoose.Schema;

var exercise = new Schema({description:{type:String}, duraion:{type:Number}, date:{type:Date}});
var Exercise = mongoose.model('Exercise',exercise);

var user = new Schema({
  username : {type:String},
  exercises : {type:[exercise]}
});

var User = mongoose.model('User', user);

app.post('/api/exercise/new-user',
         function(req,res){
                User.findOne({username:req.body.username},function(err,data){
                      if(!data && req.body.username){
                        var newUser = new User({username:req.body.username, exercises:[]});
                        newUser.save(function (err, newUser) {
                          if (err) return console.error(err);
                          console.log(newUser.username+' saved sucessfully.');
                          res.json({username:newUser.username, id:newUser._id});
                      });   
                        
                      }else{
                          console.log(req.body.username+' didn\'t save sucessfully.');
                          res.json({username:req.body.username});
                      }
                    })
         })

app.post('/api/exercise/users',
         function(req,res){
            User.find({},function(err,data){
              res.json(data);
            })
          })

app.post('/api/exercise/add',
         function(req,res){
            if(req.body.userId && req.body.description && req.body.duration){
                  if(checkDate(req.body.date)){
                    var exerDate = new Date(req.body.date)
                    console.log('check date is true');
                  } else{
                    var exerDate = new Date();
                    console.log('check date isn\'t true the date is'+exerDate);
                  }
                  var newExercise = new Exercise({description:req.body.description, duraion:req.body.duration, date:exerDate});
                  User.findById({_id:req.body.userId},function (err, data) {
                      console.log('find by id is running');
                      if (err) return console.error(err);
                      data.exercises.push(newExercise);
                      data.markModified('exercises');
                      data.save(function (err) { 
                        console.log('save is runing')
                          if (err) return console.error(err);
                      });
                  })
                  res.json({satuse:newExercise})
            } else{
                res.json({satuse:'invalid input'});
                console.log(req.body.UserId +" "+ req.body.description +" "+ req.body.duration)
            }
})

app.post('/api/exercise/log',
         function(req,res){
            User.findById({_id:req.body.userId},function (err, data) {
              if (data){
                res.json({exercises:data.exercises, count:data.exercises.length})
              } else{
                res.json({status:'id is not cvalid'})
              }
            })
})

app.get('/api/exercise/log',function(req,res){
    console.log(req.query.userId);
    if(req.query.userId){
      User.findById({_id:req.query.userId},function(err,data){
        var exercResp = [];
        if(checkDate(req.query.from)){
          var from = new Date(req.query.from)
        } else { var from = new Date('1800-01-01')}
        
        if(checkDate(req.query.to)){
          var to = new Date(req.query.to)
        } else { var to = new Date()}
        
        if(req.query.limit){
          var test = Number(req.query.limit);
          if(typeof test == 'number'){
            var limitation = test;
          } else{var limitation  = Infinity}
        } else{ var limitation = Infinity}
        if(data){
          var exercises = data.exercises;
          
          for(var i=0; i<exercises.length; i++){
            console.log(i);
            console.log(exercises[i].date >= from );
            console.log(exercises[i].date <= to);
            console.log(exercResp.length < limitation);
            if(exercises[i].date >= from && exercises[i].date <= to && exercResp.length < limitation){
              console.log('run:'+i);
              exercResp.push(exercises[i]);
            }
          }
        }
        res.json(exercResp)
      })
    } else{res.json({status:'invalid id'})}
})
//////////////////////////////////////////////////////////////////////////////////////////////
const listener = app.listen(process.env.MLAB_URI || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
