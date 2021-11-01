require("dotenv").config();
const express = require("express");
const router = express.Router();
const Validator = require("validatorjs");
const { Category } = require("../../models/category");
const Product = require("../../models/product");
const Cart = require("../../models/cart");
const Coupons = require("../../models/coupon");
const moment = require("moment");
const nodemailer = require("nodemailer");
const User = require("../../models/user");
const util = require("util");
const Order = require("../../models/order");
const Hero = require("../../models/hero");
const Ad = require("../../models/post-ad");
const Address = require("../../models/add-address");
const Mail = require("../../models/mail-list");
const { ensureAuthenticated, ensureGuest } = require("../../config/auth");
const product = require("../../models/product");
const request = require("request");
const { initializePayment, verifyPayment } = require("../../config/paystack")(
  request
);
const sgMail = require("@sendgrid/mail");
sendGridApiKey = process.env.SENDGRID_API_KEY;

PUBLIC_KEY = process.env.PUBLIC_KEY;
SECRET_KEY = process.env.SECRET_KEY;

router.get("/logout", (req, res) => {
  req.logOut();
  req.flash("success_msg", "You Have Successfully Logged Out");
  res.redirect("/users/login");
});

//success-checkout view
router.get("/success-checkout", ensureAuthenticated, async (req, res) => {
  try {
    let userId, userFav, isAdmin;
    if (req.isAuthenticated()) {
      userId = req.user._id;
      userFav = await User.findOne({ _id: userId });
      userFav = userFav ? userFav.fav.length : "";

      isAdmin = req.user.isAdmin;
    } else {
      isAdmin = false;
    }

    let cartCount;
    const userItemCart = await Cart.find({ user: userId });
    let ad = await Ad.findOne({}).populate("user");
    let hero = await Hero.findOne({});
    let address = await Address.findOne({});

    if (typeof userFav == "undefined") {
      userFav = 0;
    }

    //if user has an item in cart,will try and get the cart's total qty
    if (userItemCart[0]) {
      cartCount = userItemCart[0].totalQty;
    } else {
      //else cart count will be 0
      cartCount = 0;
    }
    res.render("home/successCheckout", {
      userFav,
      address,
      hero,
      ad,
      cartCount,
      LoggedIn: req.isAuthenticated(),
      isAdmin,
    });
  } catch (e) {
    console.log(e);
  }
});

router.post("/favourites/:id", ensureAuthenticated, async (req, res) => {
  let userId;
  if (req.isAuthenticated()) {
    userId = req.user._id;
  }
  //res.send("YOH")
  var product = await Product.findOne({ _id: req.params.id });
  let user = await User.findOne({ _id: userId });
  if (user.fav.includes(product._id)) {
    req.flash(
      "success_msg",
      `${product.name} is already part of your favourites`
    );
    res.redirect(req.headers.referer);
  } else {
    user.fav.push(product._id);
    user = await user.save();
    req.flash("success_msg", `${product.name} is now part of your favourites`);
    res.redirect(req.headers.referer);
  }
});

router.post("/remove-favourites/:id", ensureAuthenticated, async (req, res) => {
  let userId;
  if (req.isAuthenticated()) {
    userId = req.user._id;
  }

  let product = await Product.findOne({ _id: req.params.id });
  let user = await User.findOne({ _id: userId });
  let indexOfProduct = user.fav.indexOf(product._id);
  let userFavArray = user.fav;
  userFavArray.splice(indexOfProduct, 1); //remove only one item from the favourites array
  user = await user.save();
  req.flash(
    "success_msg",
    `${product.name} is now removed from your favourites`
  );
  res.redirect(req.headers.referer);
});

router.get("/favourites", ensureAuthenticated, async (req, res) => {
  req.session.currentUrl = req.originalUrl;

  let userId;
  let userFav, isAdmin;
  if (req.isAuthenticated()) {
    userId = req.user._id;
    let products = await User.findOne({ _id: userId }).populate("fav");
    userFav = products.fav.length;
    isAdmin = req.user.isAdmin;
  } else {
    isAdmin = false;
  }

  if (typeof userFav == "undefined") {
    userFav = 0;
  }
  //console.log(userFav)
  let cartCount;
  let page = parseInt(req.query.page) || 1;
  let itemPerPage = 3;
  let skip = itemPerPage * page - itemPerPage;

  //I need the length of the whole favorites before applying filters(for pagination)
  let products = await User.findOne({ _id: userId }).populate("fav");

  products = await User.findOne({ _id: userId }).populate({
    path: "fav",
    // options: { sort: { createdAt: -1 }, skip: skip, limit: itemPerPage },
  });
  let totalOfFavList = [];
  let totalOfFav;
  console.log(products);
  for (let product of products.fav) {
    totalOfFavList.push(product.price);
  }
  if (userFav > 0) {
    totalOfFav = totalOfFavList.reduce((initial, next) => initial + next);
  }
  // console.log(`totalOfFavList ${totalOfFavList} totalOfFav ${totalOfFav} `);

  let ad = await Ad.findOne({}).populate("user");
  let hero = await Hero.findOne({});
  let address = await Address.findOne({});

  const userItemCart = await Cart.find({ user: userId });
  //if user has an item in cart,will try and get the cart's total qty
  if (userItemCart[0]) {
    cartCount = userItemCart[0].totalQty;
  } else {
    //else cart count will be 0
    cartCount = 0;
  }

  //querying categories in ascending order
  const categories = await Category.find({}).sort({ name: 1 }).limit(20);

  var catCountArr = [];
  var proudctForCategoryCount;

  for (let category of categories) {
    proudctForCategoryCount = await Product.countDocuments({
      category: category._id,
    });
    categoryName = category.name;
    catCountArr.push(proudctForCategoryCount);
  }

  res.render("home/fav", {
    pages: Math.ceil(userFav / itemPerPage),
    address,
    hero,
    ad,
    currentPage: page,
    cartCount,
    products,
    categories,
    catCountArr,
    category: typeof category !== "undefined" ? category : "",
    userFav,
    LoggedIn: req.isAuthenticated(),
    isAdmin,
    totalOfFav,
  });
});

router.get("/about", async (req, res) => {
  let userId, userFav, isAdmin;
  req.session.currentUrl = req.originalUrl;

  if (req.isAuthenticated()) {
    userId = req.user._id;
    userFav = await User.findOne({ _id: userId });
    userFav = userFav ? userFav.fav.length : "";

    isAdmin = req.user.isAdmin;
  } else {
    isAdmin = false;
  }

  const userItemCart = await Cart.find({ user: userId });

  if (typeof userFav == "undefined") {
    userFav = 0;
  }
  let ad = await Ad.findOne({}).populate("user");

  if (userItemCart[0]) {
    cartCount = userItemCart[0].totalQty;
  } else {
    cartCount = 0;
  }

  let hero = await Hero.findOne({});
  let address = await Address.findOne({});

  res.render("home/about", {
    isAdmin,
    ad,
    userFav,
    hero,
    address,
    cartCount,
    LoggedIn: req.isAuthenticated(),
  });
});

router.get("/contact", async (req, res) => {
  req.session.currentUrl = req.originalUrl;

  let userId, userFav, isAdmin;
  if (req.isAuthenticated()) {
    userId = req.user._id;
    userFav = await User.findOne({ _id: userId });
    userFav = userFav ? userFav.fav.length : "";

    isAdmin = req.user.isAdmin;
  } else {
    isAdmin = false;
  }

  const userItemCart = await Cart.find({ user: userId });

  if (typeof userFav == "undefined") {
    userFav = 0;
  }
  let hero = await Hero.findOne({});
  let address = await Address.findOne({});
  let ad = await Ad.findOne({}).populate("user");

  if (userItemCart[0]) {
    cartCount = userItemCart[0].totalQty;
  } else {
    cartCount = 0;
  }

  res.render("home/contact", {
    LoggedIn: req.isAuthenticated(),
    ad,
    address,
    hero,
    userFav,
    cartCount,
    isAdmin,
  });
});

router.post("/contact", async (req, res) => {
  try {
    let userId, userFav, isAdmin;
    if (req.isAuthenticated()) {
      userId = req.user._id;
      userFav = await User.findOne({ _id: userId });
      userFav = userFav ? userFav.fav.length : "";

      isAdmin = req.user.isAdmin;
    } else {
      isAdmin = false;
    }

    let ad = await Ad.findOne({}).populate("user");
    let hero = await Hero.findOne({});
    let address = await Address.findOne({});

    const userItemCart = await Cart.find({ user: userId });

    if (typeof userFav == "undefined") {
      userFav = 0;
    }

    if (userItemCart[0]) {
      cartCount = userItemCart[0].totalQty;
    } else {
      cartCount = 0;
    }

    let errors = [];
    const { fname, lname, email, msg, subject } = req.body;
    //console.log(req.body.msg)
    //console.log(fname,lname,email,msg,subject)
    const validation = new Validator(
      {
        Firstname: fname,
        Lastname: lname,
        Email: email,
        Message: msg,
        subject: subject,
      },
      {
        Firstname: "required",
        Lastname: "required",
        Email: "required|email",
        Message: "required",
        subject: "required",
      }
    );

    if (validation.fails()) {
      const errFname = validation.errors.get("Firstname");
      const errLname = validation.errors.get("Lastname");
      const errEmail = validation.errors.get("Email");
      const errMsg = validation.errors.get("Message");
      const errSub = validation.errors.get("subject");
      errors.push(errFname, errLname, errEmail, errMsg, errSub);
      res.render("home/contact", {
        errors,
        fname,
        lname,
        email,
        msg,
        subject,
        userFav,
        address,
        cartCount,
        ad,
        hero,
        LoggedIn: req.isAuthenticated(),
        isAdmin,
      });
    }
    validation.passes(() => {
      // instantiate the SMTP server
      // const smtpTrans = nodemailer.createTransport({
      //   host: "smtp.gmail.com",
      //   port: 587,
      //   secure: true,
      //   auth: {
      //     // company's email and password
      //     user: process.env.GMAIL_EMAIL,
      //     pass: process.env.GMAIL_PASSWORD,
      //   },
      //   tls: {
      //     rejectUnauthorized: false,
      //   },
      // });
      const smtpTrans = nodemailer.createTransport({
        host: "smtp.mailtrap.io",
        port: 2525,
        auth: {
          user: "9f60059e949515",
          pass: "8efd4c5501809a",
        },
        debug: true, // show debug output
        logger: true, // log information in console
      });

      // email options
      const mailOpts = {
        from: email,
        to: process.env.GMAIL_EMAIL,
        subject: `Enquiry from ${lname} ${fname}`,
        html: `
    <div>
    <h2 style="color: #7971ea; text-align:center;">Client's name:${lname} ${fname}</h2>
    <h3 style="color: #7971ea;">Client's email: (${email})<h3>
    </div>
    <h3 style="color: #7971ea;">Client's message: </h3>
    <div style="font-size: 30;">
    ${msg}
    </div>
    `,
      };

      // send the email
      smtpTrans.sendMail(mailOpts, (error, response) => {
        if (error) {
          req.flash(
            "error_msg",
            "An error occured... Please check your internet connection and try again later"
          );
          res.redirect("/contact");
        } else {
          req.flash(
            "success_msg",
            "Email sent successfully! Thanks for your inquiry."
          );
          return res.redirect("/contact");
        }
      });
    });
  } catch (e) {}
  //res.send("Yooh")
});

router.get("/shipping", async (req, res) => {
  req.session.currentUrl = req.originalUrl;

  let userId, userFav, isAdmin;
  if (req.isAuthenticated()) {
    userId = req.user._id;
    userFav = await User.findOne({ _id: userId });
    userFav = userFav ? userFav.fav.length : "";

    isAdmin = req.user.isAdmin;
  } else {
    isAdmin = false;
  }

  const userItemCart = await Cart.find({ user: userId });
  if (userItemCart[0]) {
    cartCount = userItemCart[0].totalQty;
  } else {
    cartCount = 0;
  }

  let ad = await Ad.findOne({}).populate("user");
  let hero = await Hero.findOne({});
  let address = await Address.findOne({});

  if (typeof userFav == "undefined") {
    userFav = 0;
  }

  res.render("home/shipping", {
    LoggedIn: req.isAuthenticated(),
    userFav,
    ad,
    hero,
    address,
    cartCount,
    isAdmin,
  });
});

router.get("/my-cart", async (req, res) => {
  req.session.currentUrl = req.originalUrl;

  let userId, userFav, isAdmin;
  if (req.isAuthenticated()) {
    userId = req.user._id;
    userFav = await User.findOne({ _id: userId });
    userFav = userFav ? userFav.fav.length : "";

    isAdmin = req.user.isAdmin;
  } else {
    isAdmin = false;
  }

  const coupons = await Coupons.countDocuments();
  let ad = await Ad.findOne({}).populate("user");
  let hero = await Hero.findOne({});
  let address = await Address.findOne({});

  if (typeof userFav == "undefined") {
    userFav = 0;
  }

  let userCart = await Cart.findOne({ user: userId });
  const allCoupons = await Coupons.find({}).sort({ createdAt: -1 });
  let cartCount;
  const userItemCart = await Cart.findOne({ user: userId });
  // console.log("Here "+userItemCart)
  if (userItemCart) {
    cartCount = userItemCart.totalQty;
  } else {
    cartCount = 0;
  }

  if (userCart) {
    myCart = {
      id: userCart._id,
      totalQty: userCart.totalQty,
      totalCost: userCart.totalCost,
      product: [],
    };
    for (let product of userCart.items) {
      const foundProduct = await Product.findById(product.productId);
      const productQty = product.qty;
      const productPrice = product.price;
      myCart.product.push({ foundProduct, productQty, productPrice });
    }
  } else {
    myCart = 0;
  }
  res.render("home/cart", {
    address,
    hero,
    ad,
    allCoupons,
    myCart,
    coupons,
    cartCount,
    userFav,
    LoggedIn: req.isAuthenticated(),
    isAdmin,
  });
});

router.get("/offItems", async (req, res) => {
  req.session.currentUrl = req.originalUrl;

  let userId, userFav, isAdmin;
  if (req.isAuthenticated()) {
    userId = req.user._id;
    userFav = await User.findOne({ _id: userId });
    userFav = userFav ? userFav.fav.length : "";

    isAdmin = req.user.isAdmin;
  } else {
    isAdmin = false;
  }

  if (typeof userFav == "undefined") {
    userFav = 0;
  }

  let cartCount;
  let page = parseInt(req.query.page) || 1;
  let itemPerPage = 10;

  let ad = await Ad.findOne({}).populate("user");
  let hero = await Hero.findOne({});
  let address = await Address.findOne({});
  let products = await Product.find({ isFiftyOff: true })
    .sort({ createdAt: -1 })
    .skip(itemPerPage * page - itemPerPage)
    .limit(itemPerPage);

  const userItemCart = await Cart.find({ user: userId });
  //if user has an item in cart,will try and get the cart's total qty
  if (userItemCart[0]) {
    cartCount = userItemCart[0].totalQty;
  } else {
    //else cart count will be 0
    cartCount = 0;
  }
  const count = await Product.count({ isFiftyOff: true });

  //querying categories in ascending order
  const categories = await Category.find({}).sort({ name: 1 }).limit(20);

  var catCountArr = [];
  var proudctForCategoryCount;

  for (let category of categories) {
    proudctForCategoryCount = await Product.countDocuments({
      category: category._id,
    });
    categoryName = category.name;
    catCountArr.push(proudctForCategoryCount);
  }

  res.render("home/offItems", {
    pages: Math.ceil(count / itemPerPage),
    address,
    hero,
    ad,
    currentPage: page,
    cartCount,
    products,
    categories,
    catCountArr,
    category: typeof category !== "undefined" ? category : "",
    userFav,
    LoggedIn: req.isAuthenticated(),
    isAdmin,
  });
});

router.get("/shop", async (req, res) => {
  req.session.currentUrl = req.originalUrl;

  let userId, userFav, isAdmin;
  if (req.isAuthenticated()) {
    userId = req.user._id;
    userFav = await User.findOne({ _id: userId });
    userFav = userFav ? userFav.fav.length : "";

    isAdmin = req.user.isAdmin;
  } else {
    isAdmin = false;
  }
  let cartCount;
  let products;
  let msg = [];
  let catQuery;
  let ad = await Ad.findOne({}).populate("user");
  let hero = await Hero.findOne({});
  let address = await Address.findOne({});
  if (typeof userFav == "undefined") {
    userFav = 0;
  }

  const userItemCart = await Cart.find({ user: userId });
  //if user has an item in cart,will try and get the cart's total qty
  if (userItemCart[0]) {
    cartCount = userItemCart[0].totalQty;
  } else {
    //else cart count will be 0
    cartCount = 0;
  }

  //handling pagination
  let page = parseInt(req.query.page) || 1;
  let itemPerPage = 10;

  let category = req.query.category;
  const count = await Product.count();
  if (category) {
    category = category.toLowerCase();

    catQuery = await Category.findOne({ name: category });
    // console.log(catQuery._id)

    if (catQuery) {
      msg.push("Search results for " + category);

      products = await Product.find({ category: catQuery._id })
        // .sort({ name: 1 })(ascending-order)

        //  (From new to old products)
        .sort({ createdAt: -1 })
        .skip(itemPerPage * page - itemPerPage)
        .limit(itemPerPage);
    } else if (!catQuery) {
      msg.push("The category " + category + " is not available");
      products = await Product.find({ createdAt: -1 })

        .sort({ name: 1 })
        .skip(itemPerPage * page - itemPerPage)
        .limit(itemPerPage);
    }
  } else {
    products = await Product.find({})

      // .sort({ name: 1 })(ascending-order)

      //  (From new to old products)
      .sort({ createdAt: -1 })

      .skip(itemPerPage * page - itemPerPage)
      .limit(itemPerPage);
  }

  //querying categories in ascending order
  const categories = await Category.find({}).sort({ name: 1 }).limit(20);

  var catCountArr = [];
  var proudctForCategoryCount;

  for (let category of categories) {
    proudctForCategoryCount = await Product.countDocuments({
      category: category._id,
    });
    categoryName = category.name;
    catCountArr.push(proudctForCategoryCount);
  }

  res.render("home/shop", {
    pages: Math.ceil(count / itemPerPage),
    address,
    hero,
    ad,
    msg,
    currentPage: page,
    cartCount,
    products,
    categories,
    catCountArr,
    category: typeof category !== "undefined" ? category : "",

    catQuery,
    userFav,
    LoggedIn: req.isAuthenticated(),
    isAdmin,
  });
});

//when a user visits a category by its slug
router.get("/shop/:slug", async (req, res) => {
  try {
    req.session.currentUrl = req.originalUrl;

    let userId, userFav, isAdmin;
    if (req.isAuthenticated()) {
      userId = req.user._id;
      userFav = await User.findOne({ _id: userId });
      userFav = userFav ? userFav.fav.length : "";

      isAdmin = req.user.isAdmin;
    } else {
      isAdmin = false;
    }
    let slug = req.params.slug;
    const foundCategory = await Category.findOne({ slug: req.params.slug });
    let ad = await Ad.findOne({}).populate("user");
    let hero = await Hero.findOne({});
    let address = await Address.findOne({});
    if (typeof userFav == "undefined") {
      userFav = 0;
    }

    const categories = await Category.find({}).sort({ name: 1 });
    let productCategory = req.params.id;

    let cartCount;
    const count = await Product.count({ category: foundCategory._id });

    const userItemCart = await Cart.find({ user: userId });
    //if user has an item in cart,will try and get the cart's total qty
    if (userItemCart[0]) {
      cartCount = userItemCart[0].totalQty;
    } else {
      //else cart count will be 0
      cartCount = 0;
    }
    //handling pagination
    let page = parseInt(req.query.page) || 1;
    let itemPerPage = 10;

    const productFromCategory = await Product.find({
      category: foundCategory._id,
    })
      .sort({ createdAt: -1 })
      .skip(itemPerPage * page - itemPerPage)
      .limit(itemPerPage);

    var catCountArr = [];
    var proudctForCategoryCount;
    for (category of categories) {
      proudctForCategoryCount = await Product.countDocuments({
        category: category._id,
      });
      categoryName = category.name;
      catCountArr.push(proudctForCategoryCount);
    }

    res.render("home/categoryShop", {
      address,
      hero,
      ad,
      pages: Math.ceil(count / itemPerPage),
      currentPage: page,
      productCategory,
      cartCount,
      productFromCategory,
      categories,
      catCountArr,
      slug,
      userFav,
      LoggedIn: req.isAuthenticated(),
      isAdmin,
    });
  } catch (e) {
    console.log(e);
  }
});

//production-checkout
router.post("/checkout", async (req, res) => {
  try {
    let userId, userFav, isAdmin;

    if (req.isAuthenticated()) {
      userId = req.user._id;
      userFav = await User.findOne({ _id: userId });
      userFav = userFav ? userFav.fav.length : "";

      isAdmin = req.user.isAdmin;
    } else {
      isAdmin = false;
    }

    let cartCount;
    const userItemCart = await Cart.find({ user: userId });
    let ad = await Ad.findOne({}).populate("user");
    let hero = await Hero.findOne({});

    let address = await Address.findOne({});
    if (typeof userFav == "undefined") {
      userFav = 0;
    }
    if (userItemCart[0]) {
      cartCount = userItemCart[0].totalQty;
    } else {
      cartCount = 0;
    }
    const coupons = await Coupons.countDocuments();
    let userCart = await Cart.findOne({ user: userId });
    const allCoupons = await Coupons.find({}).sort({ createdAt: -1 });

    if (userCart) {
      myCart = {
        id: userCart._id,
        totalQty: userCart.totalQty,
        totalCost: userCart.totalCost,
        product: [],
      };
      for (let product of userCart.items) {
        const foundProduct = await Product.findById(product.productId);
        const productQty = product.qty;
        const productPrice = product.price;
        myCart.product.push({ foundProduct, productQty, productPrice });
      }
    } else {
      myCart = 0;
    }
    let errors = [];
    const { appartment, orderNotes, country, region, email, phone, name } =
      req.body;
    let { C_address } = req.body;

    const validation = new Validator(
      {
        name: name,
        phone: phone,
        email: email,
        address: C_address,
        region: region,
        country: country,
      },
      {
        name: "required",
        phone: "required",
        email: "required|email",
        address: "required",
        region: "required",
        country: "required",
      }
    );

    if (validation.fails()) {
      const errName = validation.errors.get("name");
      const errPhone = validation.errors.get("phone");
      const errEmail = validation.errors.get("email");
      const errAddress = validation.errors.get("address");
      const errRegion = validation.errors.get("region");
      const errCountry = validation.errors.get("country");
      errors.push(
        errName,
        errPhone,
        errEmail,
        errAddress,
        errRegion,
        errCountry
      );
      res.render("home/checkout", {
        address,
        hero,
        ad,
        cartCount,
        allCoupons,
        coupons,
        myCart,
        userFav,
        errors,
        C_address,
        appartment,
        orderNotes,
        country,
        region,
        email,
        phone,
        name,
        LoggedIn: req.isAuthenticated(),
        isAdmin,
      });
    } else {
      validation.passes(async () => {
        let ghPhone = req.body.phone;
        ghPhone = "+233" + ghPhone.substring(1);
        let user = await User.findByIdAndUpdate(
          { _id: userId },
          {
            $set: {
              country: req.body.country,
              address: req.body.C_address,
              region: req.body.region,
              appartment:
                typeof req.body.appartment != "undefined"
                  ? req.body.appartment
                  : "",
              phone: ghPhone,
              name: req.body.name,
              email: req.body.email,
            },
          },
          { new: true }
        );

        user = await user.save();
        let stockErr = [];
        for (let product of userCart.items) {
          // console.log(product)
          let pr = await Product.findById(product.productId);

          let productIndex = userCart.items.indexOf(product);
          if (pr.countInStock < userCart.items[productIndex].qty) {
            if (pr.countInStock >= 1) {
              stockErr.push(
                `${pr.name} is left with just ${pr.countInStock} Quantity,Please reduce the amount you need in your cart to ${pr.countInStock} for product  ${pr.name}  `
              );
            } else {
              stockErr.push(
                `${pr.name} is finished,Please remove it from your cart  `
              );
            }
          }
          if (stockErr.length > 0 && stockErr !== "undefined") {
            res.render("home/checkout", {
              stockErr,
              address,
              hero,
              ad,
              cartCount,
              allCoupons,
              coupons,
              myCart,
              userFav,
              errors,
              C_address,
              appartment,
              orderNotes,
              country,
              region,
              email,
              phone,
              name,
              LoggedIn: req.isAuthenticated(),
              isAdmin,
            });
          } else {
            if (req.body.pay == "true") {
              let Customer = await User.findOne({ _id: userId });
              let name = Customer.name;
              let email = req.body.email;
              let amount = userCart.totalCost;
              let form = { name, email, amount };
              form.amount *= 100;
              initializePayment(form, async (error, body) => {
                if (error) {
                  //handle errors
                  console.log(error);
                  return;
                }

                response = JSON.parse(body);
                pr.countInStock = pr.countInStock - product.qty;
                pr = await pr.save();
                let order = new Order({
                  user: userId,
                  cart: {
                    totalQty: userCart.totalQty,
                    totalCost: userCart.totalCost,
                    items: userCart.items,
                  },
                  appartment: user.appartment,
                  orderNotes,
                  name: user.name,
                  address: user.address,
                  country: user.country,
                  region: user.region,
                  email: user.email,
                  phone: user.phone,
                  paymentRef: response.data.reference,
                });
                order = await order.save();
                let userEmail = order.email;

                let protocol =
                  process.env.NODE_ENV === "production" ? "https" : "http";

                let itemsPurchased = [];
                let support_url = `${protocol}://${req.headers.host}/contact`;
                let wsMsg = encodeURI(`Hello @admin,I recently
                                made an order with an id ${order._id},Kindly
                                attend to it and do the needful,thanks by the
                                way `);
                let hrefUrl = `https://wa.me/23354381698?text=${wsMsg}`;
                sgMail.setApiKey(sendGridApiKey);

                for (let item of order.cart.items) {
                  itemsPurchased.push(`${item.title}(${item.qty})`);
                }
                let allItems = itemsPurchased.slice(
                  0,
                  itemsPurchased.length - 1
                ); //get all user items without last one
                let lastItem = itemsPurchased.slice(-1)[0]; //getting the last item in the array

                let firstItem = itemsPurchased[0]; //getting only a single item(first item)
                // countin starts from 0
                let userItems =
                  itemsPurchased.length >= 3
                    ? `${allItems} and ${lastItem}`
                    : itemsPurchased.length == 2
                    ? `${firstItem} and ${lastItem}`
                    : `${firstItem}`;

                console.log(`${firstItem} and ${lastItem}`);

                const msg = {
                  to: userEmail,
                  from: `developersavenue@gmail.com`,
                  subject: `Yuta-mart order info `,

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
        color: #3869d4;
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
        margin: 0.4em 0 1.1875em;
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
        background-color: #3869d4;
        border-top: 10px solid #3869d4;
        border-right: 18px solid #3869d4;
        border-bottom: 10px solid #3869d4;
        border-left: 18px solid #3869d4;
        display: inline-block;
        color: #fff;
        text-decoration: none;
        border-radius: 3px;
        box-shadow: 0 2px 3px rgba(0, 0, 0, 0.16);
        -webkit-text-size-adjust: none;
        box-sizing: border-box;
      }

      .button--green {
        background-color: #22bc66;
        border-top: 10px solid #22bc66;
        border-right: 18px solid #22bc66;
        border-bottom: 10px solid #22bc66;
        border-left: 18px solid #22bc66;
      }

      .button--red {
        background-color: #ff6136;
        border-top: 10px solid #ff6136;
        border-right: 18px solid #ff6136;
        border-bottom: 10px solid #ff6136;
        border-left: 18px solid #ff6136;
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
        background-color: #f4f4f7;
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
        color: #cbcccf;
        font-size: 15px;
        line-height: 18px;
      }

      .related_item-title {
        display: block;
        margin: 0.5em 0 0;
      }

      .related_item-thumb {
        display: block;
        padding-bottom: 10px;
      }

      .related_heading {
        border-top: 1px solid #cbcccf;
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
        background-color: #f4f4f7;
        border: 2px dashed #cbcccf;
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
        color: #51545e;
        font-size: 15px;
        line-height: 18px;
      }

      .purchase_heading {
        padding-bottom: 8px;
        border-bottom: 1px solid #eaeaec;
      }

      .purchase_heading p {
        margin: 0;
        color: #85878e;
        font-size: 12px;
      }

      .purchase_footer {
        padding-top: 15px;
        border-top: 1px solid #eaeaec;
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
        background-color: #f2f4f6;
        color: #51545e;
      }

      p {
        color: #51545e;
      }

      .email-wrapper {
        width: 100%;
        margin: 0;
        padding: 0;
        -premailer-width: 100%;
        -premailer-cellpadding: 0;
        -premailer-cellspacing: 0;
        background-color: #f2f4f6;
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
        color: #a8aaaf;
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
        background-color: #ffffff;
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
        color: #a8aaaf;
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
        border-top: 1px solid #eaeaec;
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
          color: #fff !important;
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
          color: #fff !important;
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
        .f-fallback {
          font-family: Arial, sans-serif;
        }
      </style>
    <![endif]-->
  </head>
  <body>
    <span class="preheader"
      >Use this link to reset your password. The link is only valid for 24
      hours.</span
    >
    <table
      class="email-wrapper"
      width="100%"
      cellpadding="0"
      cellspacing="0"
      role="presentation"
    >
      <tr>
        <td align="center">
          <table
            class="email-content"
            width="100%"
            cellpadding="0"
            cellspacing="0"
            role="presentation"
          >
            <tr>
              <td class="email-masthead">
                <a
                  href="https://yuta-mart.com"
                  class="f-fallback email-masthead_name"
                >
                  Yuta-mart
                </a>
              </td>
            </tr>
            <!-- Email Body -->
            <tr>
              <td
                class="email-body"
                width="570"
                cellpadding="0"
                cellspacing="0"
              >
                <table
                  class="email-body_inner"
                  align="center"
                  width="570"
                  cellpadding="0"
                  cellspacing="0"
                  role="presentation"
                >
                  <!-- Body content -->
                  <tr>
                    <td class="content-cell">
                      <div class="f-fallback">
                        <h1>Hi ${order.name},</h1>
                        <p>
                          You are receiving this e-mail from us because you just
                          made an order on our site requesting to buy
                          <strong
                            >${userItems}</strong
                          >
                          <small
                            >This order has been received and its being
                            processed at the moment.</small
                          >
                          <br />
                          ${order.name}, you can always come back to this email and
                          contact us on whatsapp if your order is somehow
                          delayed
                        </p>
                        <!-- Action -->
                        <table
                          class="body-action"
                          align="center"
                          width="100%"
                          cellpadding="0"
                          cellspacing="0"
                          role="presentation"
                        >
                          <tr>
                            <td align="center">
                              <!-- Border based button
                       https://litmus.com/blog/a-guide-to-bulletproof-buttons-in-email-design -->
                              <table
                                width="100%"
                                border="0"
                                cellspacing="0"
                                cellpadding="0"
                                role="presentation"
                              >
                               
                                <tr>
                                  <td align="center">
                                    <a
                                      style="color: white"
                                      class="f-fallback button"
                                      href=${hrefUrl}
                                      class="btn btn-danger mr-4"
                                      >Contact us on whatsapp</a
                                    >
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                        <p>
                          The Support Team Is Also On StandBy To Guide You In
                          Keeping Track Of Your Order,Your Order Id
                          <strong>[${order._id}]</strong>
                          <br />
                          <a href="${support_url}">contact support</a> if you
                          have questions.
                        </p>
                        <p>Thanks, <br />The Yuta-mart Team</p>
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td>
                <table
                  class="email-footer"
                  align="center"
                  width="570"
                  cellpadding="0"
                  cellspacing="0"
                  role="presentation"
                >
                  <tr>
                    <td class="content-cell" align="center">
                      <p class="f-fallback sub align-center">
                        Yutamart, Inc
                        <br />Adehyeɛ Market Kumasi,Opposite zoo.
                        <br />0245688822. <br />yutamart1@gmail.com
                      </p>
                      <p class="f-fallback sub align-center">
                        &copy; 2021 Yutamart. All rights reserved.
                      </p>
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
                await sgMail.send(msg);
                console.log("Email don go fah");

                req.flash(
                  "success_msg",
                  "Your order has been successfully made!"
                );
                await Cart.findByIdAndDelete(userCart._id);

                return res.redirect(response.data.authorization_url);
              });
              // console.log("selected")
            } else {
              pr.countInStock = pr.countInStock - product.qty;
              pr = await pr.save();
              let order = new Order({
                user: userId,
                cart: {
                  totalQty: userCart.totalQty,
                  totalCost: userCart.totalCost,
                  items: userCart.items,
                },
                appartment: user.appartment,
                orderNotes,
                name: user.name,
                address: user.address,
                country: user.country,
                region: user.region,
                email: user.email,
                phone: user.phone,
                //   // paymentRef: ref,
              });
              order = await order.save();
              let userEmail = order.email;

              await Cart.findByIdAndDelete(userCart._id);
              let protocol =
                process.env.NODE_ENV === "production" ? "https" : "http";

              let itemsPurchased = [];
              let support_url = `${protocol}://${req.headers.host}/contact`;
              let wsMsg = encodeURI(`Hello @admin,I recently
                                made an order with an id ${order._id},Kindly
                                attend to it and do the needful,thanks by the
                                way `);
              let hrefUrl = `https://wa.me/233554381698?text=${wsMsg}`;
              sgMail.setApiKey(sendGridApiKey);

              for (let item of order.cart.items) {
                itemsPurchased.push(`${item.title}(${item.qty})`);
              }
              let allItems = itemsPurchased.slice(0, itemsPurchased.length - 1); //get all user items without last one
              let lastItem = itemsPurchased.slice(-1)[0]; //getting the last item in the array

              let firstItem = itemsPurchased[0]; //getting only a single item(first item)
              // countin starts from 0
              let userItems =
                itemsPurchased.length >= 3
                  ? `${allItems} and ${lastItem}`
                  : itemsPurchased.length == 2
                  ? `${firstItem} and ${lastItem}`
                  : `${firstItem}`;

              console.log(`${firstItem} and ${lastItem}`);

              const msg = {
                to: userEmail,
                from: `developersavenue@gmail.com`,
                subject: `Yuta-mart order info `,

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
        color: #3869d4;
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
        margin: 0.4em 0 1.1875em;
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
        background-color: #3869d4;
        border-top: 10px solid #3869d4;
        border-right: 18px solid #3869d4;
        border-bottom: 10px solid #3869d4;
        border-left: 18px solid #3869d4;
        display: inline-block;
        color: #fff;
        text-decoration: none;
        border-radius: 3px;
        box-shadow: 0 2px 3px rgba(0, 0, 0, 0.16);
        -webkit-text-size-adjust: none;
        box-sizing: border-box;
      }

      .button--green {
        background-color: #22bc66;
        border-top: 10px solid #22bc66;
        border-right: 18px solid #22bc66;
        border-bottom: 10px solid #22bc66;
        border-left: 18px solid #22bc66;
      }

      .button--red {
        background-color: #ff6136;
        border-top: 10px solid #ff6136;
        border-right: 18px solid #ff6136;
        border-bottom: 10px solid #ff6136;
        border-left: 18px solid #ff6136;
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
        background-color: #f4f4f7;
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
        color: #cbcccf;
        font-size: 15px;
        line-height: 18px;
      }

      .related_item-title {
        display: block;
        margin: 0.5em 0 0;
      }

      .related_item-thumb {
        display: block;
        padding-bottom: 10px;
      }

      .related_heading {
        border-top: 1px solid #cbcccf;
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
        background-color: #f4f4f7;
        border: 2px dashed #cbcccf;
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
        color: #51545e;
        font-size: 15px;
        line-height: 18px;
      }

      .purchase_heading {
        padding-bottom: 8px;
        border-bottom: 1px solid #eaeaec;
      }

      .purchase_heading p {
        margin: 0;
        color: #85878e;
        font-size: 12px;
      }

      .purchase_footer {
        padding-top: 15px;
        border-top: 1px solid #eaeaec;
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
        background-color: #f2f4f6;
        color: #51545e;
      }

      p {
        color: #51545e;
      }

      .email-wrapper {
        width: 100%;
        margin: 0;
        padding: 0;
        -premailer-width: 100%;
        -premailer-cellpadding: 0;
        -premailer-cellspacing: 0;
        background-color: #f2f4f6;
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
        color: #a8aaaf;
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
        background-color: #ffffff;
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
        color: #a8aaaf;
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
        border-top: 1px solid #eaeaec;
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
          color: #fff !important;
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
          color: #fff !important;
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
        .f-fallback {
          font-family: Arial, sans-serif;
        }
      </style>
    <![endif]-->
  </head>
  <body>
    <span class="preheader"
      >Use this link to reset your password. The link is only valid for 24
      hours.</span
    >
    <table
      class="email-wrapper"
      width="100%"
      cellpadding="0"
      cellspacing="0"
      role="presentation"
    >
      <tr>
        <td align="center">
          <table
            class="email-content"
            width="100%"
            cellpadding="0"
            cellspacing="0"
            role="presentation"
          >
            <tr>
              <td class="email-masthead">
                <a
                  href="https://yuta-mart.com"
                  class="f-fallback email-masthead_name"
                >
                  Yuta-mart
                </a>
              </td>
            </tr>
            <!-- Email Body -->
            <tr>
              <td
                class="email-body"
                width="570"
                cellpadding="0"
                cellspacing="0"
              >
                <table
                  class="email-body_inner"
                  align="center"
                  width="570"
                  cellpadding="0"
                  cellspacing="0"
                  role="presentation"
                >
                  <!-- Body content -->
                  <tr>
                    <td class="content-cell">
                      <div class="f-fallback">
                        <h1>Hi ${order.name},</h1>
                        <p>
                          You are receiving this e-mail from us because you just
                          made an order on our site requesting to buy
                          <strong
                            >${userItems}</strong
                          >
                          <small
                            >This order has been received and its being
                            processed at the moment.</small
                          >
                          <br />
                          ${order.name}, you can always come back to this email and
                          contact us on whatsapp if your order is somehow
                          delayed
                        </p>
                        <!-- Action -->
                        <table
                          class="body-action"
                          align="center"
                          width="100%"
                          cellpadding="0"
                          cellspacing="0"
                          role="presentation"
                        >
                          <tr>
                            <td align="center">
                              <!-- Border based button
                       https://litmus.com/blog/a-guide-to-bulletproof-buttons-in-email-design -->
                              <table
                                width="100%"
                                border="0"
                                cellspacing="0"
                                cellpadding="0"
                                role="presentation"
                              >
                               
                                <tr>
                                  <td align="center">
                                    <a
                                      style="color: white"
                                      class="f-fallback button"
                                      href=${hrefUrl}
                                      class="btn btn-danger mr-4"
                                      >Contact us on whatsapp</a
                                    >
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                        <p>
                          The Support Team Is Also On StandBy To Guide You In
                          Keeping Track Of Your Order,Your Order Id
                          <strong>[${order._id}]</strong>
                          <br />
                          <a href="${support_url}">contact support</a> if you
                          have questions.
                        </p>
                        <p>Thanks, <br />The Yuta-mart Team</p>
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td>
                <table
                  class="email-footer"
                  align="center"
                  width="570"
                  cellpadding="0"
                  cellspacing="0"
                  role="presentation"
                >
                  <tr>
                    <td class="content-cell" align="center">
                      <p class="f-fallback sub align-center">
                        Yutamart, Inc
                        <br />Adehyeɛ Market Kumasi,Opposite zoo.
                        <br />0245688822. <br />yutamart1@gmail.com
                      </p>
                      <p class="f-fallback sub align-center">
                        &copy; 2021 Yutamart. All rights reserved.
                      </p>
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
              await sgMail.send(msg);
              console.log("Email don go fah");

              req.flash(
                "success_msg",
                "Your order has been successfully made!"
              );

              res.redirect("/success-checkout");
            }
          }
        }
      });
    }
  } catch (e) {
    console.log(e);
  }
});
router.get("/paystack/callback", (req, res) => {
  let { trxref } = req.query;

  verifyPayment(trxref, async (error, body) => {
    if (error) {
      //handle errors appropriately
      console.log(error);
      //error during transaction action
      return res.render("error");
    }
    let response = JSON.parse(body);
    if (
      response.status === true &&
      response.data.status === "success" &&
      response.data.gateway_response === "Approved"
    ) {
      let paidOrder = await Order.findOne({ paymentRef: trxref });
      paidOrder.payMentStatus = true;
      paidOrder = await paidOrder.save();
      req.flash(
        "success_msg",
        "Your order has been successfully made,we will remember your choices next time!"
      );
      return res.redirect("/success-checkout");
    }
  });
});

//checkout
router.get("/my-cart/checkout", ensureAuthenticated, async (req, res) => {
  let userId, userFav, user, isAdmin;
  req.session.currentUrl = req.originalUrl;

  if (req.isAuthenticated()) {
    userId = req.user._id;
    userFav = await User.findOne({ _id: userId });
    userFav = userFav ? userFav.fav.length : "";

    user = await User.findOne({ _id: userId });
    isAdmin = req.user.isAdmin;
  } else {
    isAdmin = false;
  }
  let cartCount;
  const userItemCart = await Cart.find({ user: userId });
  let ad = await Ad.findOne({}).populate("user");
  let hero = await Hero.findOne({});
  let address = await Address.findOne({});
  if (typeof userFav == "undefined") {
    userFav = 0;
  }
  if (userItemCart[0]) {
    cartCount = userItemCart[0].totalQty;
  } else {
    cartCount = 0;
  }
  const coupons = await Coupons.countDocuments();
  let userCart = await Cart.findOne({ user: userId });
  const allCoupons = await Coupons.find({}).sort({ createdAt: -1 });

  if (userCart) {
    myCart = {
      id: userCart._id,
      totalQty: userCart.totalQty,
      totalCost: userCart.totalCost,
      product: [],
    };
    for (let product of userCart.items) {
      const foundProduct = await Product.findById(product.productId);
      const productQty = product.qty;
      const productPrice = product.price;
      myCart.product.push({ foundProduct, productQty, productPrice });
    }
  } else {
    myCart = 0;
  }

  res.render("home/checkout", {
    address,
    hero,
    ad,
    cartCount,
    allCoupons,
    coupons,
    myCart,
    userFav,
    user,
    LoggedIn: req.isAuthenticated(),
    isAdmin,
  });
});

//when user presses + from cart
router.post("/plus-to-cart/:id", ensureAuthenticated, async (req, res) => {
  let userId, userFav;
  if (req.isAuthenticated()) {
    userId = req.user._id;
  }
  let productId = req.params.id;
  let product = await Product.findById(productId);
  let stockLeft = product.countInStock;
  if (stockLeft <= 0) {
    req.flash(
      "error_msg",
      "Sorry,you cannot add more,we are short on stocks for " + product.name
    );
    res.redirect(req.headers.referer);
  } else {
    let userCart = await Cart.findOne({ user: userId });
    const itemIndex = userCart.items.findIndex((p) => p.productId == productId);
    userCart.items[itemIndex].qty++;
    userCart.items[itemIndex].price += product.price;
    userCart.totalCost += product.price;
    userCart.totalQty++;
    const updatedCart = await userCart.save();
    req.flash("success_msg", "Added one " + product.name);

    res.redirect(req.headers.referer);
  }
});

//when user presses - from cart
router.post("/minus-from-cart/:id", async (req, res) => {
  let userId, userFav;
  if (req.isAuthenticated()) {
    userId = req.user._id;
  }
  let productId = req.params.id;
  let product = await Product.findById(productId);
  let userCart = await Cart.findOne({ user: userId });
  const itemIndex = userCart.items.findIndex((p) => p.productId == productId);
  userCart.items[itemIndex].qty--;
  userCart.items[itemIndex].price -= product.price;
  userCart.totalCost -= product.price;
  userCart.totalQty--;
  const updatedCart = await userCart.save();
  req.flash("success_msg", "Reduced one " + product.name);

  res.redirect(req.headers.referer);
});

//reducing user's cart price
router.post("/apply-coupon/:id", ensureAuthenticated, async (req, res) => {
  const { coupon } = req.body;
  console.log(coupon);
  let userCart = await Cart.findOne({ _id: req.params.id });
  const checkCoupon = await Coupons.findOne({ code: coupon });
  if (checkCoupon) {
    let fmt = "YYYY-MM-DD";
    const now = moment().format(fmt);
    let dbDate = moment(checkCoupon.expireDate).format(fmt);
    console.log(now, " " + dbDate);
    if (moment(now).isBefore(dbDate)) {
      userCart = await Cart.findById(userCart._id);
      //  console.log(userCart.user);
      //checking if user has used this coupon on cart before
      const cartUser = await User.findOne({ _id: userCart.user });
      //console.log(cartUser)
      if (cartUser.usedCoupons.includes(coupon)) {
        //then coupon //is used by user
        req.flash(
          "error_msg",
          "You have already used this coupon code on cart,Please use another"
        );
        res.redirect(req.headers.referer);
      } else {
        cartUser.usedCoupons.push(coupon);
        await cartUser.save();
        userCart.totalCost -= checkCoupon.worth;
        let newCartCost = await userCart.save();
        req.flash(
          "success_msg",
          "You have successfully applied coupon,proceed to checkout......."
        );
        res.redirect(req.headers.referer);
      }
    } else {
      //console.log("dont");
      req.flash("error_msg", "This coupon is expired!");
      res.redirect(req.headers.referer);
    }
  } else {
    //the person wants to steal!
    req.flash("error_msg", "That isnt a coupon!");
    res.redirect(req.headers.referer);
  }
});

//deleting a product in cart
router.put("/reduce/:id", ensureAuthenticated, async (req, res) => {
  let userId, userFav;
  if (req.isAuthenticated()) {
    userId = req.user._id;
  }
  const productId = req.params.id;
  const product = await Product.findById(req.params.id);
  let cart = await Cart.findOne({ user: userId });
  const itemIndex = cart.items.findIndex((p) => p.productId == productId);
  if (itemIndex > -1) {
    cart.totalCost -= cart.items[itemIndex].price;
    cart.totalQty -= cart.items[itemIndex].qty;

    //removing the index of that product from the cartn array using id(generated by mongoose)
    await cart.items.remove({ _id: cart.items[itemIndex]._id });

    const updateCart = await cart.save();

    res.redirect(req.headers.referer);
  }
  //if there is nothing in cart,cart is deleted
  if (cart.totalQty <= 0) {
    await Cart.findByIdAndRemove(cart._id);
    res.redirect(req.headers.referer);
  }
});
//when a user clicks on add to cart for each item
router.post("/add-to-cart/:id", ensureAuthenticated, async (req, res) => {
  try {
    let userId, userFav;

    if (req.isAuthenticated()) {
      userId = req.user._id;
    }
    const productId = req.params.id;
    let user_cart;
    let cart;
    //user_cart = await Cart.findOne({ user: req.user._id });

    user_cart = await Cart.findOne({ user: userId });
    if (!user_cart) {
      cart = new Cart({});
      //if user has no cart in db
    } else {
      cart = user_cart;
      // if user has a cart,I wil dynamically access the cart and manipulate it
    }
    const product = await Product.findById(req.params.id);
    let stockLeft = product.countInStock;

    const itemIndex = cart.items.findIndex((p) => p.productId == productId);
    if (itemIndex > -1) {
      //update
      if (stockLeft < req.body.qty) {
        req.flash(
          "error_msg",
          "Sorry,please reduce the amount you want,the quantity you want is a bit more than what we have"
        );
        return res.redirect(req.headers.referer);
      } else {
        // if product exists in the cart, update the quantity
        cart.items[itemIndex].qty += parseInt(req.body.qty);

        //remove old price of this item from total cost
        cart.totalCost -= cart.items[itemIndex].price;
        cart.items[itemIndex].price = cart.items[itemIndex].qty * product.price;
        cart.totalQty += parseInt(req.body.qty);
        cart.totalCost += cart.items[itemIndex].price;
      }
    } else {
      // if product does not exists in cart, find it in the db to retrieve its price and add new item
      //update
      if (stockLeft < req.body.qty) {
        req.flash(
          "error_msg",
          "Sorry,please reduce the amount you want,the quantity you want is a bit more than what we have"
        );
        return res.redirect(req.headers.referer);
      } else {
        const singlePrice = parseInt(req.body.qty) * product.price;
        // console.log(singlePrice)
        cart.items.push({
          productId: productId,
          qty: parseInt(req.body.qty),
          price: singlePrice,
          title: product.name,
        });
        cart.totalQty += parseInt(req.body.qty);
        cart.totalCost += singlePrice;
      }
    }
    //   cart.user = req.user._id;
    cart.user = userId;
    await cart.save();

    //   console.log(cart)
    req.flash("success_msg", `Item ${product.name} added to the shopping cart`);
    res.redirect(req.headers.referer);
  } catch (e) {
    console.log(e);
  }
});

router.get("/", ensureGuest, async (req, res) => {
  try {
    req.session.currentUrl = req.originalUrl;
    let userId, userFav, isAdmin;
    if (req.isAuthenticated()) {
      userId = req.user._id;
      userFav = await User.findOne({ _id: userId });
      userFav = userFav ? userFav.fav.length : "";

      isAdmin = req.user.isAdmin;
    } else {
      isAdmin = false;
    }
    const allCoupons = await Coupons.find({}).sort({ createdAt: -1 });
    let ad = await Ad.findOne({}).populate("user");
    let hero = await Hero.findOne({});
    let address = await Address.findOne({});
    if (typeof userFav == "undefined") {
      userFav = 0;
    }
    // console.log("HERE "+user+userId)

    const categories = await Category.find({}).sort({ name: 1 });
    const coupons = await Coupons.countDocuments();
    let cartCount;
    const userItemCart = await Cart.find({ user: userId });
    if (userItemCart[0]) {
      cartCount = userItemCart[0].totalQty;
    } else {
      cartCount = 0;
    }

    //gettin featured products(latest to last)
    const products = await Product.find({ isFeatured: true }).sort({
      createdAt: -1,
    });

    // for (product of products){
    // products.forEach(async (product) => {
    //   let dateCreated = new Date(product.createdAt).getDate();
    //   let week = 7;
    //   let checkIsExpired = week - dateCreated;
    //   console.log("Neg " + checkIsExpired);
    //   if (checkIsExpired <= 0) {
    //     let oldProduct = await Product.findById(product._id);
    //     oldProduct.isFeatured = false;
    //     oldProduct = await oldProduct.save();
    //     console.log(oldProduct);
    //   } else {
    //     console.log("Still fresh");
    //   }
    // });

    res.render("home/home", {
      categories,
      products,
      coupons,
      allCoupons,
      cartCount,
      LoggedIn: req.isAuthenticated(),
      ad,
      hero,
      address,
      userFav,
      isAdmin,
    });
  } catch (e) {
    console.log(e);
  }
});

//getting a product
router.get("/shop-product/:slug/", async (req, res) => {
  try {
    req.session.currentUrl = req.originalUrl;

    let userId;
    let userFav;
    let userFavs;
    let isAdmin;
    if (req.isAuthenticated()) {
      userId = req.user._id;
      userFav = await User.findOne({ _id: userId }).populate("fav");
      userFav = userFav ? userFav.fav.length : "";

      userFavs = await User.findOne({ _id: userId });
      userFavs = userFavs.fav;
      isAdmin = req.user.isAdmin;
    } else {
      isAdmin = false;
    }
    // console.log(userFav)
    if (typeof userFav == "undefined") {
      userFav = 0;
    }
    const product = await Product.findOne({ slug: req.params.slug });

    let productCounter = await Product.findByIdAndUpdate(
      product._id,
      { $inc: { viewCount: 1 } },
      { new: true }
    );

    // console.log(productCounter.viewCount)
    let ad = await Ad.findOne({}).populate("user");
    let hero = await Hero.findOne({});
    let address = await Address.findOne({});
    const products = await Product.find({ isFeatured: true }).sort({
      createdAt: -1,
    });
    // .li

    // const product = await Product.findOne({slug:req.params.slug}).populate("category");

    //gettin featured products(latest to last)

    // .limit(5);
    let cartCount;
    const userItemCart = await Cart.find({ user: userId });
    if (userItemCart[0]) {
      cartCount = userItemCart[0].totalQty;
    } else {
      cartCount = 0;
    }

    // console.log(LoggedIn)
    res.render("home/product-single", {
      products,
      product,
      cartCount,
      ad,
      hero,
      address,
      userFavs,
      userFav,
      LoggedIn: req.isAuthenticated(),
      isAdmin,
      products,
    });
  } catch (e) {
    console.log(e);
  }
});

router.post("/subscribe", async (req, res) => {
  const { subscribe } = req.body;
  let newMail = new Mail({ email: subscribe });
  //check if mail already subscribed
  const isSubscriber = await Mail.findOne({ email: subscribe });
  if (isSubscriber) {
    req.flash("error_msg", `You are already part of our newsletter List`);

    res.redirect(req.headers.referer);
  }
  newMail = await newMail.save();
  req.flash("success_msg", "Thank you for Subscribing!");

  res.redirect(req.headers.referer);
});

//remove a product from a user's favourites
router.delete(
  "/remove-wishlist-product/:id",
  ensureAuthenticated,
  async (req, res) => {
    let userFav = await req.user.fav;
    let idToRemove = req.params.id;
    let productToRemoveName = await Product.findById(idToRemove);
    productToRemoveName = productToRemoveName.name;
    // userFav.filter(removeUnwanted);
    let newFavList = userFav.filter((item) => item != idToRemove);

    // updating user's favourites
    let user = await User.findById(req.user.id);
    user.fav = newFavList;
    user = await user.save();
    // console.log(`Before ${userFav} After ${newFavList} and user ${user.fav}`);
    req.flash(
      "success_msg",
      `Successfully removed ${productToRemoveName} from your favourites list`
    );
    res.redirect(req.headers.referer);
  }
);

router.post(
  "/fav-to-cart",
  ensureAuthenticated,

  async (req, res) => {
    let cart;
    let userFav = req.user.fav;
    user_cart = await Cart.findOne({ user: req.user._id });

    if (!user_cart) {
      cart = new Cart({});
      //if user has no cart in db
    } else {
      cart = user_cart;
      // if user has a cart,I wil dynamically access the cart and manipulate it
    }

    for (let favProduct of userFav) {
      // console.log("yh" + favProduct);

      const product = await Product.findById(favProduct.toString());
      let stockLeft = product.countInStock;
      let productId = product._id;
      const itemIndex = cart.items.findIndex(
        (p) => p.productId.toString() == productId.toString()
      );

      if (itemIndex > -1) {
        // console.log("yh" + favProduct);
        //   //update
        if (stockLeft < 1) {
          req.flash(
            "error_msg",
            `Sorry,please remove ${product.name} from your favourites,we are out of stock `
          );
          return res.redirect(req.headers.referer);
        } else {
          //     // if product exists in the cart, update the quantity
          cart.items[itemIndex].qty += 1;
          //     //remove old price of this item from total cost
          cart.totalCost -= cart.items[itemIndex].price;
          cart.items[itemIndex].price =
            cart.items[itemIndex].qty * product.price;
          cart.totalQty += 1;
          cart.totalCost += cart.items[itemIndex].price;
        }
      } else {
        //   // if product does not exists in cart, find it in the db to retrieve its price and add new item
        //   //update
        if (stockLeft < 1) {
          req.flash(
            "error_msg",
            `Sorry,please remove ${product.name} from your favourites,we are out of stock `
          );
          return res.redirect(req.headers.referer);
        } else {
          const singlePrice = 1 * product.price;
          //     // console.log(singlePrice)
          cart.items.push({
            productId: favProduct,
            qty: 1,
            price: singlePrice,
            title: product.name,
          });
          cart.totalQty += 1;
          cart.totalCost += singlePrice;
        }
      }

      cart.user = req.user._id;
      await cart.save();
    }
    let user = await User.findById(req.user._id);
    user.fav = [];
    user = await user.save();

    req.flash("success_msg", `All your favourites are in your cart now`);
    return res.redirect("/my-cart");
  }
);

module.exports = router;
