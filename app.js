require("dotenv").config();
const express = require("express");
const app = express();
const path = require("path");
const methodOverride = require("method-override");
const port = process.env.PORT || 3000;
const flash = require("connect-flash");
const session = require("express-session");
const ejs = require("ejs");
const mongoose = require("mongoose");
const uploader = require("express-fileupload");
const favicon = require("serve-favicon");
const cookieParser = require("cookie-parser");
const async = require("async");
const morgan = require("morgan");
var MongoStore = require("connect-mongo");

app.get("/sitemap.xml", function (req, res) {
  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
            http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
    <!-- created with Free Online Sitemap Generator www.xml-sitemaps.com -->


    <url>
        <loc>https://yuta-mart.com/</loc>
        <lastmod>2021-07-25T15:36:45+00:00</lastmod>
        <priority>1.00</priority>
    </url>
    <url>
        <loc>https://yuta-mart.com/users/register</loc>
        <lastmod>2021-07-25T15:36:45+00:00</lastmod>
        <priority>0.80</priority>
    </url>
    <url>
        <loc>https://yuta-mart.com/favourites</loc>
        <lastmod>2021-07-25T15:36:45+00:00</lastmod>
        <priority>0.80</priority>
    </url>
    <url>
        <loc>https://yuta-mart.com/my-cart</loc>
        <lastmod>2021-07-25T15:36:45+00:00</lastmod>
        <priority>0.80</priority>
    </url>
    <url>
        <loc>https://yuta-mart.com/shop</loc>
        <lastmod>2021-07-25T15:36:45+00:00</lastmod>
        <priority>0.80</priority>
    </url>
    <url>
        <loc>https://yuta-mart.com/shipping</loc>
        <lastmod>2021-07-25T15:36:45+00:00</lastmod>
        <priority>0.80</priority>
    </url>
    <url>
        <loc>https://yuta-mart.com/contact</loc>
        <lastmod>2021-07-25T15:36:45+00:00</lastmod>
        <priority>0.80</priority>
    </url>
    <url>
        <loc>https://yuta-mart.com/about</loc>
        <lastmod>2021-07-25T15:36:45+00:00</lastmod>
        <priority>0.80</priority>
    </url>
    <url>
        <loc>https://yuta-mart.com/users/login</loc>
        <lastmod>2021-07-25T15:36:45+00:00</lastmod>
        <priority>0.80</priority>
    </url>
    <url>
        <loc>https://yuta-mart.com/shop/books/</loc>
        <lastmod>2021-07-25T15:36:45+00:00</lastmod>
        <priority>0.80</priority>
    </url>
    <url>
        <loc>https://yuta-mart.com/shop/classy-watches/</loc>
        <lastmod>2021-07-25T15:36:45+00:00</lastmod>
        <priority>0.80</priority>
    </url>
    <url>
        <loc>https://yuta-mart.com/shop/combats/</loc>
        <lastmod>2021-07-25T15:36:45+00:00</lastmod>
        <priority>0.80</priority>
    </url>
    <url>
        <loc>https://yuta-mart.com/shop/electronics/</loc>
        <lastmod>2021-07-25T15:36:45+00:00</lastmod>
        <priority>0.80</priority>
    </url>
    <url>
        <loc>https://yuta-mart.com/shop/furniture/</loc>
        <lastmod>2021-07-25T15:36:45+00:00</lastmod>
        <priority>0.80</priority>
    </url>
    <url>
        <loc>https://yuta-mart.com/shop/kids/</loc>
        <lastmod>2021-07-25T15:36:45+00:00</lastmod>
        <priority>0.80</priority>
    </url>
    <url>
        <loc>https://yuta-mart.com/shop/men-s-jeans/</loc>
        <lastmod>2021-07-25T15:36:45+00:00</lastmod>
        <priority>0.80</priority>
    </url>
    <url>
        <loc>https://yuta-mart.com/shop/phones/</loc>
        <lastmod>2021-07-25T15:36:45+00:00</lastmod>
        <priority>0.80</priority>
    </url>
    <url>
        <loc>https://yuta-mart.com/shop/slippers/</loc>
        <lastmod>2021-07-25T15:36:45+00:00</lastmod>
        <priority>0.80</priority>
    </url>
    <url>
        <loc>https://yuta-mart.com/shop/sneakers/</loc>
        <lastmod>2021-07-25T15:36:45+00:00</lastmod>
        <priority>0.80</priority>
    </url>
    <url>
        <loc>https://yuta-mart.com/shop/t-shirts/</loc>
        <lastmod>2021-07-25T15:36:45+00:00</lastmod>
        <priority>0.80</priority>
    </url>
    <url>
        <loc>https://yuta-mart.com/shop/women-corner/</loc>
        <lastmod>2021-07-25T15:36:45+00:00</lastmod>
        <priority>0.80</priority>
    </url>
    <url>
        <loc>https://yuta-mart.com/offItems</loc>
        <lastmod>2021-07-25T15:36:45+00:00</lastmod>
        <priority>0.80</priority>
    </url>
    <url>
        <loc>https://yuta-mart.com/shop/books</loc>
        <lastmod>2021-07-25T15:36:45+00:00</lastmod>
        <priority>0.64</priority>
    </url>
    <url>
        <loc>https://yuta-mart.com/shop/classy-watches</loc>
        <lastmod>2021-07-25T15:36:45+00:00</lastmod>
        <priority>0.64</priority>
    </url>
    <url>
        <loc>https://yuta-mart.com/shop/combats</loc>
        <lastmod>2021-07-25T15:36:45+00:00</lastmod>
        <priority>0.64</priority>
    </url>
    <url>
        <loc>https://yuta-mart.com/shop/electronics</loc>
        <lastmod>2021-07-25T15:36:45+00:00</lastmod>
        <priority>0.64</priority>
    </url>
    <url>
        <loc>https://yuta-mart.com/shop/furniture</loc>
        <lastmod>2021-07-25T15:36:45+00:00</lastmod>
        <priority>0.64</priority>
    </url>
    <url>
        <loc>https://yuta-mart.com/shop/kids</loc>
        <lastmod>2021-07-25T15:36:45+00:00</lastmod>
        <priority>0.64</priority>
    </url>
    <url>
        <loc>https://yuta-mart.com/shop/men-s-jeans</loc>
        <lastmod>2021-07-25T15:36:45+00:00</lastmod>
        <priority>0.64</priority>
    </url>
    <url>
        <loc>https://yuta-mart.com/shop/phones</loc>
        <lastmod>2021-07-25T15:36:45+00:00</lastmod>
        <priority>0.64</priority>
    </url>
    <url>
        <loc>https://yuta-mart.com/shop/slippers</loc>
        <lastmod>2021-07-25T15:36:45+00:00</lastmod>
        <priority>0.64</priority>
    </url>
    <url>
        <loc>https://yuta-mart.com/shop/sneakers</loc>
        <lastmod>2021-07-25T15:36:45+00:00</lastmod>
        <priority>0.64</priority>
    </url>
    <url>
        <loc>https://yuta-mart.com/shop/t-shirts</loc>
        <lastmod>2021-07-25T15:36:45+00:00</lastmod>
        <priority>0.64</priority>
    </url>
    <url>
        <loc>https://yuta-mart.com/shop/women-corner</loc>
        <lastmod>2021-07-25T15:36:45+00:00</lastmod>
        <priority>0.64</priority>
    </url>
    <url>
        <loc>https://yuta-mart.com/shop-product/fashion-quality-slim-fit-men-s-jeans/</loc>
        <lastmod>2021-07-25T15:36:45+00:00</lastmod>
        <priority>0.64</priority>
    </url>
    <url>
        <loc>https://yuta-mart.com/shop-product/fashion-quality-slim-fit-men-s-jeans</loc>
        <lastmod>2021-07-25T15:36:45+00:00</lastmod>
        <priority>0.64</priority>
    </url>
    <url>
        <loc>https://yuta-mart.com/shop-product/original-lacoste-t-shirts/</loc>
        <lastmod>2021-07-25T15:36:45+00:00</lastmod>
        <priority>0.64</priority>
    </url>
    <url>
        <loc>https://yuta-mart.com/shop-product/original-lacoste-t-shirts</loc>
        <lastmod>2021-07-25T15:36:45+00:00</lastmod>
        <priority>0.64</priority>
    </url>
    <url>
        <loc>https://yuta-mart.com/shop-product/modern-fashion-designer-palm-angels-round-neck-shirt/</loc>
        <lastmod>2021-07-25T15:36:45+00:00</lastmod>
        <priority>0.64</priority>
    </url>
    <url>
        <loc>https://yuta-mart.com/shop-product/modern-fashion-designer-palm-angels-round-neck-shirt</loc>
        <lastmod>2021-07-25T15:36:45+00:00</lastmod>
        <priority>0.64</priority>
    </url>
    <url>
        <loc>https://yuta-mart.com/shop-product/casio-watch-wooden-designer-watch/</loc>
        <lastmod>2021-07-25T15:36:45+00:00</lastmod>
        <priority>0.64</priority>
    </url>
    <url>
        <loc>https://yuta-mart.com/shop-product/casio-watch-wooden-designer-watch</loc>
        <lastmod>2021-07-25T15:36:45+00:00</lastmod>
        <priority>0.64</priority>
    </url>
    <url>
        <loc>https://yuta-mart.com/shop-product/men-s-slim-fit-louis-vuitton-fashion-jeans/</loc>
        <lastmod>2021-07-25T15:36:45+00:00</lastmod>
        <priority>0.64</priority>
    </url>
    <url>
        <loc>https://yuta-mart.com/shop-product/men-s-slim-fit-louis-vuitton-fashion-jeans</loc>
        <lastmod>2021-07-25T15:36:45+00:00</lastmod>
        <priority>0.64</priority>
    </url>
    <url>
        <loc>https://yuta-mart.com/shop-product/fashion-branded-palm-angels-round-neck-shirt/</loc>
        <lastmod>2021-07-25T15:36:45+00:00</lastmod>
        <priority>0.64</priority>
    </url>
    <url>
        <loc>https://yuta-mart.com/shop-product/fashion-branded-palm-angels-round-neck-shirt</loc>
        <lastmod>2021-07-25T15:36:45+00:00</lastmod>
        <priority>0.64</priority>
    </url>
    <url>
        <loc>https://yuta-mart.com/shop-product/men-s-fashion-casual-outfit-men-s-wear/</loc>
        <lastmod>2021-07-25T15:36:45+00:00</lastmod>
        <priority>0.64</priority>
    </url>
    <url>
        <loc>https://yuta-mart.com/shop-product/men-s-fashion-casual-outfit-men-s-wear</loc>
        <lastmod>2021-07-25T15:36:45+00:00</lastmod>
        <priority>0.64</priority>
    </url>
    <url>
        <loc>https://yuta-mart.com/shop-product/mba-lakers-quality-shirts/</loc>
        <lastmod>2021-07-25T15:36:45+00:00</lastmod>
        <priority>0.64</priority>
    </url>
    <url>
        <loc>https://yuta-mart.com/shop-product/mba-lakers-quality-shirts</loc>
        <lastmod>2021-07-25T15:36:45+00:00</lastmod>
        <priority>0.64</priority>
    </url>
    <url>
        <loc>https://yuta-mart.com/shop-product/quality-jeans-fit-for-men-casual-outfit-for-men/</loc>
        <lastmod>2021-07-25T15:36:45+00:00</lastmod>
        <priority>0.64</priority>
    </url>
    <url>
        <loc>https://yuta-mart.com/shop-product/quality-jeans-fit-for-men-casual-outfit-for-men</loc>
        <lastmod>2021-07-25T15:36:45+00:00</lastmod>
        <priority>0.64</priority>
    </url>
    <url>
        <loc>https://yuta-mart.com/shop-product/men-s-slim-fit-louis-vuitton-jeans/</loc>
        <lastmod>2021-07-25T15:36:45+00:00</lastmod>
        <priority>0.64</priority>
    </url>
    <url>
        <loc>https://yuta-mart.com/shop-product/men-s-slim-fit-louis-vuitton-jeans</loc>
        <lastmod>2021-07-25T15:36:45+00:00</lastmod>
        <priority>0.64</priority>
    </url>
    <url>
        <loc>https://yuta-mart.com/shop?page=2</loc>
        <lastmod>2021-07-25T15:36:45+00:00</lastmod>
        <priority>0.64</priority>
    </url>
    <url>
        <loc>https://yuta-mart.com/users/forgot</loc>
        <lastmod>2021-07-25T15:36:45+00:00</lastmod>
        <priority>0.64</priority>
    </url>
    <url>
        <loc>https://yuta-mart.com/shop-product/original-polo-t-shirt-ralph-lauren/</loc>
        <lastmod>2021-07-25T15:36:45+00:00</lastmod>
        <priority>0.64</priority>
    </url>
    <url>
        <loc>https://yuta-mart.com/shop-product/lacoste-long-hand-top/</loc>
        <lastmod>2021-07-25T15:36:45+00:00</lastmod>
        <priority>0.64</priority>
    </url>
    <url>
        <loc>https://yuta-mart.com/shop-product/original-polo-t-shirt-ralph-lauren</loc>
        <lastmod>2021-07-25T15:36:45+00:00</lastmod>
        <priority>0.51</priority>
    </url>
    <url>
        <loc>https://yuta-mart.com/shop-product/lacoste-long-hand-top</loc>
        <lastmod>2021-07-25T15:36:45+00:00</lastmod>
        <priority>0.51</priority>
    </url>
    <url>
        <loc>https://yuta-mart.com/shop?page=1</loc>
        <lastmod>2021-07-25T15:36:45+00:00</lastmod>
        <priority>0.51</priority>
    </url>


</urlset>`);
});
// app.set('trust proxy', true);

// const dbUrI =process.env.NODE_ENV === "production"? "mongodb://localhost:27017/ehop-update": "mongodb+srv://zaid:zaid@cluster0.eee4x.mongodb.net/e-shop?retryWrites=true&w=majority";
const dbUrI ="mongodb://localhost:27017/eshop-update"

app.enable("trust proxy"); // trust all

// app.use(morgan("tiny"));
const passport = require("passport");
require("./config/passport")(passport);

//db connection
mongoose
  .connect(dbUrI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then((connected) => {
    console.log("db connected");
  })
  .catch((err) => {
    console.log(err);
  });

// express-fileupload middleware
app.use(
  uploader({
    useTempFiles: true,
  })
);

//body Parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// app.use(cookieParser());

// flash message
app.use(flash());

//static files
app.use(express.static(path.join(__dirname, "public")));
// favicon

// app.use(favicon('favicon.ico'));

//method override to be used for sending put requests
app.use(methodOverride("_method"));

//cookieParser() should always come before session!
app.use(cookieParser());

//view engine
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.set(express.static(path.join(__dirname, "public")));

//force http redirects to https(used only in production)
function requireHTTPS(req, res, next) {
  // The 'x-forwarded-proto' check is for Heroku
  if (
    !req.secure &&
    req.get("x-forwarded-proto") !== "https" &&
    process.env.NODE_ENV !== "development"
  ) {
    return res.redirect("https://" + req.get("host") + req.url);
  }
  next();
}
if (process.env.NODE_ENV === "production") {
  app.use(requireHTTPS);
}

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,

    //session expires after 3 hours
    cookie: { maxAge: 60 * 1000 * 60 * 3 },
    store: MongoStore.create({
      mongoUrl: dbUrI,
    }),
  })
);

// This should alwayse between session and flash
app.use(passport.initialize());
app.use(passport.session());

// app.enable("trust proxy")

// declaring local variables for displaying FLASH messages
app.use((req, res, next) => {
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  res.locals.error = req.flash("error");
  res.locals.user = req.user || null;
  res.locals.errors = req.flash("errors");
  res.locals.stockErr = req.flash("stockErr");

  next();
});

//routes
const homeRoutes = require("./routes/home/index");
const adminRoutes = require("./routes/admin/index");
const userRoutes = require("./routes/home/user");
const googleFbAuthRoute = require("./routes/auth");

//route usages
app.use("/auth", googleFbAuthRoute);

app.use("/admin", adminRoutes);
app.use("/users", userRoutes);
app.use("/", homeRoutes);

// app.get('*',(req,res,next)=>{
//   // res.render('admin/page404')
//   console.log("yoh")
// })
app.listen(port, () => {
  console.log(`server running on port ${port}`);
});
//app.js
//Yooooooooooo
