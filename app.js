//jshint esversion:6
//jshint esversion:6
require('dotenv').config()
const express = require("express");
const encrypt=require("mongoose-encryption");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose=require("mongoose");

const app = express();
//console.log(process.env.API_KEY);
app.set('view engine', 'ejs');

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true});

const userschema= new mongoose.Schema({
    email: String,
    password: String
});

// const secret="Thisisourlittlesecret.";
userschema.plugin(encrypt,{secret: process.env.SECRET, encryptedFields:["password"] });

const User=new mongoose.model("User",userschema);

app.get("/",function(req,res){
    res.render("home");
});

app.get("/login",function(req,res){
    res.render("login");
});

app.get("/register",function(req,res){
    res.render("register");
});

app.post("/register",function(req,res){
    const a=req.body.username;
    const b=req.body.password;
    console.log(a,b);
    const newuser=new User({
        email: a,
        password: b
    })
    
    
    const auth= async () => {
        // console.log('executing auth function')
        // console.log(req.body.username);
        await newuser.save();
        const doc = await User.find({email: a});
        // console.log(doc);
        // console.log("Length of result", doc.length);
        if(doc.length!==0){ 
        //    console.log("worked")
           return res.render('secrets');
        }
        return res.send('Error');

    }
    auth();
    
});

app.post("/login", function(req,res){
    const usernme=req.body.username;
    const password=req.body.password;
    const auth2= async () => {
        const doc2 = await User.findOne({email: usernme}).exec();
        if(doc2.password===password){ 
            res.render("secrets");
        }
        else{
            res.render('error');
        }
    }
    auth2();
});


app.listen(3000, function() {
  console.log("Server started on port 3000");
});
