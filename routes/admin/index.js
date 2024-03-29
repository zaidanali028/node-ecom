require("dotenv").config();
// const expressVisitorCounter = require('express-visitor-counter');

const express = require("express");
const couponGen = require("../scripts/couponGen");
const router = express.Router();
const { Category } = require("../../models/category");
const Product = require("../../models/product");
const cloudinary = require("../scripts/cloudinary");
const Coupon = require("../../models/coupon");
const fs = require("fs");
const moment = require("moment");
const Validator = require("validatorjs");
const { Console } = require("console");
const { resolve } = require("path");
const Cart = require("../../models/cart");
const coupon = require("../../models/coupon");
const Order = require("../../models/order");
const Hero = require("../../models/hero");
const Mail = require("../../models/mail-list");
const Ad = require("../../models/post-ad");
const Address = require("../../models/add-address");
const User = require("../../models/user");
const Logo = require("../../models/logo");
const axios = require("axios");
const sgMail = require("@sendgrid/mail");

const smsApiKey = process.env.SMS_API_KEY;
const sendGridApiKey = process.env.SENDGRID_API_KEY;

const { ensureAuthenticated } = require("../../config/auth");
const { semiAdminAuth} = require("../../config/semiAdminAuth");
const { supaAdminAuth} = require("../../config/supaAdminAuth");
const { adminAuth,} = require("../../config/adminAuth");

function phoneNumFormatter(num) {
  var isGhNum = num[0] == "0"
  var missenFirstDigit = num.length == 9
  if (missenFirstDigit) {
      num = '+233' + num
  }
  if (isGhNum) {
      num = `+233${num.substring(1)}`
  } else {
      // if number does not begin with zero(0)
      let isInternational = num.includes("+233") || num.includes("233")
      if (isInternational) {

          let hasPlus = num.substring(0, 4) == "+233"
          let notHasPlus = num.substring(0, 3) == "233"
          if (notHasPlus) {
              num = `+${num}`

          } else if (hasPlus) {
              num = num
          }
          else {
              console.log('failed')

          }

      }


  }
  return num;

}

function smsSender(smsMsg,recepientPhoneNumber,){
  let sender = "YUTA";
let senderEncode = encodeURI(smsMsg);
recipient =phoneNumFormatter(recepientPhoneNumber);
senderEncode = encodeURI(sender);
let messageEncode = encodeURI(smsMsg);
messageEncode=messageEncode.replace("%0A","")

let url = `https://sms.textcus.com/api/send?apikey=${smsApiKey}&destination=${recipient}&source=${senderEncode}&dlr=0&type=0&message=${messageEncode}`;
// Using axios to send a get request
axios.get(url).then((resp) => {
  
  return resp
});
}

// /find category of products
router.get('/shop/:slug', ensureAuthenticated, adminAuth,semiAdminAuth,supaAdminAuth, async (req, res) => {
  try {

    let lOgo = await Logo.findOne({});
    let siteLogo = lOgo ? lOgo.url : " ";
    req.session.currentUrl = req.originalUrl;

    let user = req.user;
    if (!user) {
      req.flash("error_msg", "please re-login");
      res.redirect("/users/login");
    }
    const subCount = await Mail.count({});
    const cCount = await coupon.countDocuments();
    const pcount = await Product.countDocuments();
    const orderCount = await Order.countDocuments();
    const addresS = await Address.findOne({});
    let fiftyOffProductsCount = await Product.count({ isFiftyOff: true });

    let ad = await Address.findOne({});
    let hero = await Hero.findOne({});
    let ad50 = await Ad.findOne({});

    let page = parseInt(req.query.page) || 1;
    let itemPerPage = 35;
    const foundCategory = await Category.findOne({ slug: req.params.slug });

    const count = await Product.count({ category: foundCategory._id });

    const productFromCategory = await Product.find({
      category: foundCategory._id,
    }).sort({ createdAt: -1 })
      .skip(itemPerPage * page - itemPerPage)
      .limit(itemPerPage);
    res.render('admin/catShop', {
      pages: Math.ceil(count / itemPerPage),
      currentPage: page,
      pages: Math.ceil(count / itemPerPage),
      // product,
      ad50,
      hero,
      cCount,
      pcount,
      orderCount,
      subCount,
      siteLogo,
      user,
      ad,
      addresS,
      fiftyOffProductsCount,
      productFromCategory,
      foundCategoryName: foundCategory.name

    })
    // res.send({productFromCategory})


  } catch (e) {
    console.log(e)
  }
})

//deleting an order
router.delete("/order/:id/delete", ensureAuthenticated, adminAuth, supaAdminAuth,async (req, res) => {
  try {

    await Order.findByIdAndDelete(req.params.id);
    req.flash(
      "success_msg",
      `order with id ${req.params.id} is deleted successfully`
    );
    res.redirect(req.headers.referer);
  } catch (e) {
    console.log(e);
  }
});

router.get("/get-users", ensureAuthenticated, adminAuth, supaAdminAuth,async (req, res) => {
  try {
    let currentPage = parseInt(req.query.page) || 1;
    let itemPerPage = 35;
    let userQueryRes;
    await User.find({}).skip(itemPerPage * currentPage - itemPerPage)
      .limit(itemPerPage)
      .sort({ updatedAt: -1 })
      .exec(function (err, docs) {
        userQueryRes = docs;

      });





    let lOgo = await Logo.findOne({});
    let siteLogo = lOgo ? lOgo.url : " ";
    req.session.currentUrl = req.originalUrl;

    let user = req.user;
    if (!user) {
      req.flash("error_msg", "please re-login");
      res.redirect(req.headers.referer);
    }
    // main-logic(start)
    let userCount = await User.countDocuments()


    let semiAdminCount = await User.countDocuments({ isSemiAdmin: true })
    let supaAdminCount = await User.countDocuments({ isSupaAdmin: true })
    let adminCount=await User.countDocuments({isAdmin:true})
    let semiAdminCountPct = (semiAdminCount / userCount) * 100;
    semiAdminCountPct = semiAdminCountPct.toFixed(2);
    let supaAdminCountPct = (supaAdminCount / userCount) * 100;
    supaAdminCountPct = supaAdminCountPct.toFixed(2);





    orderCount = await Order.count()
    let pages = Math.ceil(userCount / itemPerPage);
    const hero = await Hero.findOne({});
    let ad50 = await Ad.findOne({});
    const addresS = await Address.findOne({});
    const subCount = await Mail.count({});

    const cCount = await coupon.countDocuments();
    const pcount = await Product.countDocuments();
    const fiftyOffProductsCount = await Product.count({
      isFiftyOff: true,
    });




    res.render("admin/users", {
      adminCount,
      hero,
      ad50,
      currentPage,
      pages,
      cCount,
      pcount,
      orderCount,
      fiftyOffProductsCount,
      addresS,
      subCount,
      siteLogo,
      user,
      userCount,
      supaAdminCount,
      semiAdminCount,
      supaAdminCountPct,
      semiAdminCountPct,
      userQueryRes,
 });


  } catch (e) {
    console.log(e)
  }
})

// making a user an admin
router.post('/user-role-admin/:id',ensureAuthenticated, adminAuth, supaAdminAuth,async(req,res)=>{
  try{
let  user=await User.findOne({_id:req.params.id})
if (user){
user.isAdmin=true
user=await user.save()
let sms =
  `Hello ${user.name},welcome on board!.You are now an admin at yuta-mart.Please make sure to be responsible for this great role,Feel free to contact CEO if you have any issue(s)
  Regards,YUTA-FAMILY`;
smsSender(sms,user.phone)

req.flash("success_msg", `[${user}]'s admin badge is revoked,an sms prompt is sent!`);

res.redirect(req.headers.referer);



}
else{
  return        res.redirect(req.headers.referer);


}
  }catch(e){
    console.log(e)

  }
})

// revoking  admin priviledge

router.post('/user-role-admin-false/:id',ensureAuthenticated, adminAuth, supaAdminAuth,async(req,res)=>{
  try{
let  user=await User.findOne({_id:req.params.id})
if (user){
user.isAdmin=false
user=await user.save()
let sms =
  `Hello ${user.name},We are really sorry to tell you that your contract with Yuta-Admin has been revoked,good luck with your future endeavours,Feel free to contact CEO if you have any issue(s)
  Regards, YUTA-FAMILY`;
smsSender(sms,user.phone)

req.flash("success_msg", `${user} is now an admin,an sms prompt is sent!`);

res.redirect(req.headers.referer);


}
else{
  return        res.redirect(req.headers.referer);



}
  }catch(e){
    console.log(e)

  }
})

// making a user SUPA admin
router.post('/user-role-supa-admin/:id',ensureAuthenticated, adminAuth, supaAdminAuth,async(req,res)=>{
  try{
let  user=await User.findOne({_id:req.params.id})
if (user){
user.isSupaAdmin=true
user=await user.save()
let sms =
  `Hello ${user.name},Welcome to the HIGHEST rank  in YUTAMART(SUPA ADMIN),as a super admin,you have a greater responsiblity.Please be cautious not to do things outside your scope,failure to do so may attract a temporal or permanent BAN from your priviledges.Feel free to contact CEO if you have any issue(s)
  Regards,YUTA-FAMILY`;;
smsSender(sms,user.phone)

req.flash("success_msg", `[${user}]'s admin badge is revoked,an sms prompt is sent!`);

res.redirect(req.headers.referer);


}
else{
  return        res.redirect(req.headers.referer);



}
  }catch(e){
    console.log(e)

  }
})
// revoking a user SUPA admin
router.post('/user-role-supa-admin-false/:id',ensureAuthenticated, adminAuth, supaAdminAuth,async(req,res)=>{
  try{
let  user=await User.findOne({_id:req.params.id})
if (user){
user.isSupaAdmin=false
user=await user.save()
let sms =
  `Hello ${user.name},You just lost your SUPER-ADMIN BADGE.Feel free to contact CEO if you have any issue(s)
  Regards,YUTA-FAMILY`;
smsSender(sms,user.phone)

req.flash("success_msg", `[${user}]'s admin badge is revoked,an sms prompt is sent!`);

res.redirect(req.headers.referer);



}
else{
  return        res.redirect(req.headers.referer);


}
  }catch(e){
    console.log(e)

  }
})
// making a user SEMI admin
router.post('/user-role-semi-admin/:id',ensureAuthenticated, adminAuth, supaAdminAuth,async(req,res)=>{
  try{
let  user=await User.findOne({_id:req.params.id})
if (user){
user.isSemiAdmin=true
user=await user.save()

  let sms =
  `Hello ${user.name},You just got another rank on Yuta-mart,As part of being an admin,you can now interact with Yuta-products,among others which may be added soon.Please be cautious not to do things outside your scope,failure to do so may attract a temporal or permanent BAN from your priviledges.Feel free to contact CEO if you have any issue(s)
  Regards,YUTA-FAMILY`
smsSender(sms,user.phone)

req.flash("success_msg", `[${user}]'s admin badge is revoked,an sms prompt is sent!`);

res.redirect(req.headers.referer);


}
else{
  return       res.redirect(req.headers.referer);



}
  }catch(e){
    console.log(e)

  }
})
// making a user SEMI admin
router.post('/user-role-semi-admin-false/:id',ensureAuthenticated, adminAuth, supaAdminAuth,async(req,res)=>{
  try{
let  user=await User.findOne({_id:req.params.id})
if (user){
user.isSemiAdmin=false;
user=await user.save()
let sms =
  `Hello ${user.name}You just lost your SEMI-ADMIN badge.Feel free to contact CEO if you have any issue(s)
  Regards,YUTA-FAMILY`;
smsSender(sms,user.phone)

req.flash("success_msg", `[${user}]'s admin badge is revoked,an sms prompt is sent!`);

res.redirect(req.headers.referer);



}
else{
  return        res.redirect(req.headers.referer);



}
  }catch(e){
    console.log(e)

  }
})

router.delete('/delete-user/:id/delete',ensureAuthenticated, adminAuth, supaAdminAuth,async(req,res)=>{
  try{
    let user =await User.findById(req.params.id)

    await User.findByIdAndDelete(req.params.id);
    req.flash(
      "success_msg",
      `order with id ${user.name} has been deleted successfully`
    );
    res.redirect(req.headers.referer);
  }catch(e){
    
  }
})

router.get("/",ensureAuthenticated, adminAuth, async (req, res) => {
  try {
    req.session.currentUrl = req.originalUrl;

    let lOgo = await Logo.findOne({});

    let siteLogo = lOgo ? lOgo.url : " ";

    let user = req.user;
    if (!user) {
      req.flash("error_msg", "please re-login");
      res.redirect("/users/login");
    }

    let totalSales = await Order.aggregate([
      { $group: { _id: null, totalsale: { $sum: "$cart.totalCost" } } },
    ]);

    let totalProductViews = await Product.aggregate([
      { $group: { _id: null, totalproductviews: { $sum: "$viewCount" } } },
    ]);



    !totalSales || totalSales.length <= 0 ? totalSales = 0 : totalSales = totalSales[0].totalsale;
    !totalProductViews || totalProductViews.length <= 0 ? totalProductViews = 0 : totalProductViews = totalProductViews[0].totalproductviews
    // console.log('totalProductViews '+totalProductViews)
    let monthlyUsers = [];
    //new members
    const currentMonth = new Date().getMonth() + 1; // Get current month
    const currentYear = new Date().getFullYear(); // Get current year
    //console.log(currentYear)

    // get  new monthly users
    let Users = await User.find({});

    for (let User of Users) {
      let currentM = new Date(User.createdAt).getMonth() + 1;
      let currentY = new Date(User.createdAt).getFullYear();

      if (currentM === currentMonth && currentY === currentYear) {
        monthlyUsers.push(User);
      }
    }

    const pcount = await Product.countDocuments();
    const cartCount = await Cart.countDocuments();
    const cCount = await Coupon.countDocuments();
    const products = await Product.find({});
    const orderCount = await Order.countDocuments();
    const hero = await Hero.findOne({});
    const addresS = await Address.findOne({});
    const subCount = await Mail.count({});

    monthlyUsers = monthlyUsers.length;

    let ad50 = await Ad.findOne({});
    let allUsers = await User.count({});

    let fiftyOffProductsCount = await Product.count({ isFiftyOff: true });

    //orders preview
    let orders = await Order.find({})
      .sort({ createdAt: -1 })

      .populate("user")

      .limit(7);

    let users = await User.find({}).populate("fav");
    let userFavArr = [];

    for (let u of users) {
      userFavArr.push(u.fav.length);
    }
    let allFavs = 0;
    if (userFavArr.length > 0) {
      userFavArr = userFavArr.filter((val) => val > 0);
      let red = (acc, cv) => acc + cv;
      allFavs = userFavArr.reduce(red, 0);
    } else {
      allFavs = 0;
    }
    // console.log(allFavs)
    //countInStock processing
    let productStock = await Product.find({});

    //recently added products
    let prdctNew = await Product.find({}).sort({ createdAt: -1 }).limit(10);
    let apiKey = process.env.SMS_API_KEY;
    let slotsLeft = "";

    let smsBalUrl = `https://sms.textcus.com/api/balance?apikey=${apiKey}`;
    try {
      let resp = await axios.get(smsBalUrl);
      slotsLeft = resp.data["SMS balance"];
    }
    catch (e) {
      slotsLeft = "Too Many Request,Please Try Again Later"
    }





    res.render("admin/index", {
      slotsLeft,
      totalSales,
      totalProductViews,
      orderCount,
      pcount,
      cartCount,
      cCount,
      fiftyOffProductsCount,
      hero,
      ad50,
      addresS,
      monthlyUsers,
      allUsers,
      orders,
      prdctNew,
      subCount,
      productStock,
      allFavs,
      siteLogo,
      user,
    });
  } catch (e) {
    console.log(e);
  }
});

router.get("/dp-change", ensureAuthenticated, adminAuth,supaAdminAuth, async (req, res) => {
  req.session.currentUrl = req.originalUrl;

  // console.log(" HERE "+lOgo)
  const cCount = await coupon.countDocuments();
  const pcount = await Product.countDocuments();
  const orderCount = await Order.countDocuments();
  const subCount = await Mail.count({});

  const fiftyOffProductsCount = await Product.count({
    isFiftyOff: true,
  });
  const hero = await Hero.findOne({});
  const ad50 = await Ad.findOne({});
  const addresS = await Address.findOne({});
  let lOgo = await Logo.findOne({});
  let siteLogo = lOgo ? lOgo.url : " ";

  let user = req.user;
  if (!user) {
    req.flash("error_msg", "please re-login");
    res.redirect("/users/login");
  }
  res.render("admin/change-dp", {
    ad50,
    hero,
    cCount,
    pcount,
    orderCount,
    fiftyOffProductsCount,
    addresS,
    subCount,
    user,
    siteLogo,
  });
});

router.post("/change-dp", ensureAuthenticated, adminAuth, supaAdminAuth,async (req, res) => {
  let lOgo = await Logo.findOne({});
  let siteLogo = lOgo ? lOgo.url : " ";

  let user = req.user;
  if (!user) {
    req.flash("error_msg", "please re-login");
    res.redirect("/users/login");
  }

  const uploader = async (path) => await cloudinary.uploads(path, "Images");

  let files = [req.files];
  file = files[0].image;
  const tmp_file = file.tempFilePath;
  const newPath = await uploader(tmp_file);
  fs.unlinkSync(tmp_file);
  user.dp = newPath;
  await user.save();
  req.flash("success_msg", "Successfully updated your DP!");
  res.redirect("/admin/");
});
router.get("/logo-change", ensureAuthenticated, adminAuth, supaAdminAuth,async (req, res) => {
  req.session.currentUrl = req.originalUrl;

  let lOgo = await Logo.findOne({});
  let siteLogo = lOgo ? lOgo.url : " ";

  const cCount = await coupon.countDocuments();
  const pcount = await Product.countDocuments();
  const orderCount = await Order.countDocuments();
  const subCount = await Mail.count({});

  const fiftyOffProductsCount = await Product.count({
    isFiftyOff: true,
  });
  const hero = await Hero.findOne({});
  const ad50 = await Ad.findOne({});
  const addresS = await Address.findOne({});
  let user = req.user;
  if (!user) {
    req.flash("error_msg", "please re-login");
    res.redirect("/users/login");
  }

  res.render("admin/logo-change", {
    ad50,
    hero,
    cCount,
    pcount,
    orderCount,
    fiftyOffProductsCount,
    addresS,
    subCount,
    user,
    siteLogo,
  });
});

router.post(
  "/logo-change",
  ensureAuthenticated,
  adminAuth,
  supaAdminAuth,
  async (req, res) => {
    let user = req.user;
    if (!user) {
      req.flash("error_msg", "please re-login");
      res.redirect("/users/login");
    }

    try {
      const uploader = async (path) => await cloudinary.uploads(path, "Images");
      let logo = await Logo.find({});
      if (logo) {
        await Logo.deleteMany({});
      }

      let files = [req.files];
      file = files[0].image;
      const tmp_file = file.tempFilePath;
      const newPath = await uploader(tmp_file);
      fs.unlinkSync(tmp_file);
      console.log(newPath);
      logo = new Logo({ url: newPath });
      logo = await logo.save();
      req.flash("success_msg", "Successfully updated Site's Logo!");
      res.redirect("/admin/");
    } catch (e) {
      console.log(e);
    }
  }
);

router.get("/logout", ensureAuthenticated, adminAuth, (req, res) => {
  req.logOut();
  req.flash("success_msg", "You Have Successfully Logged Out");
  res.redirect("/users/login");
});

router.get(
  "/search-product",
  ensureAuthenticated,
  adminAuth,
  async (req, res) => {
    try {
      let currentUrl = req.originalUrl
      let currentPage = parseInt(req.query.page) || 1;
      let itemPerPage = 35;
      const pcount = await Product.countDocuments();

      let pages = Math.ceil(pcount / itemPerPage);



      let isSingleProduct = false
      req.session.currentUrl = req.originalUrl;

      let lOgo = await Logo.findOne({});

      let siteLogo = lOgo ? lOgo.url : " ";

      let user = req.user;
      if (!user) {
        req.flash("error_msg", "please re-login");
        res.redirect("/users/login");
      }
      const cCount = await coupon.countDocuments();
      const orderCount = await Order.countDocuments();
      const addresS = await Address.findOne({});
      let fiftyOffProductsCount = await Product.count({ isFiftyOff: true });

      let ad = await Address.findOne({});
      let hero = await Hero.findOne({});
      const subCount = await Mail.count({});

      let ad50 = await Ad.findOne({});

      let msg = [];
      const { search } = req.query;
      let product = await Product.findOne({ name: search });
      const category = await Category.findOne({ name: search });

      if (product) {
        isSingleProduct = true
        msg.push("Search results for " + search);
      }
      else if (category) {
        isSingleProduct = false

        msg.push("Search results for " + search);
        return res.redirect('/admin/shop/' + category.slug)


      }
      else {
        msg.push("No resource named  " + search + " mind  creating  it? ");
      }
      res.render("admin/search-result", {
        currentPage,
        pages,
        isSingleProduct,
        msg,
        product,
        ad50,
        hero,
        cCount,
        pcount,
        orderCount,
        subCount,
        siteLogo,
        user,
        ad,
        addresS,
        product,
        category,
        fiftyOffProductsCount,
        currentUrl,
        search
      });
    } catch (e) {
      console.log(e);
    }
  }
);

//getting a single product
router.get("/product/:slug", ensureAuthenticated, adminAuth, async (req, res) => {
  req.session.currentUrl = req.originalUrl;

  try {
    let lOgo = await Logo.findOne({});

    let siteLogo = lOgo ? lOgo.url : " ";

    let user = req.user;
    if (!user) {
      req.flash("error_msg", "please re-login");
      res.redirect("/users/login");
    }
    const product = await Product.findOne({ slug: req.params.slug });
    const cCount = await coupon.countDocuments();
    const pcount = await Product.countDocuments();
    const orderCount = await Order.countDocuments();
    const addresS = await Address.findOne({});
    let fiftyOffProductsCount = await Product.count({ isFiftyOff: true });

    let ad = await Address.findOne({});
    let hero = await Hero.findOne({});
    let ad50 = await Ad.findOne({});
    const subCount = await Mail.count({});

    res.render("admin/single-product", {
      hero,
      cCount,
      pcount,
      orderCount,
      ad50,
      subCount,
      ad,
      addresS,
      product,
      fiftyOffProductsCount,
      siteLogo,
      user,
    });
  } catch (e) { }
});

//changing orderstatus after delivery
router.post(
  "/order-delivered/:id",
  ensureAuthenticated,
  adminAuth,
  supaAdminAuth,
  async (req, res) => {
    sgMail.setApiKey(sendGridApiKey);
    const order = await Order.findById(req.params.id).populate("user");
    // console.log("mine " + order.user.email);
    let userEmail = order.user.email;
    const hero = await Hero.findOne({});
    let protocol = process.env.NODE_ENV === "production" ? "https" : "http";
    let support_url = `${protocol}://${req.headers.host}/contact`;

    let itemsPurchased = [];
    for (let item of order.cart.items) {
      itemsPurchased.push({
        itemName: item.title,
        itemQty: item.qty,
        itemPrice: item.price,
      });
    }

    let itemspchsD = ``;
    n = "\n";

    for (item of itemsPurchased) {
      itemspchsD += `${n} <h6  style="font-family:verdana; color:#256AB4">Item's Name:</h6>   ${item.itemName}
    <h6 style="font-family:verdana; color:red">Quantity Bought:</h6> ${item.itemQty}
    ===${n}
    <h6 style="font-family:verdana; color:red"> item's total price: </h6>₵${item.itemPrice}`;
    }
    let orderDate = new Date(order.createdAt).toDateString();
    let orderMsg = `
     <h3 style="font-family:verdana; color:#007bff"> Hello ${order.user.name}  </h3>${n}

     <h4 style="font-family:verdana; color:#007bff"> Inventory Report From: </h4> "YUTA-MART"${n}.
    <h4 style="font-family:verdana; color:#007bff"> Date You Made An Order: </h4> ${orderDate}${n}.

     <h5 style="font-family:verdana; color:#007bff"> Items You Purchased: </h5>
      ${itemspchsD}
     <h6> TotalCost Of Your Order Was: ₵${order.cart.totalCost}</h6>
     </h6> Thank You For Buying From Us,We hope To See You Again Soon. </h6>
     </h6> Kindly Join Our NewsLetter For More Awesome And Crazy Deals </h6>
      `;

    const msg = {
      from: "developersavenue@gmail.com", // Change to your recipient
      to: userEmail, // Change to your verified sender
      subject: "Mini Receipt [YUTA-MART]",
      text: "and easy to do anywhere, even with Node.js",
      html: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
      <html xmlns="http://www.w3.org/1999/xhtml">
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <meta name="x-apple-disable-message-reformatting" />
          <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
          <meta name="color-scheme" content="light dark" />
          <meta name="supported-color-schemes" content="light dark" />
          <title></title>
          <style type="text/css" rel="stylesheet" media="all">
          /* Base ------------------------------ */

          @import url("https://fonts.googleapis.com/css?family=Nunito+Sans:400,700&display=swap");
          body {
            width: 100% !important;
            height: 100%;
            margin: 0;
            -webkit-text-size-adjust: none;
          }

          a {
            color: #3869D4;
          }

          a img {
            border: none;
          }

          td {
            word-break: break-word;
          }

          .preheader {
            display: none !important;
            visibility: hidden;
            mso-hide: all;
            font-size: 1px;
            line-height: 1px;
            max-height: 0;
            max-width: 0;
            opacity: 0;
            overflow: hidden;
          }
          /* Type ------------------------------ */

          body,
          td,
          th {
            font-family: "Nunito Sans", Helvetica, Arial, sans-serif;
          }

          h1 {
            margin-top: 0;
            color: #333333;
            font-size: 22px;
            font-weight: bold;
            text-align: left;
          }

          h2 {
            margin-top: 0;
            color: #333333;
            font-size: 16px;
            font-weight: bold;
            text-align: left;
          }

          h3 {
            margin-top: 0;
            color: #333333;
            font-size: 14px;
            font-weight: bold;
            text-align: left;
          }

          td,
          th {
            font-size: 16px;
          }

          p,
          ul,
          ol,
          blockquote {
            margin: .4em 0 1.1875em;
            font-size: 16px;
            line-height: 1.625;
          }

          p.sub {
            font-size: 13px;
          }
          /* Utilities ------------------------------ */

          .align-right {
            text-align: right;
          }

          .align-left {
            text-align: left;
          }

          .align-center {
            text-align: center;
          }
          /* Buttons ------------------------------ */

          .button {
            background-color: #3869D4;
            border-top: 10px solid #3869D4;
            border-right: 18px solid #3869D4;
            border-bottom: 10px solid #3869D4;
            border-left: 18px solid #3869D4;
            display: inline-block;
            color: #FFF;
            text-decoration: none;
            border-radius: 3px;
            box-shadow: 0 2px 3px rgba(0, 0, 0, 0.16);
            -webkit-text-size-adjust: none;
            box-sizing: border-box;
          }

          .button--green {
            background-color: #22BC66;
            border-top: 10px solid #22BC66;
            border-right: 18px solid #22BC66;
            border-bottom: 10px solid #22BC66;
            border-left: 18px solid #22BC66;
          }

          .button--red {
            background-color: #FF6136;
            border-top: 10px solid #FF6136;
            border-right: 18px solid #FF6136;
            border-bottom: 10px solid #FF6136;
            border-left: 18px solid #FF6136;
          }

          @media only screen and (max-width: 500px) {
            .button {
              width: 100% !important;
              text-align: center !important;
            }
          }
          /* Attribute list ------------------------------ */

          .attributes {
            margin: 0 0 21px;
          }

          .attributes_content {
            background-color: #F4F4F7;
            padding: 16px;
          }

          .attributes_item {
            padding: 0;
          }
          /* Related Items ------------------------------ */

          .related {
            width: 100%;
            margin: 0;
            padding: 25px 0 0 0;
            -premailer-width: 100%;
            -premailer-cellpadding: 0;
            -premailer-cellspacing: 0;
          }

          .related_item {
            padding: 10px 0;
            color: #CBCCCF;
            font-size: 15px;
            line-height: 18px;
          }

          .related_item-title {
            display: block;
            margin: .5em 0 0;
          }

          .related_item-thumb {
            display: block;
            padding-bottom: 10px;
          }

          .related_heading {
            border-top: 1px solid #CBCCCF;
            text-align: center;
            padding: 25px 0 10px;
          }
          /* Discount Code ------------------------------ */

          .discount {
            width: 100%;
            margin: 0;
            padding: 24px;
            -premailer-width: 100%;
            -premailer-cellpadding: 0;
            -premailer-cellspacing: 0;
            background-color: #F4F4F7;
            border: 2px dashed #CBCCCF;
          }

          .discount_heading {
            text-align: center;
          }

          .discount_body {
            text-align: center;
            font-size: 15px;
          }
          /* Social Icons ------------------------------ */

          .social {
            width: auto;
          }

          .social td {
            padding: 0;
            width: auto;
          }

          .social_icon {
            height: 20px;
            margin: 0 8px 10px 8px;
            padding: 0;
          }
          /* Data table ------------------------------ */

          .purchase {
            width: 100%;
            margin: 0;
            padding: 35px 0;
            -premailer-width: 100%;
            -premailer-cellpadding: 0;
            -premailer-cellspacing: 0;
          }

          .purchase_content {
            width: 100%;
            margin: 0;
            padding: 25px 0 0 0;
            -premailer-width: 100%;
            -premailer-cellpadding: 0;
            -premailer-cellspacing: 0;
          }

          .purchase_item {
            padding: 10px 0;
            color: #51545E;
            font-size: 15px;
            line-height: 18px;
          }

          .purchase_heading {
            padding-bottom: 8px;
            border-bottom: 1px solid #EAEAEC;
          }

          .purchase_heading p {
            margin: 0;
            color: #4D44D3;
            font-size: 10px;
          }

          .purchase_footer {
            padding-top: 15px;
            border-top: 1px solid #EAEAEC;
          }

          .purchase_total {
            margin: 0;
            text-align: right;
            font-weight: bold;
            color: #333333;
          }

          .purchase_total--label {
            padding: 0 15px 0 0;
          }

          body {
            background-color: #F2F4F6;
            color: #51545E;
          }

          p {
            color: #51545E;
          }

          .email-wrapper {
            width: 100%;
            margin: 0;
            padding: 0;
            -premailer-width: 100%;
            -premailer-cellpadding: 0;
            -premailer-cellspacing: 0;
            background-color: #F2F4F6;
          }

          .email-content {
            width: 100%;
            margin: 0;
            padding: 0;
            -premailer-width: 100%;
            -premailer-cellpadding: 0;
            -premailer-cellspacing: 0;
          }
          /* Masthead ----------------------- */

          .email-masthead {
            padding: 25px 0;
            text-align: center;
          }

          .email-masthead_logo {
            width: 94px;
          }

          .email-masthead_name {
            font-size: 16px;
            font-weight: bold;
            color: #A8AAAF;
            text-decoration: none;
            text-shadow: 0 1px 0 white;
          }
          /* Body ------------------------------ */

          .email-body {
            width: 100%;
            margin: 0;
            padding: 0;
            -premailer-width: 100%;
            -premailer-cellpadding: 0;
            -premailer-cellspacing: 0;
          }

          .email-body_inner {
            width: 570px;
            margin: 0 auto;
            padding: 0;
            -premailer-width: 570px;
            -premailer-cellpadding: 0;
            -premailer-cellspacing: 0;
            background-color: #FFFFFF;
          }

          .email-footer {
            width: 570px;
            margin: 0 auto;
            padding: 0;
            -premailer-width: 570px;
            -premailer-cellpadding: 0;
            -premailer-cellspacing: 0;
            text-align: center;
          }

          .email-footer p {
            color: #A8AAAF;
          }

          .body-action {
            width: 100%;
            margin: 30px auto;
            padding: 0;
            -premailer-width: 100%;
            -premailer-cellpadding: 0;
            -premailer-cellspacing: 0;
            text-align: center;
          }

          .body-sub {
            margin-top: 25px;
            padding-top: 25px;
            border-top: 1px solid #EAEAEC;
          }

          .content-cell {
            padding: 45px;
          }
          /*Media Queries ------------------------------ */

          @media only screen and (max-width: 600px) {
            .email-body_inner,
            .email-footer {
              width: 100% !important;
            }
          }

          @media (prefers-color-scheme: dark) {
            body,
            .email-body,
            .email-body_inner,
            .email-content,
            .email-wrapper,
            .email-masthead,
            .email-footer {
              background-color: #333333 !important;
              color: #FFF !important;
            }
            p,
            ul,
            ol,
            blockquote,
            h1,
            h2,
            h3,
            span,
            .purchase_item {
              color: #FFF !important;
            }
            .attributes_content,
            .discount {
              background-color: #222 !important;
            }
            .email-masthead_name {
              text-shadow: none !important;
            }
          }

          :root {
            color-scheme: light dark;
            supported-color-schemes: light dark;
          }
          </style>
          <!--[if mso]>
          <style type="text/css">
            .f-fallback  {
              font-family: Arial, sans-serif;
            }
          </style>
        <![endif]-->
        </head>
        <body>
          <table class="email-wrapper" width="100%" cellpadding="0" cellspacing="0" role="presentation">
            <tr>
              <td align="center">
                <table class="email-content" width="100%" cellpadding="0" cellspacing="0" role="presentation">
                  <tr>
                    <td class="email-masthead">
                      <a href="https://yuta-mart.com" class="f-fallback email-masthead_name">
                      Yuta-mart
                    </a>
                    </td>
                  </tr>
                  <!-- Email Body -->
                  <tr>
                    <td class="email-body" width="570" cellpadding="0" cellspacing="0">
                      <table class="email-body_inner" align="center" width="570" cellpadding="0" cellspacing="0" role="presentation">
                        <!-- Body content -->
                        <tr>
                          <td class="content-cell">
                            <div class="f-fallback">
                              <h1>Hello ${order.user.name},</h1>
                              <p>Thanks for buying from yuta-mart. This is an invoice for your recent order.</p>
                              <table class="attributes" width="100%" cellpadding="0" cellspacing="0" role="presentation">
                                <tr>
                                  <td class="attributes_content">
                                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                                      <tr>
                                        <td class="attributes_item">
                                          <span class="f-fallback">
                    <strong>Amount Due:</strong> ₵${order.cart.totalCost}
                  </span>
                                        </td>
                                      </tr>
                                      <tr>
                                        <td class="attributes_item">
                                          <span class="f-fallback">
                    <strong>Order Was Made On:</strong> ${orderDate}
                  </span>
                                        </td>
                                      </tr>
                                    </table>
                                  </td>
                                </tr>
                              </table>
                              <!-- Action -->
                              <table class="body-action" align="center" width="100%" cellpadding="0" cellspacing="0" role="presentation">
                                <tr>
                                  <td align="center">
                                    <!-- Border based button
                 https://litmus.com/blog/a-guide-to-bulletproof-buttons-in-email-design -->
                                    <table width="100%" border="0" cellspacing="0" cellpadding="0" role="presentation">
                                      <tr>
                                        <td align="center">
                                          <!-- <a href="{{action_url}}" class="f-fallback button button--green" target="_blank">Pay Invoice</a> -->
                                        </td>
                                      </tr>
                                    </table>
                                  </td>
                                </tr>
                              </table>
                              <table class="purchase" width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                  <td>
                                    <!-- <h3>{{invoice_id}}</h3> -->
                                  </td>
                                  <td>
                                    <!-- <h3 class="align-right">{{date}}</h3> -->
                                  </td>
                                </tr>
                                <tr>
                                  <td colspan="">
                                    <table class="purchase_content" width="100%" cellpadding="0" cellspacing="0">
                                      <tr>
                                     <th class="purchase_heading" align="left">
                                          <p class=""> YUTA-RECEIPT</p>
                                        </th>
                                      </tr>
                                      <!-- {{#each invoice_details}} -->
                                      <tr>
                                         ${itemspchsD}

                                      </tr>
                                      <tr>
                                        <td width="80%" class="purchase_footer" valign="middle">
                                          <p class="f-fallback purchase_total purchase_total--label">Total</p>
                                        </td>
                                        <td width="20%" class="purchase_footer" valign="middle">
                                          <p class="f-fallback purchase_total">₵ ${order.cart.totalCost}</p>
                                        </td>
                                      </tr>
                                    </table>
                                  </td>
                                </tr>
                              </table>
                              <p>If you have any questions about this invoice, simply reply to this email or reach out to our <a href="${support_url}">support team</a> for help.</p>
                              <p>Cheers,
                                <br>The Yuta-mart Team</p>
                              <!-- Sub copy -->

                            </div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <table class="email-footer" align="center" width="570" cellpadding="0" cellspacing="0" role="presentation">
                        <tr>
                          <td class="content-cell" align="center">
                            <p class="f-fallback sub align-center">
                              [Yuta-mart, Inc]
                              <br>Adehyeɛ Market Kumasi,Opposite zoo.
                                    <br>0245688822.
                                    <br>yutamart1@gmail.com
                            </p>
                            <p class="f-fallback sub align-center">&copy; 2021. All rights reserved.</p>

                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>`,
    };

    sgMail
      .send(msg)
      .then(async () => {
        let sender = "YUTA";

        let sms =
          "Hello,we just sent you the inventory report of your purchase through your email,thank you for buying from us";
        let senderEncode = encodeURI(sms);
        recipient = order.phone;
        senderEncode = encodeURI(sender);
        let messageEncode = encodeURI(sms);

        let url = `https://sms.textcus.com/api/send?apikey=${smsApiKey}&destination=${recipient}&source=${senderEncode}&dlr=0&type=0&message=${messageEncode}`;
        // Using axios to send a get request
        axios.get(url).then((resp) => {
          console.log(resp);
        });

        order.Delivered = true;
        await order.save();
        req.flash(
          "success_msg",
          "Order Status Successfully Changed To[ DELIVERED STATE]"
        );
        // res.redirect("/admin/orders");
        res.redirect(req.headers.referer);
      })
      .catch((error) => {
        console.error(error);
      });
  }
);

//changing orderstatus to not delivered
router.post(
  "/order-not-delivered/:id",
  ensureAuthenticated,
  adminAuth,
  supaAdminAuth,
  async (req, res) => {
    const order = await Order.findById(req.params.id);
    order.Delivered = false;
    await order.save();
    req.flash(
      "success_msg",
      "Order Status Successfully Changed To[NOT DELIVERED STATE]"
    );
    // res.redirect("/admin/orders");
    res.redirect(req.headers.referer);
  }
);

//changing orderstatus to  paid
router.post(
  "/order-not-paid/:id",
  ensureAuthenticated,
  adminAuth,
  supaAdminAuth,
  async (req, res) => {
    const order = await Order.findById(req.params.id);

    order.payMentStatus = false;

    await order.save();
    req.flash(
      "success_msg",
      "Payment Status Successfully Changed  To[A NOT PAID STATE]"
    );
    // res.redirect("/admin/orders");
    res.redirect(req.headers.referer);
  }
);

//changing orderstatus to not paid
router.post(
  "/order-paid/:id",
  ensureAuthenticated,
  adminAuth,
  supaAdminAuth,
  async (req, res) => {
    const order = await Order.findById(req.params.id);

    order.payMentStatus = true;

    await order.save();
    req.flash(
      "success_msg",
      "Payment Status Successfully Changed To[A PAID STATE]"
    );
    // res.redirect("/admin/orders");
    res.redirect(req.headers.referer);
  }
);
//Adding a product to 50% off
router.post(
  "/product-to-donko/:id",
  ensureAuthenticated,
  adminAuth,
  supaAdminAuth,
  async (req, res) => {
    const product = await Product.findById(req.params.id);
    product.isFiftyOff = true;
    product.discount = 50;
    product.price = product.oldPrice - (50 / 100) * product.oldPrice;

    await product.save();
    req.flash("Successfully added " + product.name + " to 50% off products");
    res.redirect(req.headers.referer);
  }
);

//Removing a product from 50% off

router.post(
  "/donko-to-previous/:id",
  ensureAuthenticated,
  adminAuth,
  supaAdminAuth,
  async (req, res) => {
    const product = await Product.findById(req.params.id);
    product.isFiftyOff = false;
    product.discount = 0;
    product.price = product.oldPrice;
    await product.save();
    req.flash(
      "Successfully removed " + product.name + " from 50% off products"
    );
    res.redirect(req.headers.referer);
  }
);

//custom discount from admin
router.get("/discount", ensureAuthenticated, adminAuth, supaAdminAuth,async (req, res) => {
  let lOgo = await Logo.findOne({});
  req.session.currentUrl = req.originalUrl;

  let siteLogo = lOgo ? lOgo.url : " ";

  let user = req.user;
  if (!user) {
    req.flash("error_msg", "please re-login");
    res.redirect("/users/login");
  }
  const pcount = await Product.countDocuments();
  const cartCount = await Cart.countDocuments();
  const cCount = await Coupon.countDocuments();
  const orderCount = await Order.countDocuments();
  const products = await Product.find({});
  const subCount = await Mail.count({});

  const hero = await Hero.findOne({});
  let ad50 = await Ad.findOne({});
  const addresS = await Address.findOne({});

  let fiftyOffProductsCount = await Product.count({ isFiftyOff: true });

  res.render("admin/customDiscount", {
    products,
    pcount,
    cCount,
    fiftyOffProductsCount,
    cartCount,
    orderCount,
    hero,
    ad50,
    addresS,
    subCount,
    siteLogo,
    user,
  });
});

//editing custom discount
router.get(
  "/discount/edit/:id",
  ensureAuthenticated,
  adminAuth,
  supaAdminAuth,
  async (req, res) => {
    req.session.currentUrl = req.originalUrl;

    let lOgo = await Logo.findOne({});

    let siteLogo = lOgo ? lOgo.url : " ";

    let user = req.user;
    if (!user) {
      req.flash("error_msg", "please re-login");
      res.redirect("/users/login");
    }
    const pcount = await Product.countDocuments();
    const cartCount = await Cart.countDocuments();
    const cCount = await Coupon.countDocuments();
    const products = await Product.find({});
    const hero = await Hero.findOne({});
    let ad50 = await Ad.findOne({});
    const addresS = await Address.findOne({});
    const subCount = await Mail.count({});
    const orderCount = await Order.countDocuments();

    let fiftyOffProductsCount = await Product.count({ isFiftyOff: true });

    res.render("admin/customDiscountEdit", {
      orderCount,
      products,
      pcount,
      cCount,
      fiftyOffProductsCount,
      cartCount,
      hero,
      ad50,
      addresS,
      subCount,
      siteLogo,
      user,
    });
  }
);

//finally updating discount
router.post(
  "/discount/edit/:id",
  ensureAuthenticated,
  adminAuth,
  supaAdminAuth,

  async (req, res) => {
    let product = await Product.findById(req.params.id);

    if (parseInt(req.body.discount) == 0) {
      //no discount
      let noDiscount = await Product.findByIdAndUpdate(
        { _id: req.params.id },
        {
          $set: {
            discount: 0,
            price: product.oldPrice,
            isFiftyOff: false,
          },
        },
        { new: true }
      );
    } else if (parseInt(req.body.discount) == 50) {
      let fiftyPriceUpdate = await Product.findByIdAndUpdate(
        { _id: req.params.id },
        {
          $set: {
            discount: 50,
            price:
              product.oldPrice -
              (parseInt(req.body.discount) / 100) * product.oldPrice,

            isFiftyOff: true,
          },
        },
        { new: true }
      );
    }

    //if product had no discount in the first place
    product.price =
      product.oldPrice - (parseInt(req.body.discount) / 100) * product.oldPrice;
    product.discount = parseInt(req.body.discount);
    update = await product.save();
    console.log(update);
    req.flash(
      "success_msg",
      "Discount Applied on product " + product.name + " !"
    );

    res.redirect(req.headers.referer);
  }
);

//DELETING coupon
router.delete(
  "/coupon/:id",
  ensureAuthenticated,
  adminAuth,
  supaAdminAuth,

  async (req, res) => {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    req.flash("sucess_msg", `${coupon.code} is successfully deleted`);
    res.redirect(req.headers.referer);
    // console.log(coupon)
  }
);

//coupon generation route
router.get("/coupon", ensureAuthenticated, adminAuth, 
supaAdminAuth,
async (req, res) => {
  req.session.currentUrl = req.originalUrl;

  let lOgo = await Logo.findOne({});

  let siteLogo = lOgo ? lOgo.url : " ";

  let user = req.user;
  if (!user) {
    req.flash("error_msg", "please re-login");
    res.redirect("/users/login");
  }
  const pcount = await Product.countDocuments();
  const cartCount = await Cart.countDocuments();
  const cCount = await Coupon.countDocuments();
  const products = await Product.find({});
  const orderCount = await Order.countDocuments();
  const hero = await Hero.findOne({});
  let ad50 = await Ad.findOne({});
  const addresS = await Address.findOne({});
  const subCount = await Mail.count({});

  let fiftyOffProductsCount = await Product.count({ isFiftyOff: true });

  let fmt = "YYYY-MM-DD";

  const now = moment().format(fmt);

  const coupons = await Coupon.find({}).sort({ createdAt: -1 });
  const code = couponGen();

  coupons.forEach(async (coupon) => {
    let dbDate = moment(coupon.expireDate).format(fmt);
    if (!moment(now).isBefore(dbDate)) {
      //coupon is expired
      coupon.isActive = false;
      await coupon.save();
    }
  });

  res.render("admin/coupon", {
    orderCount,
    cartCount,
    pcount,
    code,
    coupons,
    cCount,
    fiftyOffProductsCount,
    hero,
    ad50,
    addresS,
    subCount,
    siteLogo,
    user,
  });
});

router.post("/coupon", ensureAuthenticated, adminAuth, 
supaAdminAuth,
async (req, res) => {
  let lOgo = await Logo.findOne({});

  let siteLogo = lOgo ? lOgo.url : " ";

  let user = req.user;
  if (!user) {
    req.flash("error_msg", "please re-login");
    res.redirect("/users/login");
  }
  const coupons = await Coupon.find({}).sort({ createdAt: -1 });
  const pcount = await Product.countDocuments();
  const cartCount = await Cart.countDocuments();
  const cCount = await Coupon.countDocuments();
  const products = await Product.find({});
  const orderCount = await Order.countDocuments();
  const hero = await Hero.findOne({});
  let ad50 = await Ad.findOne({});
  const addresS = await Address.findOne({});
  const subCount = await Mail.count({});

  let fiftyOffProductsCount = await Product.count({ isFiftyOff: true });

  errors = [];
  const { code, date, worth } = req.body;
  console.log(date);

  const validation = new Validator(
    {
      code: code,
      date: date,
      worth: worth,
    },
    {
      code: "string|required",
      date: "date|required|string",
      worth: "required",
    }
  );

  if (validation.fails()) {
    const errCode = validation.errors.get("code");
    const errDate = validation.errors.get("date");
    const errWrth = validation.errors.get("worth");
    errors.push(errCode, errDate, errWrth);

    res.render("admin/coupon", {
      orderCount,
      errors,
      pcount,
      code,
      date,
      worth,
      coupons,
      cartCount,
      cCount,
      fiftyOffProductsCount,
      hero,
      ad50,
      addresS,
      siteLogo,
      user,
      subCount,
    });
  } else {
    validation.passes(async () => {
      let newCoupon = new Coupon({
        code,
        worth,
        expireDate: date,
      });
      newCoupon = await newCoupon.save();
      //console.log(newCoupon)
      res.redirect(req.headers.referer);

      // console.log(date,code,worth)
    });
  }
});

// POST  ADDING PRODUCT
router.post("/upload", ensureAuthenticated, adminAuth, 
semiAdminAuth,


async (req, res) => {
  let lOgo = await Logo.findOne({});

  let siteLogo = lOgo ? lOgo.url : " ";

  let user = req.user;
  if (!user) {
    req.flash("error_msg", "please re-login");
    res.redirect("/users/login");
  }
  errors = [];
  const cCount = await Coupon.countDocuments();
  const pcount = await Product.countDocuments();
  const products = await Product.find({});
  const orderCount = await Order.countDocuments();

  let fiftyOffProductsCount = await Product.count({ isFiftyOff: true });

  const { desc, name, rdesc, category, price, stockCount, keyFeatures } =
    req.body;
  const validation = new Validator(
    {
      name: req.body.name,
      description: req.body.desc,
      rDesc: req.body.rdesc,
      category: req.body.category,
      price: req.body.price,
      countInStock: req.body.stockCount,
      keyFeatures: req.body.keyFeatures,
      picGallery: req.body.picGallery,
    },
    {
      name: "string|required",
      description: "required|string",
      rDesc: "required",
      category: "required",
      price: "numeric|required",
      countInStock: "numeric|required",
      keyFeatures: "required",
      picGallery: "required",
    }
  );
  if (validation.fails()) {
    const errName = validation.errors.get("name");
    const errDesc = validation.errors.get("description");
    const errR_Desc = validation.errors.get("rDesc");
    const errCat = validation.errors.get("category");
    const errPrc = validation.errors.get("price");
    const errPicGallery = validation.errors.get("picGallery");

    const errCStock = validation.errors.get("countInStock");
    const errKeyFeatures = validation.errors.get("keyFeatures");

    const hero = await Hero.findOne({});
    let ad50 = await Ad.findOne({});
    const addresS = await Address.findOne({});
    const subCount = await Mail.count({});

    errors.push(
      errName,
      errDesc,
      errR_Desc,
      errCat,
      errPrc,
      errCStock,
      errKeyFeatures,
      errPicGallery
    );
    let categories = await Category.find({}).sort({ name: 1 });
    res.render("admin/addproduct", {
      errors,
      categories,
      desc,
      name,
      rdesc,
      category,
      price,
      stockCount,
      pcount,
      cCount,
      fiftyOffProductsCount,
      orderCount,
      hero,
      ad50,
      addresS,
      categories,
      subCount,
      siteLogo,
      keyFeatures,
      user,
    });
  } else {
    validation.passes(async () => {
      const urls = [];
      let ds = req.body.dsc;
      let disCount = ds == "true" ? 50 : 0; //if user gives 50% off discount,

      const uploader = async (path) => await cloudinary.uploads(path, "Images");

      //more than one picture
      const galleryOption = req.body.picGallery;
      if (galleryOption == "false") {
        let files = [req.files];
        files = files[0].image;
        console.log(files);
        for (let file of files) {
          let tmp_file = file.tempFilePath;
          let newPath = await uploader(tmp_file);
          urls.push(newPath);
          fs.unlinkSync(tmp_file);
        }
        let strName = req.body.name;
        strName = strName.toLowerCase();
        let newProduct = new Product({
          name: strName,
          description: req.body.desc,
          richDescription: req.body.rdesc,
          category: req.body.category,
          price: req.body.price,
          countInStock: req.body.stockCount,
          isFeatured: req.body.feature,
          isFiftyOff: req.body.dsc,
          oldPrice: req.body.price,
          keyFeatures: req.body.keyFeatures,
          image: urls,
          discount: disCount,
          originalCountInStock: req.body.stockCount,
          picGallery: req.body.picGallery,
        });
        newProduct = await newProduct.save();
        if (newProduct.isFiftyOff == true) {
          let offCalc = newProduct.price - (50 / 100) * newProduct.price;
          newProduct = await Product.findByIdAndUpdate(
            { _id: newProduct._id },
            {
              $set: {
                price: offCalc,
              },
            },
            { new: true }
          );
        }
        req.flash("success_msg", `Successfully Added ${newProduct.name}`);
        res.redirect("/admin/products/all");
      } else if (galleryOption === "true") {
        let tmp_file_ = req.files.image.tempFilePath;

        let new_Path = await uploader(tmp_file_);
        urls.push(new_Path);
        // fs.unlinkSync(tmp_file_);

        strName = req.body.name;
        strName = strName.toLowerCase();
        newProduct = new Product({
          name: strName,
          description: req.body.desc,
          richDescription: req.body.rdesc,
          category: req.body.category,
          price: req.body.price,
          countInStock: req.body.stockCount,
          isFeatured: req.body.feature,
          isFiftyOff: req.body.dsc,
          oldPrice: req.body.price,
          keyFeatures: req.body.keyFeatures,
          image: urls,
          discount: disCount,
          originalCountInStock: req.body.stockCount,
          picGallery: req.body.picGallery,
        });

        newProduct = await newProduct.save();

        if (newProduct.isFiftyOff == true) {
          let offCalc = newProduct.price - (50 / 100) * newProduct.price;
          newProduct = await Product.findByIdAndUpdate(
            { _id: newProduct._id },
            {
              $set: {
                price: offCalc,
              },
            },
            { new: true }
          );
        }

        req.flash("success_msg", `Successfully Added ${newProduct.name}`);
        res.redirect("/admin/products/all");
      }
    });
  }
});

router.get("/add-product", ensureAuthenticated, adminAuth,
semiAdminAuth,
async (req, res) => {
  req.session.currentUrl = req.originalUrl;

  let lOgo = await Logo.findOne({});
  let siteLogo = lOgo ? lOgo.url : " ";

  let user = req.user;
  if (!user) {
    req.flash("error_msg", "please re-login");
    res.redirect("/users/login");
  }
  const pcount = await Product.countDocuments();
  const cartCount = await Cart.countDocuments();
  const cCount = await Coupon.countDocuments();
  const products = await Product.find({});
  const orderCount = await Order.countDocuments();
  const hero = await Hero.findOne({});
  let ad50 = await Ad.findOne({});
  const addresS = await Address.findOne({});
  const subCount = await Mail.count({});

  let fiftyOffProductsCount = await Product.count({ isFiftyOff: true });

  Category.find({})
    .sort({ createdAt: -1 })
    .then((categories) => {
      res.render("admin/addproduct", {
        categories,
        pcount,
        cCount,
        cartCount,
        fiftyOffProductsCount,
        orderCount,
        hero,
        ad50,
        addresS,
        subCount,
        siteLogo,
        user,
      });
    });
});

//Add product
router.get(
  "/add-category",
  ensureAuthenticated,
  adminAuth,
  semiAdminAuth,
 
  async (req, res) => {
    req.session.currentUrl = req.originalUrl;

    let lOgo = await Logo.findOne({});
    let siteLogo = lOgo ? lOgo.url : " ";

    let user = req.user;
    if (!user) {
      req.flash("error_msg", "please re-login");
      res.redirect("/users/login");
    }
    Category.find({})
      .sort({ name: 1 })
      .then(async (categories) => {
        const pcount = await Product.countDocuments();
        const cartCount = await Cart.countDocuments();
        const cCount = await Coupon.countDocuments();
        const products = await Product.find({});
        const orderCount = await Order.countDocuments();
        const hero = await Hero.findOne({});
        const subCount = await Mail.count({});

        let ad50 = await Ad.findOne({});
        const addresS = await Address.findOne({});

        let fiftyOffProductsCount = await Product.count({ isFiftyOff: true });

        res.render("admin/addcategory", {
          categories,
          pcount,
          cartCount,
          cCount,
          orderCount,
          fiftyOffProductsCount,
          hero,
          ad50,
          addresS,
          subCount,
          siteLogo,
          user,
        });
      });
  }
);

// edit category
router.get(
  "/category/edit/:id",
  ensureAuthenticated,
  adminAuth,
  semiAdminAuth,

  async (req, res) => {
    req.session.currentUrl = req.originalUrl;

    let lOgo = await Logo.findOne({});
    let siteLogo = lOgo ? lOgo.url : " ";

    let user = req.user;
    if (!user) {
      req.flash("error_msg", "please re-login");
      res.redirect("/users/login");
    }
    const { id } = req.params;
    const pcount = await Product.countDocuments();
    const cCount = await Coupon.countDocuments();
    const products = await Product.find({});
    const orderCount = await Order.countDocuments();
    const hero = await Hero.findOne({});
    let ad50 = await Ad.findOne({});
    const addresS = await Address.findOne({});
    const subCount = await Mail.count({});

    let fiftyOffProductsCount = await Product.count({ isFiftyOff: true });

    Category.find({ _id: id }).then(async (CAtegory) => {
      Category.find({})
        .sort({ createdAt: -1 })
        .then(async (categories) => {
          const pcount = await Product.countDocuments();
          const cartCount = await Cart.countDocuments();
          let fiftyOffProductsCount = await Product.count({ isFiftyOff: true });

          res.render("admin/editcategory", {
            orderCount,
            categories,
            CAtegory,
            id,
            pcount,
            cartCount,
            cCount,
            fiftyOffProductsCount,
            hero,
            ad50,
            addresS,
            subCount,
            siteLogo,
            user,
          });
        });
    });
  }
);
router.get(
  "/edit/category",
  ensureAuthenticated,
  adminAuth,
  semiAdminAuth,


  async (req, res) => {
    let lOgo = await Logo.findOne({});
    let siteLogo = lOgo ? lOgo.url : " ";
    req.session.currentUrl = req.originalUrl;

    let user = req.user;
    if (!user) {
      req.flash("error_msg", "please re-login");
      res.redirect("/users/login");
    }
    const hero = await Hero.findOne({});
    let ad50 = await Ad.findOne({});
    const addresS = await Address.findOne({});
    const subCount = await Mail.count({});

    Category.find({})
      .sort({ name: -1 })
      .then(async (categories) => {
        const orderCount = await Order.countDocuments();

        const pcount = await Product.countDocuments();
        const cartCount = await Cart.countDocuments();
        const cCount = await Coupon.countDocuments();
        const products = await Product.find({});

        let fiftyOffProductsCount = await Product.count({ isFiftyOff: true });

        res.render("admin/editcategories", {
          orderCount,
          categories,
          pcount,
          cartCount,
          cCount,
          fiftyOffProductsCount,
          hero,
          ad50,
          addresS,
          subCount,
          siteLogo,
          user,
        });
      });
  }
);

//update category
router.put(
  "/category/edit/:id",
  ensureAuthenticated,
  adminAuth,
  semiAdminAuth,


  async (req, res) => {
    let lOgo = await Logo.findOne({});
    let siteLogo = lOgo ? lOgo.url : " ";

    let user = req.user;
    if (!user) {
      req.flash("error_msg", "please re-login");
      res.redirect("/users/login");
    }
    errors = [];
    const validation = new Validator(
      {
        name: req.body.name,
      },
      {
        name: "required",
      }
    );
    if (validation.fails()) {
      const errFullName = validation.errors.get("name");
      const hero = await Hero.findOne({});
      let ad50 = await Ad.findOne({});
      const addresS = await Address.findOne({});

      errors.push(errFullName);

      res.render("admin/addcategory", {
        errors,
        hero,
        addresS,
        siteLogo,
        user,
      });
    }
    validation.passes(async () => {
      try {
        let cat = await Category.findById(req.params.id);
        //console.log(cat.catCover)
        const { id } = req.params;
        var files;
        //if user adds a new image to category
        if (req.files) {
          const uploader = async (path) =>
            await cloudinary.uploads(path, "Images");
          files = [req.files];
          const tmp_file = files[0].image.tempFilePath;
          console.log(tmp_file);

          const newPath = await uploader(tmp_file);
          fs.unlinkSync(tmp_file);
          let lowerName = req.body.name;
          lowerName = lowerName.toLowerCase();

          Category.findByIdAndUpdate(
            { _id: id },
            {
              $set: {
                name: lowerName,
                catCover: newPath,
              },
            }
          ).then((catUpdate) => {
            req.flash(
              "success_msg",
              `Update Done For ${catUpdate.name} category!`
            );
            res.redirect("/admin/edit/category");
          });
        } else {
          files = cat.catCover;
          Category.findByIdAndUpdate(
            { _id: id },
            {
              $set: {
                name: req.body.name,
                catCover: files,
              },
            }
          ).then((catUpdate) => {
            req.flash(
              `success_msg','Update Done For ${catUpdate.name} category!`
            );
            res.redirect("/admin/edit/category");
          });
        }
      } catch (e) { }
    });
  }
);

// delete category
router.delete(
  "/category/delete/:id",
  ensureAuthenticated,
  adminAuth,
  semiAdminAuth,

  async (req, res) => {
    const { id } = req.params;
    Category.findByIdAndDelete({ _id: id }).then((deleted) => {
      deleted.remove();
      req.flash("success_msg", `Successfully deleted ${deleted.name}`);
      res.redirect("/admin/");
    });
  }
);

router.post(
  "/add-category",
  ensureAuthenticated,
  adminAuth,
  semiAdminAuth,

  async (req, res) => {
    let lOgo = await Logo.findOne({});
    let siteLogo = lOgo ? lOgo.url : " ";

    let user = req.user;
    if (!user) {
      req.flash("error_msg", "please re-login");
      res.redirect("/users/login");
    }
    let errors = [];
    const validation = new Validator(
      {
        name: req.body.name,
      },
      {
        name: "required",
      }
    );
    if (validation.fails()) {
      const hero = await Hero.findOne({});
      let ad50 = await Ad.findOne({});
      const addresS = await Address.findOne({});
      const pcount = await Product.countDocuments();
      const subCount = await Mail.count({});
      const cCount = await Coupon.countDocuments();
      let fiftyOffProductsCount = await Product.count({ isFiftyOff: true });
      const orderCount = await Order.countDocuments();

      const errFullName = validation.errors.get("name");
      errors.push(errFullName);

      res.render("admin/addcategory", {
        siteLogo,
        user,
        errors,
        hero,
        ad50,
        addresS,
        pcount,
        subCount,
        cCount,
        fiftyOffProductsCount,
        orderCount,
      });
    } else {
      validation.passes(async () => {
        try {
          const uploader = async (path) =>
            await cloudinary.uploads(path, "Images");

          let files = [req.files];
          file = files[0].image;
          const tmp_file = file.tempFilePath;
          //console.log(tmp_file);
          const newPath = await uploader(tmp_file);
          fs.unlinkSync(tmp_file);
          let { name } = req.body;
          name = name.toLowerCase();
          let newCategory = new Category({
            name,
            catCover: newPath,
          });
          newCategory = await newCategory.save();
          req.flash(
            "success_msg",
            `You Have Successfully Added  a new Category, ${newCategory.name}`
          );
          res.redirect("/admin/edit/category");
        } catch (e) { }
      });
    }
  }
);

router.get(
  "/products/all",
  ensureAuthenticated,
  adminAuth,
  async (req, res) => {
    req.session.currentUrl = req.originalUrl;
    let { currentUrl } = req.session

    let lOgo = await Logo.findOne({});
    let siteLogo = lOgo ? lOgo.url : " ";

    let user = req.user;
    if (!user) {
      req.flash("error_msg", "please re-login");
      res.redirect("/users/login");
    }

    let fiftyOffProductsCount = await Product.count({ isFiftyOff: true });
    const subCount = await Mail.count({});

    // //implementing pagination
    let currentPage = parseInt(req.query.page) || 1;
    let itemPerPage = 35;
    const pcount = await Product.countDocuments();

    let pages = Math.ceil(pcount / itemPerPage);

    const products = await Product.find({})
      .sort({ createdAt: -1 })
      .skip(itemPerPage * currentPage - itemPerPage)
      .limit(itemPerPage);

    const orderCount = await Order.countDocuments();
    const hero = await Hero.findOne({});
    let ad50 = await Ad.findOne({});
    const addresS = await Address.findOne({});

    // const products = await Product.find({})
    //   .populate("category")
    //   .sort({ createdAt: -1 });
    const cartCount = await Cart.countDocuments();
    const cCount = await Coupon.countDocuments();

    res.render("admin/allProducts", {
      currentUrl,
      hero,
      orderCount,
      products,
      pcount,
      cartCount,
      cCount,
      fiftyOffProductsCount,
      ad50,
      addresS,
      pages,
      currentPage,
      subCount,
      siteLogo,
      user,
    });
  }
);

//edit a product
router.get(
  "/product/:id/edit/",
  ensureAuthenticated,
  adminAuth,
  semiAdminAuth,

  async (req, res) => {
    let lOgo = await Logo.findOne({});
    let siteLogo = lOgo ? lOgo.url : " ";
    req.session.currentUrl = req.originalUrl;

    let user = req.user;
    if (!user) {
      req.flash("error_msg", "please re-login");
      res.redirect("/users/login");
    }
    const pcount = await Product.countDocuments();
    const cCount = await Coupon.countDocuments();
    const products = await Product.find({});
    const orderCount = await Order.countDocuments();
    const hero = await Hero.findOne({});
    let ad50 = await Ad.findOne({});
    const addresS = await Address.findOne({});
    const subCount = await Mail.count({});

    let fiftyOffProductsCount = await Product.count({ isFiftyOff: true });

    Category.find({})
      .sort({ createdAt: -1 })
      .then((categories) => {
        Product.findById(req.params.id).then((product) => {
          Category.findById(product.category).then((chosenCategory) => {
            res.render("admin/editProduct", {
              categories,
              product,
              chosenCategory,
              pcount,
              cCount,
              fiftyOffProductsCount,
              orderCount,
              hero,
              ad50,
              addresS,
              subCount,
              siteLogo,
              user,
            });
          });
        });
      });
  }
);

//updating a single product with no pictures
router.get(
  "/product-lte/:id/edit",
  ensureAuthenticated,
  adminAuth,
  semiAdminAuth,

  async (req, res) => {
    let lOgo = await Logo.findOne({});
    let siteLogo = lOgo ? lOgo.url : " ";
    req.session.currentUrl = req.originalUrl;

    let user = req.user;
    if (!user) {
      req.flash("error_msg", "please re-login");
      res.redirect("/users/login");
    }
    const pcount = await Product.countDocuments();
    const cCount = await Coupon.countDocuments();
    const products = await Product.find({});
    const orderCount = await Order.countDocuments();
    const hero = await Hero.findOne({});
    let ad50 = await Ad.findOne({});
    const addresS = await Address.findOne({});
    const subCount = await Mail.count({});

    let fiftyOffProductsCount = await Product.count({ isFiftyOff: true });

    Category.find({})
      .sort({ createdAt: -1 })
      .then((categories) => {
        Product.findById(req.params.id).then((product) => {
          Category.findById(product.category).then((chosenCategory) => {
            res.render("admin/editProductLte", {
              categories,
              product,
              chosenCategory,
              pcount,
              cCount,
              fiftyOffProductsCount,
              orderCount,
              hero,
              ad50,
              addresS,
              subCount,
              siteLogo,
              user,
            });
          });
        });
      });
  }
);

//posting update of product
router.post(
  "/product/:id/edit/",
  ensureAuthenticated,
  adminAuth,
  semiAdminAuth,

  async (req, res) => {
    let lOgo = await Logo.findOne({});
    let siteLogo = lOgo ? lOgo.url : " ";
    let product = await Product.findById(req.params.id);

    let user = req.user;
    if (!user) {
      req.flash("error_msg", "please re-login");
      res.redirect("/users/login");
    }
    errors = [];
    const { desc, name, rdesc, category, price, stockCount, keyFeatures } =
      req.body;

    //console.log(desc);
    const validation = new Validator(
      {
        name: req.body.name,
        description: req.body.desc,
        rDesc: req.body.rdesc,
        category: req.body.category,
        price: req.body.price,
        countInStock: req.body.stockCount,
        featured: req.body.feature,
        keyFeatures: req.body.keyFeatures,
      },
      {
        name: "string|required",
        description: "required|string",
        rDesc: "required",
        category: "required",
        price: "numeric|required",
        countInStock: "numeric|required",
        featured: "required",
        keyFeatures: "required",
      }
    );
    if (validation.fails()) {
      const hero = await Hero.findOne({});
      let ad50 = await Ad.findOne({});
      const addresS = await Address.findOne({});
      const subCount = await Mail.count({});
      const pcount = await Product.countDocuments();
      const cCount = await Coupon.countDocuments();
      let fiftyOffProductsCount = await Product.count({ isFiftyOff: true });
      const orderCount = await Order.countDocuments();

      const errName = validation.errors.get("name");
      const errDesc = validation.errors.get("description");
      const errR_Desc = validation.errors.get("rDesc");
      const errCat = validation.errors.get("category");
      const errPrc = validation.errors.get("price");
      const errCStock = validation.errors.get("countInStock");
      const errFeatured = validation.errors.get("featured");
      const errWorth = validation.errors.get("worth");
      const errKeyFeatures = validation.errors.get("keyFeatures");

      errors.push(
        errName,
        errDesc,
        errR_Desc,
        errCat,
        errPrc,
        errCStock,
        errFeatured,
        errWorth,
        errKeyFeatures
      );
      Category.find({})
        .sort({ name: 1 })
        .then((categories) => {
          Product.findById(req.params.id).then((product) => {
            Category.findById(product.category).then((chosenCategory) => {
              res.render("admin/editProduct", {
                errors,
                categories,
                product,
                chosenCategory,
                desc,
                name,
                rdesc,
                category,
                price,
                stockCount,
                ad50,
                hero,
                addresS,
                subCount,
                cCount,
                pcount,
                fiftyOffProductsCount,
                orderCount,
                siteLogo,
                user,
                keyFeatures,
              });
            });
          });
        });
    } else {
      validation.passes(async () => {
        try {
          // //an array of 4 items
          let urls = [];

          // //an instance of the cloudingary module
          const uploader = async (path) =>
            await cloudinary.uploads(path, "Images");
          // //wil be expecting 4 fies from the user,so am doing a for loop fro 0-3
          if (req.body.picGallery == "false") {
            let files = [req.files];
            files = files[0].image;

            for (var i = 0; i < 4; i++) {
              let currentFile =
                typeof files[i] == undefined ? product.image[i] : files[i];
              console.log(currentFile);
              //   // if the user does not define an index for a  specific file,I use the old picture in the db for that index
              if (typeof currentFile == "object") {
                // if the current file is a file object and nota url,I upload and assign the new url to that specific index
                let tmp_file = currentFile.tempFilePath;
                // currentFile is either url or tempfile path
                let newPath = await uploader(tmp_file);
                urls[i] = newPath;
                fs.unlinkSync(tmp_file);
              } else {
                urls[i] = currentFile;
              }
            }
          } else {
            let tmp_file = req.files.image.tempFilePath;
            newPath = await uploader(tmp_file);
            urls.push(newPath);
          }
          // //console.log(urls)

          if (req.body.dsc == "true") {
            product.name = req.body.name;
            product.description = req.body.desc;
            product.richDescription = req.body.rdesc;
            product.discount = 50;
            product.oldPrice = req.body.price;
            product.price = req.body.price - (50 / 100) * req.body.price;
            product.category = req.body.category;
            product.isFeatured = req.body.feature;
            product.countInStock = req.body.stockCount;
            product.originalCountInStock = req.body.stockCount;
            product.isFiftyOff = req.body.dsc;
            product.image = urls;
            product.picGallery = req.body.picGallery;

            product.keyFeatures = req.body.keyFeatures;
            await product.save();
            req.flash("success_msg", `Successfully Updated ${product.name}`);
            res.redirect("/admin/");
          } else {
            product.name = req.body.name;
            product.description = req.body.desc;
            product.richDescription = req.body.rdesc;
            product.discount = 0;
            product.oldPrice = req.body.price;
            product.price = req.body.price;
            product.category = req.body.category;
            product.isFeatured = req.body.feature;
            product.countInStock = req.body.stockCount;
            product.originalCountInStock = req.body.stockCount;
            product.isFiftyOff = req.body.dsc;
            product.image = urls;
            product.keyFeatures = req.body.keyFeatures;
            product.picGallery = req.body.picGallery;

            await product.save();
            req.flash("success_msg", `Successfully Updated ${product.name}`);
            res.redirect("/admin/");
          }
        } catch (e) {
          console.log(e);
        }
      });
    }
  }
);

//posting update of product(NO IMAGE UPLOAD)
router.post(
  "/product/:id/edit-lte/",
  ensureAuthenticated,
  adminAuth,
  semiAdminAuth,

  async (req, res) => {
    let lOgo = await Logo.findOne({});
    let siteLogo = lOgo ? lOgo.url : " ";
    let product = await Product.findById(req.params.id);

    let user = req.user;
    if (!user) {
      req.flash("error_msg", "please re-login");
      res.redirect("/users/login");
    }
    errors = [];
    const { desc, name, rdesc, category, price, stockCount, keyFeatures } =
      req.body;

    //console.log(desc);
    const validation = new Validator(
      {
        name: req.body.name,
        description: req.body.desc,
        rDesc: req.body.rdesc,
        category: req.body.category,
        price: req.body.price,
        countInStock: req.body.stockCount,
        featured: req.body.feature,
        keyFeatures: req.body.keyFeatures,
      },
      {
        name: "string|required",
        description: "required|string",
        rDesc: "required",
        category: "required",
        price: "numeric|required",
        countInStock: "numeric|required",
        featured: "required",
        keyFeatures: "required",
      }
    );
    if (validation.fails()) {
      const hero = await Hero.findOne({});
      let ad50 = await Ad.findOne({});
      const addresS = await Address.findOne({});
      const subCount = await Mail.count({});
      const pcount = await Product.countDocuments();
      const cCount = await Coupon.countDocuments();
      let fiftyOffProductsCount = await Product.count({ isFiftyOff: true });
      const orderCount = await Order.countDocuments();

      const errName = validation.errors.get("name");
      const errDesc = validation.errors.get("description");
      const errR_Desc = validation.errors.get("rDesc");
      const errCat = validation.errors.get("category");
      const errPrc = validation.errors.get("price");
      const errCStock = validation.errors.get("countInStock");
      const errFeatured = validation.errors.get("featured");
      const errWorth = validation.errors.get("worth");
      const errKeyFeatures = validation.errors.get("keyFeatures");

      errors.push(
        errName,
        errDesc,
        errR_Desc,
        errCat,
        errPrc,
        errCStock,
        errFeatured,
        errWorth,
        errKeyFeatures
      );
      Category.find({})
        .sort({ name: 1 })
        .then((categories) => {
          Product.findById(req.params.id).then((product) => {
            Category.findById(product.category).then((chosenCategory) => {
              res.render("admin/editProductLte", {
                errors,
                categories,
                product,
                chosenCategory,
                desc,
                name,
                rdesc,
                category,
                price,
                stockCount,
                ad50,
                hero,
                addresS,
                subCount,
                cCount,
                pcount,
                fiftyOffProductsCount,
                orderCount,
                siteLogo,
                user,
                keyFeatures,
              });
            });
          });
        });
    } else {
      validation.passes(async () => {
        try {
          // //console.log(urls)

          if (req.body.dsc == "true") {
            product.name = req.body.name;
            product.description = req.body.desc;
            product.richDescription = req.body.rdesc;
            product.discount = 50;
            product.oldPrice = req.body.price;
            product.price = req.body.price - (50 / 100) * req.body.price;
            product.category = req.body.category;
            product.isFeatured = req.body.feature;
            product.countInStock = req.body.stockCount;
            product.originalCountInStock = req.body.stockCount;
            product.isFiftyOff = req.body.dsc;

            product.picGallery = req.body.picGallery;

            product.keyFeatures = req.body.keyFeatures;
            await product.save();
            req.flash("success_msg", `Successfully Updated ${product.name}`);
            res.redirect("/admin/");
          } else {
            product.name = req.body.name;
            product.description = req.body.desc;
            product.richDescription = req.body.rdesc;
            product.discount = 0;
            product.oldPrice = req.body.price;
            product.price = req.body.price;
            product.category = req.body.category;
            product.isFeatured = req.body.feature;
            product.countInStock = req.body.stockCount;
            product.originalCountInStock = req.body.stockCount;
            product.isFiftyOff = req.body.dsc;

            product.keyFeatures = req.body.keyFeatures;
            product.picGallery = req.body.picGallery;

            await product.save();
            req.flash("success_msg", `Successfully Updated ${product.name}`);
            res.redirect("/admin/");
          }
        } catch (e) {
          console.log(e);
        }
      });
    }
  }
);

router.delete(
  "/product/:id/edit/",
  ensureAuthenticated,
  adminAuth,
  semiAdminAuth,

  async (req, res) => {
    Product.findByIdAndDelete({ _id: req.params.id }).then((product) => {
      product.remove();
      req.flash("success_msg", "Product successfully deleted!");
      res.redirect("/admin/products/all");
    });
  }
);

router.get(
  "/donko-products",
  ensureAuthenticated,
  adminAuth,
  async (req, res) => {
    req.session.currentUrl = req.originalUrl;

    let lOgo = await Logo.findOne({});
    let siteLogo = lOgo ? lOgo.url : " ";

    let user = req.user;
    if (!user) {
      req.flash("error_msg", "please re-login");
      res.redirect("/users/login");
    }
    const cCount = await coupon.countDocuments();
    const pcount = await Product.countDocuments();
    const orderCount = await Order.countDocuments();
    const hero = await Hero.findOne({});
    let ad50 = await Ad.findOne({});
    const addresS = await Address.findOne({});
    const subCount = await Mail.count({});

    //implementing pagination
    let currentPage = parseInt(req.query.page) || 1;
    let itemPerPage = 35;

    let pages = Math.ceil(pcount / itemPerPage);

    const products = await Product.find({ isFiftyOff: true })
      .skip(itemPerPage * currentPage - itemPerPage)
      .limit(itemPerPage);

    let fiftyOffProductsCount = await Product.count({ isFiftyOff: true });

    res.render("admin/donko", {
      cCount,
      pcount,
      products,
      fiftyOffProductsCount,
      orderCount,
      hero,
      ad50,
      addresS,
      currentPage,
      pages,
      subCount,
      siteLogo,
      user,
    });
  }
);

//handling orders
router.get("/orders", ensureAuthenticated, adminAuth, 
supaAdminAuth,

async (req, res) => {
  
  let lOgo = await Logo.findOne({});
  let siteLogo = lOgo ? lOgo.url : " ";
  req.session.currentUrl = req.originalUrl;

  let user = req.user;
  if (!user) {
    req.flash("error_msg", "please re-login");
    res.redirect("/users/login");
  }
  let currentPage = parseInt(req.query.page) || 1;
  let itemPerPage = 35;
  const orderCount = await Order.countDocuments();
  let pages = Math.ceil(orderCount / itemPerPage);
  const hero = await Hero.findOne({});
  let ad50 = await Ad.findOne({});
  const addresS = await Address.findOne({});
  const subCount = await Mail.count({});

  const cCount = await coupon.countDocuments();
  const pcount = await Product.countDocuments();
  const fiftyOffProductsCount = await Product.count({
    isFiftyOff: true,
  });
  let orderQueryRes;
  let orders = await Order.find({})
    .populate("user")

    .skip(itemPerPage * currentPage - itemPerPage)
    .limit(itemPerPage)
    .sort({ updatedAt: -1 })
    .exec(function (err, docs) {
      orderQueryRes = docs;

    });

  let DeliveredOrders = await Order.count({ Delivered: true });
  let DeliveredOrdersPct = (DeliveredOrders / orderCount) * 100;

  let notDeliveredOrders = await Order.count({ Delivered: false });
  let notDeliveredOrdersPct = (notDeliveredOrders / orderCount) * 100;
  //to 2dp
  notDeliveredOrdersPct = notDeliveredOrdersPct.toFixed(2);
  DeliveredOrdersPct = DeliveredOrdersPct.toFixed(2);

  res.render("admin/orders", {
    hero,
    ad50,
    currentPage,
    pages,
    DeliveredOrdersPct,
    DeliveredOrders,
    notDeliveredOrders,
    notDeliveredOrdersPct,
    orderQueryRes,
    cCount,
    pcount,
    orderCount,
    fiftyOffProductsCount,
    addresS,
    subCount,
    siteLogo,
    user,
  });

});

//single order
router.get(
  "/order-info/:id",
  ensureAuthenticated,
  adminAuth,
  supaAdminAuth,

  async (req, res) => {
    let lOgo = await Logo.findOne({});
    let siteLogo = lOgo ? lOgo.url : " ";
    req.session.currentUrl = req.originalUrl;

    let user = req.user;
    if (!user) {
      req.flash("error_msg", "please re-login");
      res.redirect("/users/login");
    }
    const cCount = await coupon.countDocuments();
    const pcount = await Product.countDocuments();
    const subCount = await Mail.count({});

    const site = await Hero.findOne({});
    const fiftyOffProductsCount = await Product.count({
      isFiftyOff: true,
    });
    const orderCount = await Order.countDocuments();
    const hero = await Hero.findOne({});
    let ad50 = await Ad.findOne({});
    const addresS = await Address.findOne({});

    const order = await Order.findById(req.params.id).populate("user");
    res.render("admin/order-single", {
      ad50,
      order,
      cCount,
      pcount,
      orderCount,
      fiftyOffProductsCount,
      hero,
      addresS,
      subCount,
      site,
      siteLogo,
      user,
    });
  }
);

//printing invoice
router.get(
  "/order-info-print/:id",
  ensureAuthenticated,
  adminAuth,
  supaAdminAuth,

  async (req, res) => {
    let lOgo = await Logo.findOne({});
    let siteLogo = lOgo ? lOgo.url : " ";
    req.session.currentUrl = req.originalUrl;

    let user = req.user;
    if (!user) {
      req.flash("error_msg", "please re-login");
      res.redirect("/users/login");
    }
    const hero = await Hero.findOne({});
    let ad50 = await Ad.findOne({});
    const addresS = await Address.findOne({});
    const site = await Hero.findOne({});
    const subCount = await Mail.count({});

    const fiftyOffProductsCount = await Product.count({
      isFiftyOff: true,
    });

    const order = await Order.findById(req.params.id).populate("user");
    res.render("admin/order-print", {
      site,
      order,
      hero,
      ad50,
      addresS,
      fiftyOffProductsCount,
      subCount,
      siteLogo,
      user,
    });
  }
);

router.get("/hero", ensureAuthenticated, adminAuth,
supaAdminAuth,

async (req, res) => {
  let lOgo = await Logo.findOne({});
  let siteLogo = lOgo ? lOgo.url : " ";
  req.session.currentUrl = req.originalUrl;

  let user = req.user;
  if (!user) {
    req.flash("error_msg", "please re-login");
    res.redirect("/users/login");
  }
  const addresS = await Address.findOne({});

  const cCount = await coupon.countDocuments();
  const pcount = await Product.countDocuments();
  const orderCount = await Order.countDocuments();
  const subCount = await Mail.count({});

  const fiftyOffProductsCount = await Product.count({
    isFiftyOff: true,
  });
  const hero = await Hero.findOne({});
  let ad50 = await Ad.findOne({});

  res.render("admin/hero", {
    hero,
    cCount,
    pcount,
    orderCount,
    fiftyOffProductsCount,
    ad50,
    addresS,
    subCount,
    siteLogo,
    user,
  });
});

router.post("/hero", ensureAuthenticated, adminAuth, 
supaAdminAuth,
async (req, res) => {
  let lOgo = await Logo.findOne({});
  let siteLogo = lOgo ? lOgo.url : " ";

  let user = req.user;
  if (!user) {
    req.flash("error_msg", "please re-login");
    res.redirect("/users/login");
  }
  //  console.log(" siteDesription "+req.body.siteDesription)
  let errors = [];
  const { name, siteRichDescDesription, siteDesription, title } = req.body;
  const subCount = await Mail.count({});

  const validation = new Validator(
    {
      title: req.body.title,
      name: req.body.name,
      siteDesription: req.body.siteDesription,
      siteRichDescDesription: req.body.siteRichDescDesription,
    },
    {
      title: "required",
      name: "required",
      siteDesription: "required",
      siteRichDescDesription: "required",
    }
  );
  if (validation.fails()) {
    const cCount = await coupon.countDocuments();
    const pcount = await Product.countDocuments();
    const orderCount = await Order.countDocuments();
    const fiftyOffProductsCount = await Product.find({
      isFiftyOff: true,
    });
    const hero = await Hero.findOne({});
    let ad50 = await Ad.findOne({});
    const addresS = await Address.findOne({});

    const errTitle = validation.errors.get("title");
    const errSDesc = validation.errors.get("siteDesription");
    const errRDesc = validation.errors.get("siteRichDescDesription");
    const errName = validation.errors.get("name");

    errors.push(errTitle, errSDesc, errRDesc, errName);

    res.render("admin/hero", {
      ad50,
      errors,
      name,
      title,
      siteDesription,
      siteRichDescDesription,
      cCount,
      pcount,
      orderCount,
      fiftyOffProductsCount,
      hero,
      addresS,
      subCount,
      siteLogo,
      user,
    });
  } else {
    validation.passes(async () => {
      try {
        const uploader = async (path) =>
          await cloudinary.uploads(path, "Images");

        let files = [req.files];
        file = files[0].image;
        const tmp_file = file.tempFilePath;
        //console.log(tmp_file);
        const newPath = await uploader(tmp_file);
        fs.unlinkSync(tmp_file);
        let findIfPageExist = await Hero.count({});
        if (findIfPageExist >= 1) {
          req.flash(
            "error_msg",
            "Homepage is already built,you may have to edit the existing one or delete it to proceed..."
          );
          res.redirect(req.headers.referer);
        } else {
          const { name, siteRichDescDesription, siteDesription, title } =
            req.body;

          let hero = new Hero({
            title,
            sDesc: siteDesription,
            sRDesc: siteRichDescDesription,
            image: newPath,
            name,
          });
          hero = await hero.save();
          req.flash("success_msg", "Successfully Guilt HomePage");
          res.redirect("/admin/");
        }
      } catch (e) {
        console.log(e.message);
      }
    });
  }
});

//editing homePage
router.get("/hero-edit", ensureAuthenticated, adminAuth,
supaAdminAuth,
async (req, res) => {
  try {
    req.session.currentUrl = req.originalUrl;

    let lOgo = await Logo.findOne({});
    let siteLogo = lOgo ? lOgo.url : " ";

    let user = req.user;
    if (!user) {
      req.flash("error_msg", "please re-login");
      res.redirect("/users/login");
    }
    const cCount = await coupon.countDocuments();
    const pcount = await Product.countDocuments();
    const orderCount = await Order.countDocuments();
    const subCount = await Mail.count({});

    const fiftyOffProductsCount = await Product.find({
      isFiftyOff: true,
    });
    let hero = await Hero.findOne({});
    let ad50 = await Ad.findOne({});
    const addresS = await Address.findOne({});

    res.render("admin/hero-edit", {
      ad50,
      hero,
      cCount,
      pcount,
      orderCount,
      fiftyOffProductsCount,
      addresS,
      subCount,
      siteLogo,
      user,
    });
  } catch (e) { }
});

router.post(
  "/hero-edit/:id",
  ensureAuthenticated,
  adminAuth,
  supaAdminAuth,

  async (req, res) => {
    try {
      let lOgo = await Logo.findOne({});
      let siteLogo = lOgo ? lOgo.url : " ";

      let user = req.user;
      if (!user) {
        req.flash("error_msg", "please re-login");
        res.redirect("/users/login");
      }
      let errors = [];
      const { name, siteRichDescDesription, siteDesription, title } = req.body;

      const validation = new Validator(
        {
          title: req.body.title,
          name: req.body.name,
          siteDesription: req.body.siteDesription,
          siteRichDescDesription: req.body.siteRichDescDesription,
        },
        {
          title: "required",
          name: "required",
          siteDesription: "required",
          siteRichDescDesription: "required",
        }
      );
      if (validation.fails()) {
        const cCount = await coupon.countDocuments();
        const pcount = await Product.countDocuments();
        const orderCount = await Order.countDocuments();
        const fiftyOffProductsCount = await Product.find({
          isFiftyOff: true,
        });
        const hero = await Hero.findOne({});
        let ad50 = await Ad.findOne({});
        const addresS = await Address.findOne({});

        const errTitle = validation.errors.get("title");
        const errName = validation.errors.get("name");

        const errSDesc = validation.errors.get("siteDesription");
        const errRDesc = validation.errors.get("siteRichDescDesription");

        errors.push(errName, errTitle, errSDesc, errRDesc);

        res.render("admin/hero", {
          ad50,
          errors,
          title,
          siteDesription,
          siteRichDescDesription,
          cCount,
          pcount,
          orderCount,
          fiftyOffProductsCount,
          hero,
          siteLogo,
          user,
          addresS,
        });
      } else {
        validation.passes(async () => {
          try {
            let homePage = await Hero.findOne({ _id: req.params.id });
            homePage.title = req.body.title;
            homePage.name = req.body.name;

            homePage.sDesc = req.body.siteDesription;
            homePage.sRDesc = req.body.siteRichDescDesription;
            const uploader = async (path) =>
              await cloudinary.uploads(path, "Images");

            let files = [req.files];
            file = files[0].image;
            const tmp_file = file.tempFilePath;
            //console.log(tmp_file);
            const newPath = await uploader(tmp_file);
            fs.unlinkSync(tmp_file);

            homePage.image = newPath;

            homePage = await homePage.save();
            res.redirect("/admin/");
          } catch (e) { }
        });
      }
    } catch (e) { }
  }
);

router.delete(
  "/delete-hero/:id",
  ensureAuthenticated,
  adminAuth,
  supaAdminAuth,

  async (req, res) => {
    try {
      let hero = await Hero.deleteOne({ _id: req.params.id });
      req.flash("success_msg", `successfully deleted homepagebulder`);
      res.redirect("/admin");
    } catch (e) { }
  }
);

router.get("/post-ad", ensureAuthenticated,adminAuth, supaAdminAuth,
async (req, res) => {
  req.session.currentUrl = req.originalUrl;

  let lOgo = await Logo.findOne({});
  let siteLogo = lOgo ? lOgo.url : " ";

  let user = req.user;
  if (!user) {
    req.flash("error_msg", "please re-login");
    res.redirect("/users/login");
  }
  const cCount = await coupon.countDocuments();
  const pcount = await Product.countDocuments();
  const orderCount = await Order.countDocuments();
  const subCount = await Mail.count({});

  const fiftyOffProductsCount = await Product.count({
    isFiftyOff: true,
  });
  const hero = await Hero.findOne({});
  const ad50 = await Ad.findOne({});
  const addresS = await Address.findOne({});

  res.render("admin/post-add", {
    ad50,
    hero,
    cCount,
    pcount,
    orderCount,
    fiftyOffProductsCount,
    addresS,
    subCount,
    siteLogo,
    user,
  });
});

router.post("/post-ad", ensureAuthenticated, adminAuth,   supaAdminAuth,
async (req, res) => {
  let lOgo = await Logo.findOne({});
  let siteLogo = lOgo ? lOgo.url : " ";

  let user = req.user;
  if (!user) {
    req.flash("error_msg", "please re-login");
    res.redirect("/users/login");
  }
  const { adDesription, title } = req.body;
  let errors = [];
  const validation = new Validator(
    {
      title: title,
      adDescription: adDesription,
    },
    {
      title: "required",
      adDescription: "required",
    }
  );
  if (validation.fails()) {
    const cCount = await coupon.countDocuments();
    const pcount = await Product.countDocuments();
    const orderCount = await Order.countDocuments();
    const fiftyOffProductsCount = await Product.find({
      isFiftyOff: true,
    });
    const hero = await Hero.findOne({});
    const ad50 = await Ad.findOne({});
    const addresS = await Address.findOne({});
    const subCount = await Mail.count({});

    const errTitle = validation.errors.get("title");
    const erradDescription = validation.errors.get("adDescription");
    errors.push(errTitle, erradDescription);
    res.render("admin/post-add", {
      ad50,
      errors,
      adDesription,
      title,
      hero,
      cCount,
      pcount,
      orderCount,
      fiftyOffProductsCount,
      addresS,
      subCount,
      siteLogo,
      user,
    });
  } else {
    validation.passes(async () => {
      const { adDesription, title } = req.body;

      const uploader = async (path) => await cloudinary.uploads(path, "Images");

      let files = [req.files];
      file = files[0].image;
      const tmp_file = file.tempFilePath;

      const newPath = await uploader(tmp_file);
      fs.unlinkSync(tmp_file);

      let findIfPageExist = await Ad.count({});
      if (findIfPageExist >= 1) {
        req.flash(
          "error_msg",
          "There is an ad on the site,you may have to edit the existing one or delete it to proceed..."
        );
        res.redirect(req.headers.referer);
      } else {
        let newAd = new Ad({
          adTitle: title,
          adDescription: req.body.adDesription,
          user: user._id,
          adImg: newPath,
        });
        newAd = await newAd.save();
        req.flash("success_msg", "Successfully Added An Ad To Homepage!");
        res.redirect("/admin/");
      }
    });
  }
});

router.get("/edit-ad", ensureAuthenticated, adminAuth,
supaAdminAuth,

async (req, res) => {
  let lOgo = await Logo.findOne({});
  let siteLogo = lOgo ? lOgo.url : " ";
  req.session.currentUrl = req.originalUrl;

  let user = req.user;
  if (!user) {
    req.flash("error_msg", "please re-login");
    res.redirect("/users/login");
  }
  const cCount = await coupon.countDocuments();
  const pcount = await Product.countDocuments();
  const orderCount = await Order.countDocuments();
  const subCount = await Mail.count({});

  const fiftyOffProductsCount = await Product.count({
    isFiftyOff: true,
  });
  let hero = await Hero.findOne({});
  let ad50 = await Ad.findOne({});
  const addresS = await Address.findOne({});

  const ad = await Ad.findOne({});

  res.render("admin/edit-ad", {
    ad,
    ad50,
    hero,
    cCount,
    pcount,
    orderCount,
    fiftyOffProductsCount,
    addresS,
    subCount,
    siteLogo,
    user,
  });
});

router.post(
  "/edit-ad/:id",
  ensureAuthenticated,
  adminAuth,
  supaAdminAuth,

  async (req, res) => {
    let lOgo = await Logo.findOne({});
    let siteLogo = lOgo ? lOgo.url : " ";

    let user = req.user;
    if (!user) {
      req.flash("error_msg", "please re-login");
      res.redirect("/users/login");
    }
    const { adDesription, title } = req.body;
    let errors = [];
    const validation = new Validator(
      {
        title: title,
        adDescription: adDesription,
      },
      {
        title: "required",
        adDescription: "required",
      }
    );
    if (validation.fails()) {
      const cCount = await coupon.countDocuments();
      const pcount = await Product.countDocuments();
      const orderCount = await Order.countDocuments();
      const fiftyOffProductsCount = await Product.find({
        isFiftyOff: true,
      });
      const subCount = await Mail.count({});

      const hero = await Hero.findOne({});
      const ad50 = await Ad.findOne({});
      const addresS = await Address.findOne({});

      const errTitle = validation.errors.get("title");
      const erradDescription = validation.errors.get("adDescription");
      errors.push(errTitle, erradDescription);
      res.render("admin/post-add", {
        ad50,
        errors,
        adDesription,
        title,
        hero,
        cCount,
        pcount,
        orderCount,
        fiftyOffProductsCount,
        addresS,
        siteLogo,
        user,
        subCount,
      });
    } else {
      let ad = await Ad.findOne({ _id: req.params.id });
      ad.adTitle = req.body.title;
      // console.log(req.body.adDesription)

      ad.adDescription = req.body.adDesription;
      ad.user = req.user._id;
      const uploader = async (path) => await cloudinary.uploads(path, "Images");

      let files = [req.files];
      file = files[0].image;
      const tmp_file = file.tempFilePath;
      //console.log(tmp_file);
      const newPath = await uploader(tmp_file);
      fs.unlinkSync(tmp_file);

      ad.adImg = newPath;
      ad = await ad.save();
      req.flash("success_msg", "Succesfuly updated Ad");
      res.redirect("/admin/");
    }
  }
);

router.delete(
  "/delete-ad/:id",
  ensureAuthenticated,
  adminAuth,
  supaAdminAuth,

  async (req, res) => {
    await Ad.findByIdAndDelete({ _id: req.params.id });
    req.flash("success_msg", "Cover Info Successfully Delted!");
    res.redirect("/admin/");
    // res.send("hi!")
  }
);

router.get("/add-address", ensureAuthenticated, adminAuth, 
supaAdminAuth,

async (req, res) => {
  let lOgo = await Logo.findOne({});
  let siteLogo = lOgo ? lOgo.url : " ";
  req.session.currentUrl = req.originalUrl;

  let user = req.user;
  if (!user) {
    req.flash("error_msg", "please re-login");
    res.redirect("/users/login");
  }
  const cCount = await coupon.countDocuments();
  const subCount = await Mail.count({});

  const pcount = await Product.countDocuments();
  const orderCount = await Order.countDocuments();
  const fiftyOffProductsCount = await Product.count({
    isFiftyOff: true,
  });
  const hero = await Hero.findOne({});
  const ad50 = await Ad.findOne({});
  const addresS = await Address.findOne({});

  res.render("admin/add-address", {
    ad50,
    hero,
    cCount,
    pcount,
    orderCount,
    fiftyOffProductsCount,
    addresS,
    subCount,
    siteLogo,
    user,
  });
});

router.post(
  "/add-address",
  ensureAuthenticated,
  adminAuth,
  supaAdminAuth,

  async (req, res) => {
    let lOgo = await Logo.findOne({});
    let siteLogo = lOgo ? lOgo.url : " ";

    let user = req.user;
    if (!user) {
      req.flash("error_msg", "please re-login");
      res.redirect("/users/login");
    }
    const { phoneNumber, region, address, email, city } = req.body;
    let errors = [];
    const validation = new Validator(
      {
        phoneNumber: phoneNumber,
        region: region,
        address: address,
        email: email,
        city: city,
      },
      {
        address: "required",
        region: "required",
        email: "required",
        city: "required",
        phoneNumber: "required",
      }
    );
    if (validation.fails()) {
      const cCount = await coupon.countDocuments();
      const pcount = await Product.countDocuments();
      const orderCount = await Order.countDocuments();
      const fiftyOffProductsCount = await Product.find({
        isFiftyOff: true,
      });
      const hero = await Hero.findOne({});
      const ad50 = await Ad.findOne({});
      const addresS = await Address.findOne({});

      const errAddress = validation.errors.get("address");
      const errRegion = validation.errors.get("region");
      const errEmail = validation.errors.get("email");
      const errCity = validation.errors.get("city");
      const errPhone = validation.errors.get("phoneNumber");
      errors.push(errAddress, errCity, errEmail, errRegion, errPhone);

      res.render("admin/add-address", {
        errors,
        phoneNumber,
        region,
        address,
        email,
        city,
        ad50,
        hero,
        cCount,
        pcount,
        orderCount,
        fiftyOffProductsCount,
        addresS,
        siteLogo,
        user,
      });
    } else {
      validation.passes(async () => {
        const checkAddressExist = await Address.count({});
        if (checkAddressExist >= 1) {
          req.flash(
            "error_msg",
            "Address already exists,you may want to delete or edit an existing address to proceed..."
          );
          res.redirect(req.headers.referer);
        }
        let newAddress = new Address({
          phoneNumber,
          region,
          address,
          email,
          city,
        });
        newAddress = await newAddress.save();
        req.flash("success_msg", "Address Added Successfully...");
        res.redirect("/admin/");
      });
    }
  }
);

router.get(
  "/edit-address",
  ensureAuthenticated,
  adminAuth,
  supaAdminAuth,

  async (req, res) => {
    let lOgo = await Logo.findOne({});
    let siteLogo = lOgo ? lOgo.url : " ";
    req.session.currentUrl = req.originalUrl;

    let user = req.user;
    if (!user) {
      req.flash("error_msg", "please re-login");
      res.redirect("/users/login");
    }
    const cCount = await coupon.countDocuments();
    const pcount = await Product.countDocuments();
    const orderCount = await Order.countDocuments();
    const subCount = await Mail.count({});

    const fiftyOffProductsCount = await Product.count({
      isFiftyOff: true,
    });
    let ad = await Address.findOne({});
    let hero = await Hero.findOne({});
    let ad50 = await Ad.findOne({});
    const addresS = await Address.findOne({});

    res.render("admin/edit-address", {
      ad50,
      hero,
      cCount,
      pcount,
      orderCount,
      fiftyOffProductsCount,
      ad,
      addresS,
      subCount,
      siteLogo,
      user,
    });
  }
);

router.post(
  "/edit-address",
  ensureAuthenticated,
  adminAuth,
  supaAdminAuth,

  async (req, res) => {
    let lOgo = await Logo.findOne({});
    let siteLogo = lOgo ? lOgo.url : " ";

    let user = req.user;
    if (!user) {
      req.flash("error_msg", "please re-login");
      res.redirect("/users/login");
    }
    const { phoneNumber, region, address, email, city } = req.body;
    let errors = [];
    const validation = new Validator(
      {
        phoneNumber: phoneNumber,
        region: region,
        address: address,
        email: email,
        city: city,
      },
      {
        address: "required",
        region: "required",
        email: "required",
        city: "required",
        phoneNumber: "required",
      }
    );
    if (validation.fails()) {
      const cCount = await coupon.countDocuments();
      const pcount = await Product.countDocuments();
      const orderCount = await Order.countDocuments();
      const fiftyOffProductsCount = await Product.find({
        isFiftyOff: true,
      });
      const hero = await Hero.findOne({});
      const ad50 = await Ad.findOne({});
      const addresS = await Address.findOne({});

      const errAddress = validation.errors.get("address");
      const errRegion = validation.errors.get("region");
      const errEmail = validation.errors.get("email");
      const errCity = validation.errors.get("city");
      const errPhone = validation.errors.get("phoneNumber");
      errors.push(errAddress, errCity, errEmail, errRegion, errPhone);

      res.render("admin/add-address", {
        errors,
        phoneNumber,
        region,
        address,
        email,
        city,
        ad50,
        hero,
        cCount,
        pcount,
        orderCount,
        fiftyOffProductsCount,
        addresS,
        siteLogo,
        user,
      });
    } else {
      validation.passes(async () => {
        let address = await Address.findOne({});
        address.email = email;
        address.phoneNumber = phoneNumber;
        address.region = region;
        address.address = req.body.address;
        address.city = req.body.city;
        address = await address.save();
        req.flash("success_msg", "Successfully updated site's address");
        res.redirect("/admin/");
      });
    }
  }
);
router.delete(
  "/delete-address/:id",
  ensureAuthenticated,
  adminAuth,
  supaAdminAuth,

  async (req, res) => {
    await Address.findByIdAndDelete({ _id: req.params.id });
    req.flash("success_msg", "Delete Address...");
    res.redirect("/admin/");
  }
);

router.get("/stocks", ensureAuthenticated, adminAuth,  semiAdminAuth,

async (req, res) => {
  req.session.currentUrl = req.originalUrl;

  let lOgo = await Logo.findOne({});
  let siteLogo = lOgo ? lOgo.url : " ";

  let user = req.user;
  if (!user) {
    req.flash("error_msg", "please re-login");
    res.redirect("/users/login");
  }
  const cCount = await coupon.countDocuments();
  const orderCount = await Order.count();
  const subCount = await Mail.count({});

  const fiftyOffProductsCount = await Product.count({
    isFiftyOff: true,
  });
  let ad = await Address.findOne({});
  let hero = await Hero.findOne({});
  let ad50 = await Ad.findOne({});
  const addresS = await Address.findOne({});

  let currentPage = parseInt(req.query.page) || 1;
  let itemPerPage = 35;
  const pcount = await Product.countDocuments();

  let pages = Math.ceil(pcount / itemPerPage);

  const products = await Product.find({})
    .skip(itemPerPage * currentPage - itemPerPage)
    .limit(itemPerPage);

  res.render("admin/stocks", {
    ad50,
    hero,
    cCount,
    pcount,
    orderCount,
    fiftyOffProductsCount,
    ad,
    addresS,
    products,
    pages,
    subCount,
    siteLogo,
    user,
    currentPage,
  });
});

router.get("/subscribers", ensureAuthenticated, adminAuth,
supaAdminAuth, async (req, res) => {
  let lOgo = await Logo.findOne({});
  let siteLogo = lOgo ? lOgo.url : " ";
  req.session.currentUrl = req.originalUrl;

  let user = req.user;
  if (!user) {
    req.flash("error_msg", "please re-login");
    res.redirect("/users/login");
  }
  const subCount = await Mail.count({});
  const cCount = await coupon.countDocuments();
  const pcount = await Product.countDocuments();
  const orderCount = await Order.countDocuments();
  const addresS = await Address.findOne({});
  let fiftyOffProductsCount = await Product.count({ isFiftyOff: true });

  let ad = await Address.findOne({});
  let hero = await Hero.findOne({});
  let ad50 = await Ad.findOne({});

  //implementing pagination
  let currentPage = parseInt(req.query.page) || 1;
  let itemPerPage = 35;

  let pages = Math.ceil(subCount / itemPerPage);

  const subs = await Mail.find({})
    .skip(itemPerPage * currentPage - itemPerPage)
    .limit(itemPerPage);

  res.render("admin/subscribers", {
    subCount,
    hero,
    cCount,
    pcount,
    orderCount,
    ad50,
    subCount,
    ad,
    addresS,
    subs,
    pages,
    currentPage,

    fiftyOffProductsCount,
    siteLogo,
    user,
  });
});

module.exports = router;
