const express = require("express");
const path = require("path");
const session = require("express-session");
const dotenv = require('dotenv').config();
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const mongoDb = process.env.DB;
mongoose.connect(mongoDb, { useUnifiedTopology: true, useNewUrlParser: true });
const db = mongoose.connection;
db.on("error", console.error.bind(console, "Mongo connection error"));

const app = express();
app.set("views", __dirname);
app.set("view engine", "ejs");

app.use(session({ secret: process.env.SECRET, resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.urlencoded({ extended: false }));

app.listen(3000, () => console.log("Listening on Port 3000."));