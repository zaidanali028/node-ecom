const mongoose = require('mongoose');


const heroSchema = mongoose.Schema({
    title:{
        type: String,
        required:true
    },
    name:{
      type: String,
      required:true
  },
    sDesc: {
        type: String,
        required:true

       
      },
      sRDesc: {
        type: String,
        required:true

       
      },
    image: {
        type: String,
        required:true

       
      }

    

},{timestamps:true})

module.exports = mongoose.model("hero", heroSchema);

