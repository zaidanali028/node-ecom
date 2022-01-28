module.exports={
    semiAdminAuth: function(req,res,next){
        if(req.user.isSemiAdmin===true){
            return next()
        }
        
    
    else if(req.user.isSemiAdmin===false){
        req.flash('error_msg','Sorry,You ain\'t a semi admin and can\'t  visit here as a result of that  ')
        res.redirect('/admin')

    }
    }
}