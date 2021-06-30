const express=require('express');
const router=express.Router();
const passport=require("passport")
//auth/google
router.get('/google',passport.authenticate("google",{scope:['profile','email']},{accessType: 'offline',
prompt: 'consent',}))

//google auth callack
router.get('/google/callback',passport.authenticate("google",{
  failureRedirect:"/users/login",
  proxy:true

}),(req,res)=>{
    
   if(!req.session.currentUrl=="undefined"){
    
    res.redirect(req.session.currentUr)

   }else{
       res.redirect("/shop")
}    
})
//fb auth
router.get('/facebook',passport.authenticate("facebook",{scope:'email'}))

//facebook auth callack
router.get('/facebook/callback',passport.authenticate("facebook",{failureRedirect:"/users/login",proxy:true}),(req,res)=>{
    if(req.session.currentUrl!== 'undefined'){
     
     res.redirect(req.session.currentUrl)
 }else{res.redirect("/shop")}    
 })

module.exports=router