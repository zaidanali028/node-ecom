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
const crypto = require("crypto");
const sgMail = require("@sendgrid/mail");
const async = require("async");

sendGridApiKey = process.env.SENDGRID_API_KEY;

const util = require("util");
const Order = require("../../models/order");
const Hero = require("../../models/hero");
const Ad = require("../../models/post-ad");
const Address = require("../../models/add-address");
const Mail = require("../../models/mail-list");
const userId = "60d99c222fe46e3d90db0f87";

const passport = require("passport");

router.post("/register", async (req, res) => {
  let isAdmin;
  if (req.isAuthenticated()) {
    isAdmin = req.user.isAdmin;
  } else {
    isAdmin = false;
  }
  const {
    region,
    appartment,
    address,
    name,
    email,
    password,
    passwordConfirm,
    country,
    firstName,
  } = req.body;
  let errors = [];
  // console.log(name,email,password,passwordConfirm)
  const validation = new Validator(
    {
      fullName: name,
      password: password,
      password_confirm: passwordConfirm,
    },
    {
      fullName: "required",
      password: "required|min:6",
      password_confirm: "required|min:6",
    }
  );

  if (passwordConfirm !== "undefined") {
    errors.push("You need to re-type your password");
  } else if (password != passwordConfirm) {
    errors.push("Password fields does not match");
  }

  if (validation.fails()) {
    const errfullName = validation.errors.get("fullName");
    const errPwd = validation.errors.get("password");
    errors.push(errfullName, errPwd);

    const userItemCart = await Cart.find({ user: userId });
    let userFav = await User.findOne({ _id: userId });
    userFav = userFav ? userFav.fav.length : "";

    let ad = await Ad.findOne({}).populate("user");

    if (userItemCart[0]) {
      cartCount = userItemCart[0].totalQty;
    } else {
      cartCount = 0;
    }

    let hero = await Hero.findOne({});
    let address = await Address.findOne({});

    res.render("home/register", {
      LoggedIn: req.isAuthenticated(),
      ad,
      errors,
      name,
      email,
      userFav,
      hero,
      address,
      cartCount,
      isAdmin,
    });
  }
  validation.passes(async () => {
    try {
      let existUser = await User.findOne({ name });
      let existUser2 = await User.findOne({ email });
      if (existUser || existUser2) {
        req.flash("error_msg", "This account already exists!");
        res.redirect("/users/register");
        //#
      } else {
        let newUser = new User({
          name: name,
          email: email,
          password: password,
        });

        newUser = await newUser.save();
        //console.log(newUser);

        req.flash("success_msg", "Registration was successful!");
        
        res.redirect("/users/login");
      }
    } catch (e) {
      console.log(e);
    }
  });
});

router.get("/register", async (req, res) => {
  let isAdmin;
  if (req.isAuthenticated()) {
    isAdmin = req.user.isAdmin;
  } else {
    isAdmin = false;
  }
  const userItemCart = await Cart.find({ user: userId });
  let userFav = await User.findOne({ _id: userId });
  userFav = userFav ? userFav.fav.length : "";

  let ad = await Ad.findOne({}).populate("user");

  if (userItemCart[0]) {
    cartCount = userItemCart[0].totalQty;
  } else {
    cartCount = 0;
  }

  let hero = await Hero.findOne({});
  let address = await Address.findOne({});

  res.render("home/register", {
    ad,
    userFav,
    hero,
    address,
    cartCount,
    LoggedIn: req.isAuthenticated(),
    isAdmin,
  });
});

router.get("/login", async (req, res) => {
  let isAdmin;
  if (req.isAuthenticated()) {
    isAdmin = req.user.isAdmin;
  } else {
    isAdmin = false;
  }
  const userItemCart = await Cart.find({ user: userId });
  let userFav = await User.findOne({ _id: userId });
  userFav = userFav ? userFav.fav.length : "";
  let ad = await Ad.findOne({}).populate("user");

  if (userItemCart[0]) {
    cartCount = userItemCart[0].totalQty;
  } else {
    cartCount = 0;
  }

  let hero = await Hero.findOne({});
  let address = await Address.findOne({});

  res.render("home/login", {
    LoggedIn: req.isAuthenticated(),
    ad,
    userFav,
    hero,
    address,
    cartCount,
    isAdmin,
  });
});

router.post("/login", async (req, res, next) => {
  try {
    passport.authenticate("local", {
      successRedirect:req.session.currentUrl?req.session.currentUrl:"/shop",
      successFlash: true,
      failureRedirect: "/users/login",
      failureFlash: true,
    })(req, res, next);
    
  } catch (e) {
    console.log(e);
  }
});

router.get("/forgot", async (req, res) => {
  
  try {
    let isAdmin;
    if (req.isAuthenticated()) {
      isAdmin = req.user.isAdmin;
    } else {
      isAdmin = false;
    }
    const userItemCart = await Cart.find({ user: userId });
    let userFav = await User.findOne({ _id: userId });
    userFav = userFav ? userFav.fav.length : "";

    let ad = await Ad.findOne({}).populate("user");

    if (userItemCart[0]) {
      cartCount = userItemCart[0].totalQty;
    } else {
      cartCount = 0;
    }

    let hero = await Hero.findOne({});
    let address = await Address.findOne({});

    res.render("home/forgot", {
      LoggedIn: req.isAuthenticated(),
      ad,
      userFav,
      hero,
      address,
      cartCount,
      isAdmin,
    });
  } catch (e) {}
});

router.post("/forgot", async (req, res, next) => {
  try {
    const { email } = req.body;

    let errors = [];
    // console.log(name,email,password,passwordConfirm)
    const validation = new Validator(
      {
        email: email,
      },
      {
        email: "required",
      }
    );

    if (validation.fails()) {
      let isAdmin;
      if (req.isAuthenticated()) {
        isAdmin = req.user.isAdmin;
      } else {
        isAdmin = false;
      }
      const userItemCart = await Cart.find({ user: userId });
      let userFav = await User.findOne({ _id: userId });
      userFav = userFav ? userFav.fav.length : "";

      let ad = await Ad.findOne({}).populate("user");

      if (userItemCart[0]) {
        cartCount = userItemCart[0].totalQty;
      } else {
        cartCount = 0;
      }

      let hero = await Hero.findOne({});
      let address = await Address.findOne({});
      const errEmail = validation.errors.get("email");
      errors.push(errEmail);
      res.render("home/forgot", {
        LoggedIn: req.isAuthenticated(),
        ad,
        userFav,
        hero,
        address,
        cartCount,
        isAdmin,
        errors,
      });
    }
    validation.passes(async () => {
      // console.log(email)
      async.waterfall([
        function (done) {
          crypto.randomBytes(20, function (err, buf) {
            var token = buf.toString("hex");
            done(err, token);
          });
        },
      //yo
        function (token, done) {
          User.findOne({ email: req.body.email }, function (err, user) {
            if (!user) {
              req.flash(
                "error_msg",
                "No account with that email address exists."
              );
              return res.redirect("/users/forgot");
            }
            //creating or overwriting on the user schema's  resetPasswordToken property
            user.resetPasswordToken = token;
            user.resetPasswordExpires = Date.now() + 1800000; // 30 Minutes

            user.save(function (err) {
              done(err, token, user);
            });
          });
        },
        async function (token, user, done) {
          let hero = await Hero.findOne({});

          const mail = `You are receiving this e-mail from us because you (or someone else) have requested to reset the password for your account. Please click on the following link, or paste this into your browser to complete the process. 
          If you did not request this, please ignore this e-mail and your password 
        will remain unchanged.This link is only valid 30 minutes from now 
        and will be void after 30 minutes.RESET PASSWORD LINK

        http://${req.headers.host}/users/reset/${token} Regards,${
            hero ? hero.name : ""
          }`;

          // console.log(msg)
          const msg = {
            to: `${user.email}`,
            from: `developersavenue@gmail.com`,
            subject: `Email Reset Email From ${hero ? hero.name : ""}`,

            html: `<html>
        <head>
      </head>
      <body style="">
      ${mail}
            </body>
        </html>`,
          };

          sgMail.setApiKey(sendGridApiKey);

          sgMail.send(msg).then(() => {
            console.log("Mail sent........");
            req.flash(
              "success_msg",
              "A reset password link has been sent to your email,check your mail box!!"
            );
            res.redirect("/users/forgot");
          });
        },
      ]);
    });
  } catch (e) {}
});

//If the user taps on the reset password link
router.get("/reset/:token", async function (req, res) {
  try {
    let isAdmin;
    if (req.isAuthenticated()) {
      isAdmin = req.user.isAdmin;
    } else {
      isAdmin = false;
    }
    const userItemCart = await Cart.find({ user: userId });
    let userFav = await User.findOne({ _id: userId });
    userFav = userFav ? userFav.fav.length : "";

    let ad = await Ad.findOne({}).populate("user");

    if (userItemCart[0]) {
      cartCount = userItemCart[0].totalQty;
    } else {
      cartCount = 0;
    }

    let hero = await Hero.findOne({});
    let address = await Address.findOne({});
    await User.findOne(
      {
        resetPasswordToken: req.params.token,
        resetPasswordExpires: { $gt: Date.now() },
      },
      function (err, user) {
        if (!user) {
          req.flash(
            "error_msg",
            "Password reset link is invalid or has expired."
          );
          return res.redirect("/users/forgot");
        }
        res.render("home/resetsuccess", {
          user: user.resetPasswordToken,
          LoggedIn: req.isAuthenticated(),
          ad,
          userFav,
          hero,
          address,
          cartCount,
          isAdmin,
          token:req.params.token
        });
      }
    );
  } catch (e) {}
});

router.post("/reset/:token", async function (req, res) {
  let isAdmin;
  let token=req.params.token
  if (req.isAuthenticated()) {
    isAdmin = req.user.isAdmin;
  } else {
    isAdmin = false;
  }
  const userItemCart = await Cart.find({ user: userId });
  let userFav = await User.findOne({ _id: userId });
  userFav = userFav ? userFav.fav.length : "";

  let ad = await Ad.findOne({}).populate("user");

  if (userItemCart[0]) {
    cartCount = userItemCart[0].totalQty;
  } else {
    cartCount = 0;
  }

  let hero = await Hero.findOne({});
  let address = await Address.findOne({});
  const { passwordConfirm } = req.body;
  const { password } = req.body;
  let errors = [];
  if (password != passwordConfirm || password.length < 10) {
    errors.push(
      "Password Did Not Match or Your password digits is less than 10 characters,Please Try Again(Please check also if any field was left blank)"
    );
    return res.render("home/resetsuccess", {
      errors,
      LoggedIn: req.isAuthenticated(),
      ad,
      userFav,
      hero,
      address,
      cartCount,
      isAdmin,
      token
    });
  }
  async.waterfall(
    [
      function (done) {
        User.findOne(
          {
            resetPasswordToken: req.params.token,
            resetPasswordExpires: { $gt: Date.now() },
          },
          async function (err, user) {
            if (!user) {
              req.flash(
                "error_msg",
                "Password reset token is invalid or has expired."
              );
              return res.redirect("/users/forgot");
            }
            user.password = password;
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;
            await user.save();
            req.flash("success_msg","Password successfully changed!")
            res.redirect("/users/login");
          }
        );
      },
    ],
    function (err) {
      res.redirect("/users/forgot");
    }
  );
});

module.exports = router;
