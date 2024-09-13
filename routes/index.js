var express = require("express");
var os = require('os');

var EmpMstModel = require("../schema/emp_master");
var LeaveMstModel = require("../schema/leave_master");
var HolidayMstModel = require("../schema/holiday_master");
var moment = require('moment');
const { ObjectId } = require("mongodb");
var pincode = require('pincode');
const res = require("express/lib/response");
const { request } = require("http");
const urls = require('url');
const { url } = require("inspector");
const { stat } = require("fs");
var router = express.Router();


/* GET index page */
router.get("/", function (req, res, next) {
  res.render("index", { title: "Introduction page" })
});

 module.exports = router;
