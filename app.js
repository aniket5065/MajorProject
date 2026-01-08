// app.js

const express = require('express');
const app = express();
const mongoose = require('mongoose');
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require('ejs-mate');
const ExpressError = require('./utils/ExpressError.js');

const session = require("express-session");
const MongoStore = require('connect-mongo');
const flash = require("connect-flash");

const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");

// Routes
const listingsRouter = require("./routes/listing.js");
const reviewsRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");

// --------------------- DATABASE CONNECTION (LOCAL MONGODB) ---------------------
const dbUrl = "mongodb://127.0.0.1:27017/tripconnect";  // Your DB name (change if you want)

async function main() {
    await mongoose.connect(dbUrl);
}

main()
    .then(() => console.log("✅ Connected to Local MongoDB (tripconnect)"))
    .catch(err => console.log("❌ MongoDB Connection Error:", err));

// --------------------- VIEW ENGINE & MIDDLEWARE SETUP ---------------------
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "public")));  // For CSS, JS, uploads folder

// --------------------- SESSION STORE (Sessions saved in MongoDB) ---------------------
const store = MongoStore.create({
    mongoUrl: dbUrl,                    // Required for connect-mongo
    secret: process.env.SECRET || "mysecretkey123",  // Fallback if .env missing
    touchAfter: 24 * 3600               // Update session only once per day
});

store.on("error", (err) => {
    console.log("🚨 SESSION STORE ERROR:", err);
});

const sessionOptions = {
    store: store,
    secret: process.env.SECRET || "mysecretkey123",
    resave: false,
    saveUninitialized: true,            // Fixed typo: was saveUniitialized
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true
    }
};

// --------------------- MIDDLEWARE ---------------------
app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Flash messages & current user in locals
app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
});

// --------------------- ROUTES ---------------------
app.get("/", (req, res) => {
    res.redirect("/listings");
});

app.use("/listings", listingsRouter);
app.use("/listings/:id/reviews", reviewsRouter);
app.use("/", userRouter);

// --------------------- ERROR HANDLER ---------------------
app.use((err, req, res, next) => {
    const { statusCode = 500, message = "Something went wrong" } = err;
    res.status(statusCode).render("layouts/error.ejs", { statusCode, message, err });
});

// --------------------- START SERVER ---------------------
app.listen(8080, () => {
    console.log("🚀 Server is listening on http://localhost:8080");
});