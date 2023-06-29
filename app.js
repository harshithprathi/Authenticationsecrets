//jshint esversion:6
//jshint esversion:6
require('dotenv').config()
const express = require("express");
// const encrypt=require("mongoose-encryption");
const bodyParser = require("body-parser");
const ejs = require("ejs");
// const md5=require("md5");
const mongoose=require("mongoose");
const session= require('express-session');
const passport= require("passport");
const passportLocalMongoose=require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate=require("mongoose-findorcreate");
// const bcrypt=require("bcrypt");
// const saltRounds=10;

const app = express();
//console.log(process.env.API_KEY);
app.set('view engine', 'ejs');

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.use(session({
    secret: "Our Little Secret",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true});

const userschema= new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    secret: String
});

userschema.plugin(passportLocalMongoose);
userschema.plugin(findOrCreate);
// const secret="Thisisourlittlesecret.";
// userschema.plugin(encrypt,{secret: process.env.SECRET, encryptedFields:["password"] });

const User=new mongoose.model("User",userschema);

passport.use(User.createStrategy());

// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());
passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, {
        id: user.id,
        username: user.username,
        picture: user.picture
      });
    });
  });
  
  passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
  });
  
  passport.use(new GoogleStrategy({
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/secrets",
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
    },
    function(accessToken, refreshToken, profile, cb) {
      console.log(profile);
  
      User.findOrCreate({ googleId: profile.id }, function (err, user) {
        return cb(err, user);
      });
    }
  ));
app.get("/",function(req,res){
    res.render("home");
});

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));

app.get("/auth/google/secrets",
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

app.get("/login",function(req,res){
    res.render("login");
});

app.get("/register",function(req,res){
    res.render("register");
});

app.get("/secrets", function(req, res){
    // if(req.isAuthenticated()){
    //     res.render("secrets");
    // }else{
    //     res.redirect("/login");
    // }
    const samp2= async()=>{
        let secr=await User.find({"secret": {$ne: null}});
        if(secr.length===0){
            console.log("Error");
        }else{
            // console.log(secr.length);
            res.render("secrets",{usersWithSecrets: secr});
        }
    }
    samp2();
});

app.get("/submit", function(req, res){
    if(req.isAuthenticated()){
        res.render("submit");
    }else{
        res.redirect("/login");
    }
});

app.post("/submit", function(req,res){
    const submittedSecret=req.body.secret;
    const samp= async()=>{
        let sec= await User.findById(req.user.id);
        if(sec.length!==0){
            sec.secret=submittedSecret;
            await sec.save();
            res.redirect("/secrets");
        }
        else{
            res.send("Error");
        }
    }
    samp();
});


app.get("/logout", function(req,res){
    req.logout(function(err) {
        if (err) { return next(err); }
        res.redirect('/');
      });
});

app.post("/register",function(req,res){
    User.register({username:req.body.username}, req.body.password, function(err, user){
        if(err){
            console.log(err);
            res.redirect("/register");
        }
        else{
            passport.authenticate("local")(req,res, function(){
                res.redirect("/secrets");
            });
        }
    });
    // bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
    //     const a=req.body.username;
    //     // const b=md5(req.body.password);
    //     console.log(a);
    //     const newuser=new User({
    //         email: a,
    //         password: hash
    //     })
        
        
    //     const auth= async () => {
    //         // console.log('executing auth function')
    //         // console.log(req.body.username);
    //         await newuser.save();
    //         const doc = await User.find({email: a});
    //         // console.log(doc);
    //         // console.log("Length of result", doc.length);
    //         if(doc.length!==0){ 
    //         //    console.log("worked")
    //         return res.render('secrets');
    //         }
    //         return res.send('Error');

    //     }
    //     auth();
    // });
    
    
});

app.post("/login", function(req,res){
    const userr= new User({
        username:req.body.username,
        password:req.body.password
    });
    req.login(userr, function(err){
        if(err){
            console.log(err);
        }else{
            passport.authenticate("local")(req,res, function(){
                res.redirect("/secrets");
            });
        }
    })
    // const usernme=req.body.username;
    // const password=req.body.password;
    // const auth2= async () => {
    //     const doc2 = await User.findOne({email: usernme}).exec();
    //     bcrypt.compare(password, doc2.password, function(err, result) {
    //         if(result == true){
    //             res.render("secrets");
    //         }
    //         else{
    //             res.render('error');
    //         }
    //     });
    // }
    // auth2();
});


app.listen(3000, function() {
  console.log("Server started on port 3000");
});
