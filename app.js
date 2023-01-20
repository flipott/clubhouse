const express = require("express");
const { body, validationResult } = require('express-validator');
const path = require("path");
const session = require("express-session");
const dotenv = require('dotenv').config();
const passport = require("passport");
const flash = require("express-flash");
const LocalStrategy = require("passport-local").Strategy;
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const bcrypt = require("bcryptjs");
const User = require("./models/user");
const Post = require("./models/post");


const mongoDb = process.env.DB;
mongoose.connect(mongoDb, { useUnifiedTopology: true, useNewUrlParser: true });
const db = mongoose.connection;
db.on("error", console.error.bind(console, "Mongo connection error"));

const app = express();
app.set("views", __dirname + "/views");
app.set("view engine", "ejs");

app.use(session({ secret: process.env.SECRET, resave: false, saveUninitialized: true }));
app.use(flash());

passport.use(
    new LocalStrategy({
        passReqToCallback: true
    },
    (req, username, password, done) => {
        User.findOne({ username: username }, (err, user) => {
            if (err) {
                return done(err);
            }
            if (!user) {
                return done(null, false, req.flash("message", "Incorrect username"));
            }
            bcrypt.compare(password, user.password, (err, res) => {
                if (res) {
                    return done(null, user);
                } else {
                    return done(null, false, req.flash("message", "Incorrect password"));
                }
            });
            // return done(null, user);
        });
    })
);

passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
        done(err, user);
    });
});

app.use(passport.initialize());
app.use(passport.session());
app.use(express.urlencoded({ extended: false }));

app.get("/", async (req, res, next) => {
    const displayMessage = req.flash("message");
    req.flash("message", null);

    try {
        Post.find({}, (err, results) => {
            if (err) {
                return next(err);
            }
            console.log(typeof(results));
            res.render("index", { user: req.user, message: displayMessage, posts: results });
        });
    } catch(err) {
        res.render("index", { user: req.user, message: displayMessage, posts: null });
    }
});

app.get("/log-in", (req, res, next) => {
    const displayMessage = req.flash("message");
    req.flash("message", null);
    res.render("log-in", { message: displayMessage });
});

app.get("/sign-up", (req, res, next) => {
    const displayMessage = req.flash("message");
    req.flash("message", null);
    res.render("sign-up", { message: displayMessage });
});

app.get("/new", (req, res, next) => {
    res.render("new-post");
});

app.post("/sign-up", 
        body('username').not().isEmpty().trim().escape(),
        body('password').not().isEmpty(),
        (req, res, next) => {
                // Passwords don't match
                if (req.body.password !== req.body["confirm-password"]) {
                    req.flash("message", "Passwords do not match");
                    return res.redirect("/sign-up");
                }

                bcrypt.hash(req.body.password, 10, (err, hashedPassword) => {
                    if (err) {
                        return next(err);
                    }
                    // Check to see if user exists
                    User.find({username: req.body.username}, (err, results) => {
                        if (err) {
                            return next(err);
                        }
                        if (results.length) {
                            req.flash("message", "Username already exists");
                            return res.redirect("/sign-up");
                        } else {
                            // If user doesn't exist, create one
                            const user = new User({
                                username: req.body.username,
                                password: hashedPassword
                            }).save(err => {
                                if (err) {
                                    return next(err);
                                }
                                res.redirect("/");
                            });
                        }
                    });
                });
});

app.post("/log-in",
    passport.authenticate("local", {
        successRedirect: "/",
        failureRedirect: "/log-in"
    })
);

app.get("/log-out", (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        req.flash("message", "You have been successfully logged out.");
        res.redirect("/");
    });
});

app.get("/new-post", (req, res, next) => {
    const displayMessage = req.flash("message");
    req.flash("message", null);
    res.render("new-post", { user: req.user, message: displayMessage });
})

app.post(
    "/new-post", 
    body('title').not().isEmpty().trim().escape(),
    body('body').not().isEmpty().trim().escape(),
    (req, res, next) => {
        const errors = (validationResult(req));
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const post = new Post({
            title: req.body.title,
            body: req.body.body,
            timestamp: new Date(),
            username: req.user.username
        }).save(err => {
            if (err) {
                return next(err);
            }
            res.redirect("/");
        });
})

app.listen(3000, () => console.log("Listening on Port 3000."));