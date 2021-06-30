//User model
const User=require('../models/user')
const LocalStrategy=require("passport-local").Strategy
const mongoose=require('mongoose')
const bcrypt=require('bcryptjs')
const GoogleStrategy =require('passport-google-oauth20').Strategy
const FacebookStrategy =require('passport-facebook').Strategy




//passport will be defined in the app.js
module.exports=(passport)=>{
    passport.use(
        new LocalStrategy({usernameField:'email'},(email,password,done)=>{
            //({usernameField:'email'}=>means we will be using email to look for the user who 
            //wants to login and=>(email,password,done) email=user email gotten from req.body.email
            //password too same as email and the done is a function
            User.findOne({email:email})
            .then(user=>{
                if(!user){
                    
                    // null=error
                    // user=false
                    // options
                    //the done here takes the above 3 options
                    //the message object is an error message so it will be displayed in <%=error%> from flashes.ejs
                    return done(null,false,{message:"That email you entered ain't registered"})
                }
                //console.log(user.password)
                //MAtch password
                bcrypt.compare(password,user.password,(err,isMatch)=>{
                        if(err){
                            console.log(err)
                        } 

                        if (isMatch){
                            return done(null,user)
                        }
                        else{
                            return done(null,false,{message:'Password is incorrect'})
                        }
                })
            })
            .catch(err=>console.log(err))
        }
        )
    );

    //Google Auth
    passport.use(new GoogleStrategy({
        clientID:process.env.GOOGLE_CLIENT_ID,
        clientSecret:process.env.GOOGLE_CLIENT_SEC ,
        callbackURL:"/auth/google/callback" 
    },async(accessToken,refreshToken,profile,done)=>{
        // console.log(profile)
        const newUser={
            name:profile.displayName,
            image:profile.photos[0].value,
            email:profile.emails[0].value
        }
        try{
            let user= await User.findOne({email:profile.emails[0].value})
            if(user){
                done(null,user)
            }else{
                user=await User.create(newUser)
                done(null,user)
            } 

        }
        catch(e){
            console.log(e)

        }
        
    }))

    //Fb Auth
    

    passport.use(new FacebookStrategy({
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL: `/auth/facebook/callback`,
        profileFields:['id','displayName','name','picture.type(large)','email']
      },
      async function(accessToken, refreshToken, profile, cb) {
        const newUser={
            name:profile.displayName,
            image:profile.photos[0].value,
            email:profile.emails[0].value
        }
        try{
            let user= await User.findOne({email:profile.emails[0].value})
            if(user){
                cb(null,user)
            }else{
                user=await User.create(newUser)
                cb(null,user)
            } 

        }
        catch(e){
            console.log(e)

        }
      }
    ));
//serializing and deserializing credentials(in a form of sessions here)
passport.serializeUser(async function(user, done) {
    done(null, user.id);
  });
  
  passport.deserializeUser(async function(id, done) {
   await  User.findById(id,async function(err, user) {
      done(err, user);
    });
  });


}