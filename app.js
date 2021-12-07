var express			=require("express"),
	app    			=express(),
	expressSanitizer=require("express-sanitizer"),
	methodOverride	=require("method-override"),
	bodyParser		=require("body-parser"),
	passport		=require("passport"),
	User			=require("./models/user"),
	flash			=require("connect-flash"),
	LocalStrategy	=require("passport-local");

const {check, validationResult}=require('express-validator');
 
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/vote', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected !!'))
.catch(error => console.log(error.message));

var nodemailer = require('nodemailer');
var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'isaatest123@gmail.com',
    pass: 'isaa@123'
  }
});

var mailOptions = {
  from: 'isaatest123@gmail.com',
  to: 'isaatest123@gmail.com',
  subject: 'Sending Email using Node.js',
  text: `Congratulations !!! Your vote has been registered with the server.`        
};

transporter.sendMail(mailOptions, function(error, info){
  if (error) {
    console.log(error);
  } else {
    console.log('S' );
  }
});

//APP/CONFIG
app.set("view engine","ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));
app.use(expressSanitizer());
app.use(methodOverride("_method"));
app.use(flash());

//PASSPORT CONFIG
app.use(require("express-session")({
	secret:"Something !!",
	resave:false,
	saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next){
 res.locals.currentUser = req.user;
	res.locals.error=req.flash("error");
	res.locals.success=req.flash("success");
 next(); 
});


// MONGOOSE/SCHEMA/CONFIG
var AdminSchema=new mongoose.Schema({
	cname:String,
	cage:Number,
	cparty:String,
	cinfo:String,
	cimage:String,
	ccount:{type: Number,default:0},
	created:{type: Date,default: Date.now}
});

var admin=mongoose.model("Admin",AdminSchema);



//ROUTES
//======

app.get("/",function(req,res){
	res.redirect("/admin");
});


//Index
app.get("/admin",function(req,res){
	admin.find({},function(err,candidates){
		if(err){
			console.log("ERROR");
		}else{
			
			res.render("index",{candidates:candidates});
		}
	});
});

//NEW CANDIDATES
app.get("/admin/new",function(req,res){
	res.render("new");
});

//create Route
app.post("/admin",function(req,res){
	admin.create(req.body.admin,function(err,newCandidate){
		if(err){
			req.flash("error","Please fill the form correctly");
			res.render("new");
		}else{
			req.flash("success","Successfully edited");
			res.redirect("/admin");
		}
	});
});

//cope above
// app.post("/admin",function(req,res){
// 	admin.create(req.body.admin,function(err,newCandidate){
// 		if(err){
// 			req.flash("error","Please fill the form correctly");
// 			res.render("new");
// 		}else{
			
// 		}
// 	});
// });





//EDIT ROUTE
app.get("/admin/:id/edit",function(req,res){
	admin.findById(req.params.id,function(err,foundCandidate){
		if(err){
			res.redirect("/admin");
		}else{
			res.render("edit",{candidate:foundCandidate});
		}
	});
});

//UPDATE ROUTE
app.put("/admin/:id",function(req,res){
			req.body.admin.body=req.sanitize(req.body.admin.body);
			admin.findByIdAndUpdate(req.params.id,req.body.admin,function(err,updatedCandidate){
				if(err){
					req.flash("error","Please fill the form correctly");
					res.redirect("/admin/"+req.params.id);
				}else{
					req.flash("success","Successfully edited");
					res.redirect("/admin/"+req.params.id);
		}
	});
});

//copy above
// app.put("/admin/:id",function(req,res){
// 			req.body.admin.body=req.sanitize(req.body.admin.body);
// 			admin.findByIdAndUpdate(req.params.id,req.body.admin,function(err,updatedCandidate){
// 				if(err){
// 					req.flash("error","Please fill the form correctly");
// 					res.redirect("/admin/"+req.params.id);
// 				}else{
					
// 		}
// 	});
// });

//Delete route
app.delete("/admin/:id",function(req,res){
	//Destroy blog
	admin.findByIdAndRemove(req.params.id,function(err){
		if(err){
			req.flash("Error","Error,candidate can be deleted");
			res.redirect("/admin");
		}else{req.flash("success","Successfully Deleted");
			res.redirect("/admin");
		}
	});
});

//=============
//AUTH ROUTES
//================

//show register form
app.get("/register",function(req,res){
	res.render("register");
});

//handle sign up logic
app.post("/register",[
	check('username','this username must be 3 characters long')
				.exists()
				.isLength({min:3}),
	check('password','password is not valid')
				.exists()]
	
		,function(req,res){
	var newUser=new User({username:req.body.username});
	User.register(newUser,req.body.password,function(err,user){
		if(err){
			req.flash("error","Please fill the form correctly");
			console.log(err);
			return res.render("register");
		}
		passport.authenticate("local")(req,res,function(){
			req.flash("success","Welcome");
			res.redirect("/vote");
		});
	});
});


//copy above
// app.post("/register",[
// 	check('username','this username must be 3 characters long')
// 				.exists()
// 				.isLength({min:3}),
// 	check('password','password is not valid')
// 				.exists()]
	
// 		,function(req,res){
// 	var newUser=new User({username:req.body.username});
// 	User.register(newUser,req.body.password,function(err,user){
// 		if(err){
// 			req.flash("error","Please fill the form correctly");
// 			console.log(err);
// 			return res.render("register");
// 		}
// 		passport.authenticate("local")(req,res,function(){
// 			req.flash("success","Welcome");
// 			res.render("register");
// 		});
// 	});
// });

//show login form
app.get("/login/voter",function(req,res){
	req.flash("error","Please fill the form correctly");
	res.render("voterlogin");
});

//handling login logic
app.post("/login/voter",passport.authenticate("local",
	{successRedirect:"/voterindex",
	failureRedirect:"/login/voter"	 
	}),function(req,res){
});

//copy above
// app.post("/login/voter",passport.authenticate("local",
// 	{successRedirect:"/login/voter",
// 	failureRedirect:"/login/voter"	 
// 	}),function(req,res){
// });

//ADMIN LOGIN
app.get("/login/admin",function(req,res){
	res.render("adminlogin");
});

app.post("/login/admin",function(req,res){
	if(req.body.username=="aditya" && req.body.password=="123"){
		req.flash("success","Logged in");
		res.redirect("/admin");
	}else{
		req.flash("error","Please enter correct credentials");
		res.redirect("/login/admin");
	}
})

//copy above
// app.post("/login/admin",function(req,res){
// 	if(req.body.username=="aditya" && req.body.password=="123"){
// 		req.flash("success","Logged in");
// 		res.redirect("/login/admin");
// 	}else{
// 		req.flash("error","Please enter correct credentials");
// 		res.redirect("/login/admin");
// 	}
// })



//logout route
app.get("/logout",function(req,res){
	req.logout();
	req.flash("success","Successfully Logged out");
	res.render("show1");
});

function isLoggedIn(req,res,next){
	if(req.isAuthenticated()){
		req.flash("success","Logged in");
		return next();
	}
	req.flash("Error","Wrong Credentials.Please enter correct details");
	res.redirect("/login");
};

//USER ROUTES
//=========



app.get("/vote",function(req,res){
admin.find({},function(err,candidate){
if(err){
	
console.log("Error!");
}else{
res.render("votepage",{candidates:candidate});

}
});
});

app.get("/voterindex",function(req,res){
	admin.find({},function(err,candidates){
		if(err){
			console.log("ERROR");
		}else{
			res.render("voterindex",{candidates:candidates});
		}
	});
});

app.get("/votecount",function(req,res){
admin.find({},function(err,candidates){
if(err){
console.log(err);
}else{
console.log(candidates);
res.render("votecount",{candidates:candidates});
}
});
});

//SHOW ROUTE
// app.get("/admin/:id",function(req,res){
// 	admin.findById(req.params.id,function(err,foundCandidate){
// 		if(err){
// 			res.render("/admin");
// 		}else{
// 			res.render("votecount",{candidate:foundCandidate});
// 		}
// 	});
// });

//SHOW ROUTE
// app.get("/admin/:id",function(req,res){
// 	admin.findById(req.params.id,function(err,foundCandidate){
// 		if(err){
// 			res.render("/admin");
// 		}else{
// 			res.render("show",{candidate:foundCandidate});
// 		}
// 	});
// });

app.get("/admin/:id",function(req,res){
	admin.findById(req.params.id,function(err,foundCandidate){
		if(err){
			res.render("/admin");
		}else{
			i=0;
			a=i+1;
			console.log(a);
			i=a;
			
			res.render("votecount",{candidate:foundCandidate});
		}
	});
});




app.get("/count",function(req,res){
	req.flash("success","Vote Registered successfully");
	res.render("count");
});









//listen route
app.listen(process.env.PORT||3000,process.env.IP,function(){
	console.log("Server is running!!....");
});