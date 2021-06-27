
const express = require("express");
const router = express.Router();
const Order = require("../../models/order");
const User = require("../../models/user");


const { ensureAuthenticated, ensureGuest } = require("../../config/auth");
router.get("/",ensureAuthenticated,async(req,res)=>{
  try{
  
    const currentYear = new Date().getFullYear(); 
 let orderCost=0;

  let janCost=0;
  let febCost=0;
  let marchCost=0;
  let aprilCost=0;
  let mayCost=0;
  let juneCost=0;
  let julyCost=0;
  let augCost=0;
  let septCost=0;
  let octCost=0;
  let novCost=0;
  let decCost=0;


let userOrders=await Order.find({name:req.user.name})
let userCoupons=await User.findOne({_id:req.user._id})
userCoupons=userCoupons.usedCoupons.length
  for (order of userOrders ){
    orderCost+=order.cart.totalCost
     let orderM = new Date(order.createdAt).getMonth() + 1;
    let orderY = new Date(order.createdAt).getFullYear();
    if (orderY === currentYear) {
       orderM===1?janCost+=order.cart.totalCost:
 orderM===2?febCost+=order.cart.totalCost:
 orderM===3?marchCost+=order.cart.totalCost:
 orderM===4?aprilCost+=order.cart.totalCost:
 orderM===5?mayCost+=order.cart.totalCost:
 orderM===6?juneCost+=order.cart.totalCost:
 orderM===7?julyCost+=order.cart.totalCost:
 orderM===8?augCost+=order.cart.totalCost:
 orderM===9?septCost+=order.cart.totalCost:
 orderM===10?octCost+=order.cart.totalCost:
 orderM===11?novCost+=order.cart.totalCost:
decCost+=order.cart.totalCost
        
      }
      // let jan=reducer(janData)

     

}
 


  




res.render("users/index",{userCoupons,userOrders,orderCost,janCost,febCost,marchCost,aprilCost,mayCost,juneCost,julyCost,augCost,septCost,octCost,novCost,decCost})
  }catch(e){
    console.log(e)

  }
})

module.exports=router;
