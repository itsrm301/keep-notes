require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const _ = require("lodash");
const ejs = require("ejs");
const router = require("router");
const mongoose = require("mongoose");
// const encrypt = require("mongoose-encryption");
// const md5 = require("md5");
const bcrypt = require("bcrypt");
const passportLocalMongoose = require("passport-local-mongoose");
const session = require("express-session");
const passport = require("passport");
const { restart } = require("nodemon");
const { result } = require("lodash");
const initialtitle = ["NO POST"];
const initialpost = ["PLEASE POST SOMETHING"];
const app = express();
let NAME = "";
// let ID = "";
// let EMAIL = "";
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(
  session({
    secret: "My ittle secret ",
    resave: false,
    saveUninitialized: false,
  })
);
mongoose.connect(
  "mongodb+srv://its_rm:d3tFKXydDTMf9wYc@cluster0.ovdmf.mongodb.net/secret-diary?retryWrites=true&w=majority",
  { useNewUrlParser: true, useUnifiedTopology: true }
);
app.use(passport.initialize());
app.use(passport.session());
const saltRounds = 10;
const UserSchema = new mongoose.Schema({
  name:{
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
});

// UserSchema.plugin(encrypt,{secret:process.env.SECRET, encryptFields:["password"] })
UserSchema.plugin(passportLocalMongoose);

const User = mongoose.model("User", UserSchema);
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser);
passport.deserializeUser(User.deserializeUser);
const PostSchema =new mongoose.Schema( {
  name: String,
  title: [String],
  post: [String],
});
const Posts = mongoose.model("Posts", PostSchema);
app.get("/", function (req, res) {
//   if (req.isAuthenticated) {
    res.render("home.ejs", { name: NAME });
    // res.render("home.ejs");
//   } else {
    // res.redirect("/login");
//   }
});
app.get("/register", function (req, res) {
  res.render("registration.ejs");
});
app.get("/login", function (req, res) {
  res.render("login.ejs");
});
app.get("/post", async function (req, res) {
  let userpost = await Posts.findOne({ name: NAME });
  if (NAME == "") {
    res.render("error.ejs", {
      errortitle: "LOGIN ERROR",
      errorcontain: "please login to your account",
    });
  } else {
    if (userpost == null) {
      res.render("create.ejs", { name: NAME });
    } else if (userpost.title.length == 0) {
      res.render("post.ejs", {
        name: NAME,
        title: userpost.title,
        postbody: userpost.post,
      });
    } else {
      Posts.findOne({ name: NAME }, function (req, result) {
        res.render("post.ejs", {
          name: NAME,
          title: result.title,
          postbody: result.post,
        });
      });
    }
  }
  
});
app.get("/create", function (req, res) {
  if (NAME == "") {
    res.render("error.ejs", {
      errortitle: "LOGIN ERROR",
      errorcontain: "Before posting your post please login yourself",
    });
  } else {
    res.render("create.ejs", { name: NAME });
  }
});
app.get("/fullpost/:save", function (req, res) {
  var i = req.params.save;

  Posts.findOne({ name: NAME }, function (reqest, result) {
    console.log(result.title[i]);
    res.render("fullpost.ejs", {
      name: NAME,
      title: result.title[i],
      postbody: result.post[i],
    });
  });
});
app.get("/delete/:i", function (req, res) {
  var i = req.params.i;
  var title1 = [];
  var body1 = [];
  var k = 0;
  var p = 0;
  Posts.findOne({ name: NAME }, function (request, result) {
    for (var j = 0; j < result.title.length; j++) {
      if (j != i) {
        title1[k++] = result.title[j];
        body1[p++] = result.post[j];
      }
    }
    // console.log(title1);
    // console.log(body1);
    Posts.updateOne(
      { name: NAME },
      { title: title1 },
      function (err, result) {}
    );
    Posts.updateOne({ name: NAME }, { post: body1 }, function (err, result) {});
    res.redirect("/post");
  });
});
app.get("/logout", function (req, res) {
  NAME = "";
  //   EMAIL = "";
  res.render("home.ejs", { name: NAME });
});
app.get("/edit/:i", function (req, res) {
  var i = req.params.i;
  Posts.findOneAndUpdate({ name: NAME }, function (request, result) {
     
    
    res.render("edit.ejs", {
      name: NAME,
      title: result.title[i],
      postbody: result.post[i],
      index: i,
    });
    // result.title[i] =req.body.title;
    // result.post[i] = req.body.post ;
  });
});
app.post("/login", async function (req, res) {
      const name = req.body.name;
      // console.log(name);
     const username =  await User.findOne({name:name});
    //  console.log(username);
       if(username==null){
          res.render("error.ejs",{errortitle:"LOGIN ERROR", errorcontain:"Username does not exist"});
      }else
            {  bcrypt.compare(req.body.password,username.password,function(err,user){
      if(!user){
          res.render("error.ejs",{errortitle:"LOGIN ERROR", errorcontain:"your password or email id are incorrect"})
      }else
          {
              NAME= username.name;
              ID = username._id;
             
              res.render("home.ejs" ,{name:NAME});
          }
        })
      }
          })

//   const user = new User({
//     name: req.body.name,
//     password: req.body.password,
//   });

//   req.login(user, function (err) {
//     if (err) {
//       console.log(err);
//     } else {
//       passport.authenticate("local")(req, res, function () {
//         res.redirect("/");
//       });
//     }
//   });
// });

// for registration
app.post("/register", async function (req, res) {
        const username =  await User.findOne({name:req.body.name});
//   const usernumber = await User.findOneAndDelete({number:number});
  // bcrypt.hash(req.body.cpassword,saltRounds);
      if(username!=null){
      res.render("error.ejs",{errortitle:"SIGN-IN ERROR", errorcontain :"Same username already exists"})
  }
  try{
      
          bcrypt.hash(req.body.password,saltRounds,function(err,hash){
             
              const user =new User({
                  name:req.body.name,
                  password:hash,
              });
              user.save(
                  function(err){
                      if(err){
                      console.log(err);
                  }else{
                      res.redirect("login");
                  }
              }
              );
          })
      }
     catch (error){
        res.send(error);
  }

//   User.register(
//     {
//       usename: req.body.name,
//     },
//     req.body.password,
//     function (err, user) {
//       if (user) {
//         passport.authenticate("local")(req, res, function () {
//           res.redirect("/");
//         });
//       } else {
//         console.log(err);
//         res.redirect("/register");
//       }
//     }
//   );
});

app.post("/post", async function (req, res) {
  const title = req.body.posttitle;
  const postbody = req.body.postbody;
  let previous = await Posts.findOne({ name: NAME });
  if (previous == null) {
    let post = new Posts({
      title: [title],
      post: [postbody],
      name: NAME,
    });
    post.save();
  } else {
    Posts.updateOne(
      { name: NAME },
      { $push: { title: [title] } },
      function (req, result) {}
    );
    Posts.updateOne(
      { name: NAME },
      { $push: { post: [postbody] } },
      function (req, result) {}
    );
  }
  res.redirect("post");
});
app.post("/edit/:i", function (req, res) {
  var i = req.params.i;

  var title1 = [];
  var body1 = [];
  var k = 0;
  var p = 0;
  Posts.findOne({ name: NAME }, function (request, result) {
    for (var j = 0; j < result.title.length; j++) {
      if (j != i) {
        title1[k++] = result.title[j];
        body1[p++] = result.post[j];
      } else {
        console.log(req.body.postbody);
        title1[k++] = req.body.posttitle;
        body1[p++] = req.body.postbody;
      }
    }

    // console.log(title1);
    // console.log(body1);
    Posts.updateOne(
      { name: NAME },
      { title: title1 },
      function (err, result) {}
    );
    Posts.updateOne({ name: NAME }, { post: body1 }, function (err, result) {});
    res.redirect("/post");
  });
});

app.listen(3000, function () {
  console.log(`your server is started on port ${process.env.SERVER}`);
});
