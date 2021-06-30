module.exports={
          adminAuth: function(req,res,next){
        if(req.user.isAdmin===true){
            return next()
        }
        
    
    else if(req.user.isAdmin===false){
        req.flash('error_msg','Sorry,A Normal User Cannot Access That Portal')
        res.redirect('/users/login')
    }
    }
}