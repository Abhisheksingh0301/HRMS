var express = require("express");
var os = require('os');
// var PassoutModel = require("../schema/passout");
// var TranscriptModel = require("../schema/transcript");
var EmpMstModel = require("../schema/emp_master");
var LeaveMstModel = require("../schema/leave_master");
var HolidayMstModel = require("../schema/holiday_master");
var moment = require('moment');
var climate = require('city-weather');
const { ObjectId } = require("mongodb");
var pincode = require('pincode');
const res = require("express/lib/response");
const { request } = require("http");
const urls = require('url');
const { url } = require("inspector");
const { stat } = require("fs");
var router = express.Router();
var ObjectID = require('mongodb').ObjectID;

// var pssm = PassoutModel.find({});
// var trn = TranscriptModel.find({});
/* GET index page */
router.get("/", function (req, res, next) {
  res.render("index", { title: "Introduction page" })
});
// var express = require('express');
// var TranscriptModel = require("../schema/transcript");
// var router = express.Router();

/* GET home page. */
// router.get("/", function (req, res, next) {
//   TranscriptModel.find({ verificationdate: null, dispatchdt: null }).count(function (err, entdata) {
//     if (err) {
//       console.log(err);
//     } else {
//       TranscriptModel.find({ verificationdate: { $ne: null }, dispatchdt: null }).count(function (err, verdata) {
//         if (err) {
//           console.log(err);
//         } else {
//           TranscriptModel.find({ verificationdate: { $ne: null }, dispatchdt: { $ne: null } }).count(function (err, totdata) {
//             if (err) {
//               console.log(err);
//             } else {
//               TranscriptModel.find().count(function (err, ttcnt) {
//                 if (err) {
//                   console.log(err);
//                 } else {
//                   TranscriptModel.aggregate([{$group:{_id:null,sum_val:{$sum:"$payamt"}}}],function(err,amt){
//                   res.render("index", {
//                     title: "Transcript management system", dueverification: entdata, duedispatch: verdata, dispdone: totdata,
//                     totalcnt: ttcnt, headertext: "Welcome to the summary page", totamt:amt
//                   });
//                 });
//                 }
//               })
//             }
//           })
//         }
//       })
//     }
//   })
// });
 module.exports = router;
