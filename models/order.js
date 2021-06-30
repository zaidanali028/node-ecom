const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const orderSchema = Schema({
  // paymentRef:{
    // type:String,
    // required:true,
// },
 country:{
     type:String,
 },
 
 name:{
    type:String,
},
user: {
    type: Schema.Types.ObjectId,
    ref: "Users",
  },
  cart: {
    totalQty: {
      type: Number,
      default: 0,
      required: true,
    },
    totalCost: {
      type: Number,
      default: 0,
      required: true,
    },
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        qty: {
          type: Number,
          default: 0,
        },
        price: {
          type: Number,
          default: 0,
        },
        title: {
          type: String,
        },
       
      },
    ],
  },
  address: {
    type: String,
    required: true,
  },
  region: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  appartment:{
    type: String,
    },
    orderNotes:{
    type: String,
        
    },
  phone:{
    type: String,
required:true

  },
  
  Delivered: {
    type: Boolean,
    default: false,
  },

},{timestamps:true});

module.exports = mongoose.model("Order", orderSchema);
