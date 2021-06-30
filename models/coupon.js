const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema({
    
    code: { 
        type: String,
        require: true, 
        unique: true 
    },


worth: { 
    type: Number, 
    required: true },
expireDate: { 
    type: String,
     require: true, 
    },
isActive: { type: Boolean, 
    require: true, 
    default: true }

  
},{timestamps:true});

module.exports = mongoose.model("Coupons", couponSchema);
