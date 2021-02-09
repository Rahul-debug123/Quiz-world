const mongoose = require('mongoose');
mongoose.pluralize(null);
const express=require('express');
const app=express();
const bodyParser=require('body-parser');
const MongoClient=require('mongodb');

app.use(bodyParser.urlencoded({ extended: true }))
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.static('public'));
app.use("/styles",express.static(__dirname + "/styles"));

//databese work
const url = "mongodb://localhost:27017/quiz";
mongoose.connect(url,{ useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB...'))
    .catch((err) => console.error("Coudn't connect MongoDB....", err));

app.get('/',(req,res)=>{
    res.redirect("home.html");
})
//quiz creating page
app.get('/create',(req,res)=>{
    res.render('create_quiz.ejs',{error:''});
})

//question entering page
app.post('/question',(req,res)=>{
    const data=req.body;
    MongoClient.connect(url, {useUnifiedTopology: true },(err, client) => {
    const db = client.db('quiz');
    db.listCollections().toArray((err, collections) => {

       let li=[];
       collections.forEach(myFunction);
       function myFunction(value,index,array){
           li.push(value.name);
       }
       const xx=li.find((c)=>c==data.quiz_name);
    if(!xx){
        newCollection(data.quiz_name);
        res.render('enter.ejs',{"sr_no":1,"quiz_name":data.quiz_name});
    }else {
        res.render("create_quiz.ejs",{error:"The given name has already used!"});
    }client.close();
    });});
});

//add more questions
app.post('/action_one',(req,res)=>{
    const data=req.body;
    var o=[data.option1,data.option2,data.option3,data.option4];
    createNewquestion(data.sr_no,data.answer,data.statement,o);
    res.render("enter.ejs",data);
})
//exit of question making
app.post('/action_twos',(req,res)=>{
    const data=req.body;
    var o=[data.option1,data.option2,data.option3,data.option4];
    createNewquestion(data.sr_no,data.answer,data.statement,o);
    res.redirect('home.html');
})
app.post('/action_two',(req,res)=>{
    res.redirect('home.html');
})
//quiz tempelate
app.get('/main',(req,res)=>{
    res.render('1.ejs');
})

//delte quiz
app.get('/delete',(req,res)=>{
    MongoClient.connect(url, {useUnifiedTopology: true },(err, client) => {
    const db = client.db('quiz');
    db.dropCollection(req.query.quiz)
        .then(res.redirect('/attempt'))
        .catch((err)=>{res.send(err)});
    });
})


app.get('/attempt',(req,res)=>{

    MongoClient.connect(url, {useUnifiedTopology: true },(err, client) => {

    const db = client.db('quiz');

    db.listCollections().toArray((err, collections) => {

       let li=[];
       collections.forEach(myFunction);
       function myFunction(value,index,array){
           li.push(value.name);
       }
       res.render("available_quizes.ejs",{'all':li});
       client.close();
    });

});
});
let total=0;
let evaluation=[];
app.get('/test',(req,res)=>{
    const title=req.query.name;
    tot(title,function(err,docs){
        total=docs.length;
    })
    evaluation=[];
    find(title,{sr_no:1},function (err, docs) {
        docs[0]["total"]=total;
        docs[0]["title"]=title;
        res.render("1.ejs",docs[0]);
})
});


app.post('/next',(req,res)=>{
    const data=req.body;
    if(data.sr_no!=total){
    evaluation.push([data.answer,data.response]);
    find(data.title,{"sr_no":Number(data.sr_no)+1},function(err,docs){
        docs[0]["total"]=total;
        docs[0]["title"]=data.title;
        res.render("1.ejs",docs[0]);
    });
    }
    else{
        evaluation.push([data.answer,data.response]);
        res.render("result.ejs",{"data":evaluation});
        
    }
});

function find (name, query, cb) {
    mongoose.connection.db.collection(name, function (err, collection) {
       collection.find(query).toArray(cb);
   });
}

function tot (name, cb) {
    mongoose.connection.db.collection(name, function (err, collection) {
       collection.find().toArray(cb);
   });
}


async function createNewquestion(sr,ans,q,o) {
    const customer= new quiz({sr_no:sr-1,answer:ans,statement: q,options:o});
    const result = await customer.save();
}

function newCollection(title){
const quizSchema= new mongoose.Schema(
    { sr_no:Number,
        answer:String,
        statement: String,
        options:Array});
    return quiz= mongoose.model(title,quizSchema);
}


const port=process.env.PORT||3000
app.listen(port,()=>console.log(`Running at ${port}....`))