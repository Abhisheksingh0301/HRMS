var express = require("express");
var os = require('os');

var EmpMstModel = require("../schema/emp_master");
var LeaveMstModel = require("../schema/leave_master");
var HolidayMstModel = require("../schema/holiday_master");
const LogModel = require("../schema/login");
var moment = require('moment');
const { ObjectId } = require("mongodb");
var pincode = require('pincode');
const res = require("express/lib/response");
const { request } = require("http");
const urls = require('url');
const { url } = require("inspector");
const { stat } = require("fs");
var router = express.Router();
var authMiddleware = require("../routes/middleware/auth");  //added on 13-9-24



/* GET index page */
router.get("/", authMiddleware, function (req, res, next) {
  req.session.userId = req.body.txtuser;
  // const Loglist=LogModel.find().sort({"emp_name":1});
   //res.render('login',{title:"Login form",userId: req.session.userId, empdata:Loglist});
   res.render("index", { title: "Introduction page", userId: req.session.userId });
   //res.redirect('/');


});

module.exports = router;
