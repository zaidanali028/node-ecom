const mongoose = require('mongoose');
const slug = require("mongoose-slug-updater");

mongoose.plugin(slug);

const productSchema = mongoose.Schema({
name: {
    type:String,
    required: true,
    lowercase:true,
    trim:true,
},
description: {
    type:String,
    required: true,
    trim:true,
},
richDescription:{
       type:String,
        required: true,
        default:"no rich description",
        trim:true,
},

price:{
   type:Number,
   default:0, 
   trim:true,
},
category:{
    type:mongoose.Schema.Types.ObjectID,
    ref:'Category',
    required:true
},
countInStock: {
    type: Number,
    required: true,
    min:0,
    trim:true,

},
originalCountInStock: {
    type: Number,
    required: true,
    min:0,
    trim:true,

},
oldPrice: {
    type:Number,
    default:0,
    trim:true,
},
discount:{
    type:Number,
    default:0

},

isFeatured:{
    type:Boolean,
    default:false,
},
isFiftyOff:{
    type:Boolean,
    default:false,
},

viewCount:{
    type:Number,
    default:0,
    immutable:false
},

image: [{
    type:String,
    required: false ,
}
],
slug: {
    type: String,
    unique: true,
    slug: "name",
  },

},
{timestamps:true},
)

module.exports = mongoose.model('Product', productSchema);
