const mongoose = require('mongoose');

bcrypt = require('bcryptjs'),
SALT_WORK_FACTOR = 10;

const userSchema = new mongoose.Schema({
    country:{
        type:String,
    },
    name:{
        type:String,
    },
    
   address: {
    type: String,
    
  },
  region: {
    type: String,
    
  },
    email: {
        type: String,
        
    },
    password: {
        type: String,
        

    },
//   adding the image to get images from google accounts
    image:{
        type: String,
        default:""
},
    appartment:{
        type: String,
        },
        phone:{
            type: String,
            },
    
    usedCoupons:[
       { type:String,
    },
        
    ],
    fav:[
        { type:mongoose.Schema.Types.ObjectId,
        ref: "Product",
        
    
    
     }],
    
    isAdmin:{
        type:Boolean,
        
    default:false

    },
    dp:{
        type:String,
        default:""
        // default:"https://i.pinimg.com/originals/51/f6/fb/51f6fb256629fc755b8870c801092942.png"

    },
    resetPasswordToken: {
        type:String,
      },
    resetPasswordExpires: {
      type:Date
    }
   

},{timestamps:true});

userSchema.pre('save', function(next) {
    var user = this;

    // only hash the password if it has been modified (or is new)
    if (!user.isModified('password')) return next();

    // generate a salt
    bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
        if (err) return next(err);

        // hash the password using our new salt
        bcrypt.hash(user.password, salt, function(err, hash) {
            if (err) return next(err);
            // override the cleartext password with the hashed one
            user.password = hash;
            next();
        });
    });
});
     






module.exports = mongoose.model('Users', userSchema);
