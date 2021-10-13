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
    let { email } = req.body;
    let user = await User.findOne({ email: email });

    if (user) {
      passport.authenticate("local", {
        successRedirect:
          user.isAdmin == true
            ? "/admin"
            : req.session.currentUrl
            ? req.session.currentUrl
            : "/shop",

        successFlash: true,
        failureRedirect: "/users/login",
        failureFlash: true,
      })(req, res, next);
    } else {
      req.flash("error_msg", "please register");
      res.redirect("/users/register");
    }
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

          let protocol =
            process.env.NODE_ENV === "production" ? "https" : "http";
          const resetUrl = `${protocol}://${req.headers.host}/users/reset/${token}`;
          let support_url = `${protocol}://${req.headers.host}/contact`;
          // console.log(msg)
          const msg = {
            to: `${user.email}`,
            from: `developersavenue@gmail.com`,
            subject: `${hero ? hero.name : ""} Email Reset `,

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
                  color: #85878E;
                  font-size: 12px;
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
                <span class="preheader">Use this link to reset your password. The link is only valid for 24 hours.</span>
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
                                    <h1>Hi ${user.name},</h1>
                                    <p>
                                      You are receiving this e-mail from us because you (or someone else) have requested to reset the password for your account. Please click on the following link, or paste this into your browser to complete the process. 
                     If you did not request this, please ignore this e-mail and your password 
                     will remain unchanged
                                      <strong>This link is only valid 30 minutes from now 
                                       and will be void after 30 minutes.</strong></p>
                                    <!-- Action -->
                                    <table class="body-action" align="center" width="100%" cellpadding="0" cellspacing="0" role="presentation">
                                      <tr>
                                        <td align="center">
                                          <!-- Border based button
                       https://litmus.com/blog/a-guide-to-bulletproof-buttons-in-email-design -->
                                          <table width="100%" border="0" cellspacing="0" cellpadding="0" role="presentation">
                                            <tr>
                                              <td align="center">
                                                <a href="${resetUrl}" style="color:white" class="f-fallback button" style="" target="_blank">Reset your password</a>
                                              </td>
                                            </tr>
                                          </table>
                                        </td>
                                      </tr>
                                    </table>
                                    <p>For your security,If you did not request a password reset, please ignore this email or <a href="${support_url}">contact support</a> if you have questions.</p>
                                    <p>Thanks,
                                      <br>The Yuta-mart Team</p>
                                    <!-- Sub copy -->
                                    <table class="body-sub" role="presentation">
                                      <tr>
                                        <td>
                                          <p class="f-fallback sub">If you’re having trouble with the button above, copy and paste the URL below into your web browser.</p>
                                          <p class="f-fallback sub">${resetUrl}</p>
                                        </td>
                                      </tr>
                                    </table>
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
                                    Yutamart, Inc
                                    <br>Adehyeɛ Market Kumasi,Opposite zoo.
                                    <br>0245688822.
                                    <br>yutamart1@gmail.com
                                  </p>
                                  <p class="f-fallback sub align-center">&copy; 2021 Yutamart. All rights reserved.</p>

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
          token: req.params.token,
        });
      }
    );
  } catch (e) {}
});

router.post("/reset/:token", async function (req, res) {
  let isAdmin;
  let token = req.params.token;
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
      token,
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
            req.flash("success_msg", "Password successfully changed!");
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
