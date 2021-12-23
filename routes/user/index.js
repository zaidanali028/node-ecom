
const express = require("express");
const router = express.Router();
const Order = require("../../models/order");

const { ensureAuthenticated, ensureGuest } = require("../../config/auth");
router.get("/",ensureAuthenticated,async(req,res)=>{
  try{
    let orderCost=0;
  let userOrders=await Order.find({name:req.user.name})
  // console.log(userOrders)
  for (order of userOrders ){
    orderCost+=order.cart.totalCost


  }
  console.log(orderCost)



res.render("users/index")
  }catch(e){
    console.log(e)

  }
})

module.exports=router;
