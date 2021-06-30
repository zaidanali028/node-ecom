const mongoose = require('mongoose');


const addSchema = mongoose.Schema({
    adTitle:{
        type: String,
        required:true
    },
   
    adDescription: {
        type: String,
        required:true
 },
 user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
    required: true,
  },
  adImg:{
      type:String,
  }
     

    

},{timestamps:true})

module.exports = mongoose.model("ad-schema", addSchema);

