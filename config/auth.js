//This is required to prevent others from
//Accessing the dashoboard route without
//logging in
module.exports={
    ensureAuthenticated:async function(req,res,next){
        if(req.isAuthenticated()){
            return next()
        }else{req.flash('error_msg','Please login to access this resource')
        res.redirect('/users/login')
    }
    },
     ensureGuest:(req,res,next)=>{
        //preventing user from seeing index page After loggin in
        if(req.isAuthenticated()){
            res.redirect("/shop")
        }
        else{
            return next()
        }
    }
}