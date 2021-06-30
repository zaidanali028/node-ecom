const mongoose = require('mongoose');


const mailSchema = mongoose.Schema({
    email:{
        type: String,
        required:true
    },
   
    

},{timestamps:true})

module.exports = mongoose.model("mailList", mailSchema);

