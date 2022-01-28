module.exports={
    supaAdminAuth: function(req,res,next){
        if(req.user.isSupaAdmin===true){
            return next()
        }
        
    
    else if(req.user.isSupaAdmin===false){
        req.flash('error_msg','Sorry,"You ain\'t a [SUPA] admin and can\'t  visit here as a result of that  ')
        res.redirect('/admin')
    }
    }
}