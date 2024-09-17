var express = require("express");
var os = require('os');
// var PassoutModel = require("../schema/passout");
// var TranscriptModel = require("../schema/transcript");
var EmpMstModel = require("../schema/emp_master");
var LeaveMstModel = require("../schema/leave_master");
var HolidayMstModel = require("../schema/holiday_master");
var AttendanceModel = require("../schema/attendance");
var LogModel = require("../schema/login");
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
var authMiddleware = require("../routes/middleware/auth");  //added on 13-9-24
const { Console } = require("console");
const bcrypt = require('bcrypt');
// var pssm = PassoutModel.find({});
// var trn = TranscriptModel.find({});
/* GET index page */
router.get("/", authMiddleware, function (req, res, next) {
  res.render("index", { title: "Introduction page", userId: req.session.userId });
});

//Get Employees page
router.get("/employees", function (req, res, next) {
  res.render("employees", { title: "Employees page", userId: req.session.userId })
});
//Add new employee
router.post("/addemp/", (req, res) => {
  const str = req.body.empname;
  const rest = str.toUpperCase();
  EmpMstModel.find({ emp_name: req.body.empname }).count(function (err, result) {
    if (err)
      throw err;
    console.log('Total count::::', result);
    if (result > 0) {
      console.log('Duplicate');
      res.render("hi", { title: "Duplicate record", userId: req.session.userId })
    } else {
      const empData = {
        emp_name: rest,
        year_of_joining: req.body.joinyr,
        gender: req.body.cmbGender,
        remarks: req.body.rmrk
      }
      var data = EmpMstModel(empData);
      data.save(function (err) {
        if (err) {
          console.log('error', err);
        } else {
          console.log(empData);
          res.render('emplist', { employeelist: employeelist, title: "Employees list", userId: req.session.userId });
        }
      });
    }

  })
});

//DISPLAY LIST OF EMPLOYEES
router.get('/emplist', authMiddleware, async (req, res) => {
  try {
    // Retrieve and sort the employee list
    const employeelist = await EmpMstModel.find().sort({ emp_name: 1 });

    // Render the employee list view with the retrieved data
    res.render('emplist', {
      employeelist: employeelist,
      title: 'Employees list',
      userId: req.session.userId
    });
  } catch (err) {
    // Log the error and send an appropriate response
    console.error('Error retrieving employee list:', err);
    res.status(500).send('Internal server error');
  }
});



//Get leaves page
router.get('/leaves', authMiddleware, async (req, res, next) => {
  try {
    // Check if the user has the 'admin' role
    const rolecheck = await LogModel.countDocuments({ role: 'admin', emp_name: req.session.fullName });

    if (rolecheck > 0) {
      res.render('leaves', { title: 'Leaves page', userId: req.session.userId });
    } else {
      res.render('hi', { title: 'You are not authorised !!!', userId: req.session.userId });
    }
  } catch (err) {
    console.error('Error checking role:', err);
    res.status(500).send('Internal server error');
  }
});

//Add leave category
router.post("/addlv/", (req, res) => {
  LeaveMstModel.find({ leave_abb: req.body.lvabb }).count(function (err, result) {
    if (err)
      throw err;
    console.log('Total count::::', result);
    if (result > 0) {
      console.log('Duplicate');
      res.render("hi", { title: "Duplicate record", userId: req.session.userId })
    } else {
      const lvData = {
        leave_abb: (req.body.lvabb).toUpperCase(),
        leave_desc: (req.body.lvdesc).toUpperCase(),
        leave_alloted: req.body.lvallot,
        remarks: req.body.lvrmrk
      }
      var data = LeaveMstModel(lvData);
      data.save(function (err) {
        if (err) {
          console.log('error', err);
        } else {
          console.log(lvData);
          res.redirect('../leaves');
        }
      });
    }

  })
});

//DISPLAY LEAVES CATEGORY
router.get('/leavetype', authMiddleware, function (req, res) {
  LeaveMstModel.find(function (err, lvlist) {
    if (err) {
      console.log(err);
    } else {
      res.render('leavetype', { lvlist: lvlist, title: "Leaves category", userId: req.session.userId });
    }
  }).sort({ "leave_abb": 1 });
});

//EDIT EMPLOYEES
router.get('/edit-empl/:id', authMiddleware, function (req, res, next) {
  var id = req.params.id;
  console.log(id);
  var edit = EmpMstModel.findById(id);
  edit.exec(function (err, data) {
    if (err) {
      throw err;
    } else {
      console.log(data);
      res.render('edit-empl', { empdata: data, title: "Edit Employee", userId: req.session.userId });
    }

  })
})

//Edit employee  ::POST method
router.post("/edit-empl", (req, res) => {
  const empData = {
    emp_name: (req.body.empname).toUpperCase(),
    year_of_joining: req.body.joinyr,
    gender: req.body.cmbGender,
    remarks: req.body.rmrk
  }
  console.log(empData);
  var update = EmpMstModel.findByIdAndUpdate(req.body.id, empData);
  update.exec(function (err, result) {
    if (err) {
      console.log('Error');
    } else {
      res.redirect('../emplist');
    }
  });
});
//Leave entry
router.get("/attendance_entry", authMiddleware, (req, res) => {
  EmpMstModel.find(function (err, empdata) {
    if (err) {
      console.log('Error');
    } else {
      LeaveMstModel.find(function (err1, leavedata) {
        if (err1) {
          console.log(err1);
        } else {
          res.render('attendance_entry', { title: "Attendance entry", userId: req.session.userId, leavedata: leavedata, empdata: empdata, attData: "", moment: moment });
        }
      })
    }
  })
})

//ADD ATTENDANCE
router.post("/addatt/", authMiddleware, (req, res) => {
  AttendanceModel.find({ emp_name: req.body.empnm, leave_date: req.body.dt }).count(function (err, result) {
    if (err)
      throw err;
    console.log('Total count::::', result);
    if (result > 0) {
      console.log('Duplicate');
      res.render("hi", { title: "Duplicate record", userId: req.session.userId })
    } else {
      const lvdt = moment(req.body.dt).format('dddd');
      if (lvdt == 'Sunday') {
        res.render("hi", { title: "Selected date is Sunday" })
      } else {
        const attData = {
          emp_name: (req.body.empnm).toUpperCase(),
          leave_type: (req.body.lvcat).toUpperCase(),
          leave_date: req.body.dt
        }
        var data = AttendanceModel(attData);
        data.save(function (err) {
          if (err) {
            console.log('error', err);
          } else {
            EmpMstModel.find(function (err, empdata) {
              if (err) {
                console.log('Error');
              } else {
                LeaveMstModel.find(function (err1, leavedata) {
                  if (err1) {
                    console.log(err1);
                  } else {
                    console.log(attData);

                    res.render('attendance_entry', { title: "Attendance entry", leavedata: leavedata, empdata: empdata, attData: attData, moment: moment, userId: req.session.userId });
                  }
                })
              }
            })
          }
        });
      }
    }
  })
});

//Access report page
router.get('/reports', (req, res) => {

  res.render('reports', { title: "Report page", userId: req.session.userId });
});

//Daily attendance report
router.get('/dailyreport', (req, res) => {
  EmpMstModel.find(function (err, empdata) {
    if (err) {
      console.log(err);
    } else {
      const yr = moment().year();
      console.log(yr);
      res.render('dailyreport', {
        title: "Individual attendance report", empdata: empdata, moment: moment, year: yr,
        userId: req.session.userId
      });
    }
  })
});

//Individual report :: POST menthod
router.post('/individualrpt', (req, res) => {
  const currentdate = new Date();
  const empname = req.body.empnm;
  const stdate = new Date(req.body.stdt);
  const enddate = new Date(req.body.enddt);
  AttendanceModel.aggregate([
    {
      $lookup: {
        from: "leave_masters",
        localField: "leave_type",
        foreignField: "leave_abb",
        as: "Leave"
      }
    },
    { $unwind: "$Leave" },
    {
      $match: { emp_name: empname, leave_date: { $gte: stdate, $lte: enddate } }
    },
    { $sort: { "leave_date": 1 } }
  ], function (err, data) {
    if (err) {
      console.log("Error:", err);
    } else {
      const cnt = data.length;
      res.render('individualreport', {
        heading: "Employee Attendance Report",
        title: empname,
        data: data,
        dept: "COE Office",
        moment: moment,
        stdate: stdate,
        enddate: enddate,
        curdt: currentdate,
        totalRecords: cnt
      });
    }
  });
});


//Summary Report :: Get method
router.get('/summaryreport', authMiddleware, (req, res) => {
  EmpMstModel.find(function (err, empdata) {
    if (err) {
      console.log(err);
    } else {
      const yr = moment().year();
      console.log(yr);
      res.render('summaryreport', { title: "Summarised attendance report", empdata: empdata, moment: moment, year: yr, userId: req.session.userId });
    }
  })
});

//Summary Report ::Post method
router.post('/summaryrpt', (req, res) => {
  const currentdate = new Date();
  const stdate = new Date(req.body.stdt);
  const enddate = new Date(req.body.enddt);
  AttendanceModel.aggregate([
    {
      $lookup: {
        from: "leave_masters",
        localField: "leave_type",
        foreignField: "leave_abb",
        as: "Leave"
      }
    },
    { $unwind: "$Leave" },
    {
      $match: { leave_date: { $gte: stdate, $lte: enddate } }
    },
    {
      $group: {
        _id: {
          emp_name: "$emp_name",
          leave_type: "$Leave.leave_desc"
        },
        totalLeaves: { $sum: 1 } // Count the number of leaves for each employee
      }
    },
    { $sort: { "_id.emp_name": 1, "_id.leave_type": 1 } }
  ], function (err, data) {
    if (err) {
      console.log("Error:", err);
    } else {


      // Transform the data into the desired format
      const pivotTable = data.reduce((acc, record) => {
        const { emp_name, leave_type } = record._id;
        const totalLeaves = record.totalLeaves;

        if (!acc[emp_name]) {
          acc[emp_name] = { emp_name };
        }

        // Set the leave type and total leaves dynamically
        acc[emp_name][`${leave_type}_total_leaves`] = totalLeaves;

        return acc;
      }, {});

      // Convert the object to an array of values
      const pivotTableArray = Object.values(pivotTable);

      // Determine unique leave types from the data
      const leaveTypes = [...new Set(data.map(record => record._id.leave_type))];

      // Ensure each row has columns for all leave types with a default value of 0
      const formattedPivotTable = pivotTableArray.map(row => {
        const formattedRow = { emp_name: row.emp_name };

        leaveTypes.forEach(leaveType => {
          formattedRow[`${leaveType}_total_leaves`] = row[`${leaveType}_total_leaves`] || 0;
        });

        return formattedRow;
      });

      console.log(formattedPivotTable);

      // console.log(data);
      const cnt = data.length;
      res.render('summreport', {
        title: "Summarised Attendance Report",
        data: formattedPivotTable,
        dept: "COE Office",
        moment: moment,
        stdate: stdate,
        enddate: enddate,
        curdt: currentdate,
        totalRecords: cnt
      });
    }
  });
});

//Login Post Form
router.post('/login', async (req, res, next) => {
  try {
    // Find a user with the given emp_name
    const user = await LogModel.findOne({ emp_name: req.body.txtuser });

    // If user is not found or password is incorrect
    if (!user || !(await bcrypt.compare(req.body.txtpwd, user.password))) {
      console.log('Invalid credentials');
      return res.render("hi", { title: "Invalid credentials", userId: req.session.userId });
    }

    // Extract first name from full name
    const namePart = req.body.txtuser.split(" ");
    const firstName = namePart[0];

    // Set session variables
    req.session.userId = firstName;
    req.session.fullName = req.body.txtuser;
    console.log(req.session.userId);

    // Render the introduction page
    res.render("index", { title: "Introduction page", userId: req.session.userId });
  } catch (err) {
    console.log(err);
    // Handle errors appropriately
    return next(err);
  }
});


//Signup get method
router.get('/signup', (req, res) => {
  EmpMstModel.find(function (err, empdata) {
    if (err) {
      console.log(err);
    } else {
      res.render('signup', { title: "Signup page", empdata: empdata, userId: req.session.userId });
    }
  });
})


//Signup post form
router.post('/signup', async (req, res) => {
  try {
    const result = await LogModel.countDocuments({ emp_name: req.body.empname });
    if (result > 0) {
      console.log("Duplicate name");
      res.render('hi', { title: "Duplicate name", userId: req.session.userId });
    } else {
      const logindata = {
        emp_name: req.body.empname,
        password: req.body.txtpwd
      };
      const LogData = new LogModel(logindata);

      //Hash the password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(LogData.password, saltRounds);

      //Set the hashed password
      LogData.password = hashedPassword;

      //Save the new user to the Database
      await LogData.save();
      res.render('login', { title: "Login Page", userId: req.session.userId });
    }
  } catch (err) {
    console.log(err);
    res.status(500).send('Internal server error');
  }
})

//Logout 
router.get('/logout', function (req, res, next) {
  req.session.destroy(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect('/');
  });
});

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
//               trn.count(function (err, ttcnt) {
//                 if (err) {
//                   console.log(err);
//                 } else {
//                   TranscriptModel.aggregate([{ $group: { _id: null, sum_val: { $sum: "$payamt" } } }], function (err, amt) {
//                     res.render("index", {
//                       title: "Transcript management system", dueverification: entdata, duedispatch: verdata, dispdone: totdata,
//                       totalcnt: ttcnt, headertext: "Welcome to the summary page", totamt: amt
//                     });
//                   })
//                 }
//               })
//             }
//           })
//         }
//       })
//     }
//   })
// });
// cput = os.cpus();
// global.varcpu = cput[0].model;
// global.varfreemem = (os.freemem() / 1048576).toFixed(2);
// global.varosplat = os.platform();
// global.varosrel = os.release();
// global.varmem = (os.totalmem() / 1048576).toFixed(2);
// // var osVer=os.version();


// //Request page
// router.get("/reqpage", function (req, res, next) {
//   res.render("reqpage", {
//     title: "Request page",
//     headtext: "Welcome to the request page",
//     reg: "",
//     dp: "",
//     ssn: "",
//     passouts: { name: "aa" },
//     moment: moment,
//     curdt: Date.now(),
//   });
// });

// /**/
// //test page
// router.get("/hi", function (req, res, next) {
//   PassoutModel.find(function (err, passouts) {
//     if (err) {
//       console.log(err);
//     } else {
//       console.log(passouts.name);
//       res.render("hi", { title: "test", passouts: passouts });
//     }
//   });
// });

// router.get("/hi", function (req, res, next) {
//   res.render("hi", { title: "test" });
// });


// // Search for records [POST method]
// router.post("/searchrecords/", function (req, res) {
//   var fltrReg = req.body.txtreg;
//   var fltrSessn = req.body.txtsessn;
//   var fltrDept = req.body.txtdept;
//   console.log("Dept is   " + fltrDept+fltrSessn);
//   if (fltrReg != "" && fltrSessn != "" && fltrDept != "") {
//     var fltrParameter = {
//       $and: [
//         { sesn: fltrSessn },
//         { $and: [{ deptcode: fltrDept }, { regno: fltrReg }] },
//       ],
//     };
//   } else {
//     var fltrParameter = ({ regno: "" });
//     //console.log("This is else part");
//   }
//   var studentFilter = PassoutModel.find(fltrParameter);
//   console.log(fltrParameter);

//   studentFilter.exec(function (err, passouts) {
//     if (err) {
//       console.log(err);
//     } else {
//       res.render("reqpage", {
//         passouts: passouts,
//         headtext: "Welcome to the request page",
//         title: "Passout student details",
//         reg: req.body.txtreg,
//         dp: req.body.txtdept,
//         ssn: req.body.txtsessn,
//         moment: moment,
//         curdt: Date.now(),
//       });
//     }
//   });
// });

// /* ADD RECORD IN TRANSACTION TABLE*/
// router.post("/addrequest/", (req, res) => {
//   TranscriptModel.find({ passout_id: req.body.id }).count(function (err, result) {
//     if (err)
//       throw err;
//     console.log('Total count::::', result)
//     if (result > 0) {
//       console.log('Duplicate');
//       res.render("hi", { title: "Duplicate record", headertext: "Duplicate record" });
//     } else {
//       const transdata = {
//         passout_id: req.body.id,
//         contactno: req.body.txtmobile,
//         email_id: req.body.txtemail,
//         appliedto: req.body.txtappfor,
//         applno: req.body.txtappno,
//         payid: req.body.txtpayid,
//         payamt: req.body.txtpayamt,
//         aftersxc: req.body.txtaftrsxc,
//         entrydt: new Date(req.body.txtentrydt),
//         verify: false,
//         verificationdate: "",
//         dispatchmode: "",
//         dispatchid: "",
//         dispatchdt: "",
//         remarks: ""
//       }
//       var data = TranscriptModel(transdata);
//       data.save(function (err) {
//         if (err) {
//           console.log('error', err);
//         } else {
//           res.redirect('../reqpage');
//         }
//       });
//     }
//   });

// });

// /* DIPLAY RECORDS OF TRANSCRIPT TABLE WHICH ARE NOT VERIFIED*/
// router.get('/reqlist', function (req, res, next) {
//   TranscriptModel.aggregate([
//     {
//       $lookup: {
//         from: "passouts",
//         localField: "passout_id",
//         foreignField: "_id",
//         as: "passdata"
//       }
//     }, { $match: { verify: false } }, { $unwind: "$passdata" }
//   ], function (err, data) {
//     if (err) {
//       console.log(err);
//     } else {
//       res.render('reqlist', {
//         transcripts: data, title: "Transcript request list (Verification pending)", moment: moment,
//         headertext: "Transcript request list"
//       })
//     }
//   }).sort({ "entrydt": 1 });
// });
// /* DIPLAY RECORDS OF TRANSCRIPT TABLE WHICH ARE VERIFIED*/
// router.get('/verifylist', function (req, res, next) {
//   TranscriptModel.aggregate([
//     {
//       $lookup: {
//         from: "passouts",
//         localField: "passout_id",
//         foreignField: "_id",
//         as: "passdata"
//       }
//     }, { $match: { verify: true, dispatchdt: null } }, { $unwind: "$passdata" }
//   ], function (err, data) {
//     if (err) {
//       console.log(err);
//     } else {
//       res.render('approvedlist', {
//         transcripts: data, title: "Transcript list (Verification done)", moment: moment,
//         headertext: "Approved list of verification"
//       })
//     }
//   }).sort({ "verificationdate": 1 });
// });

// //Get single record by ID for approval
// router.get('/approvepage/:id', function (req, res) {
//   // console.log(req.params.id);
//   TranscriptModel.aggregate([
//     {
//       $lookup: {
//         from: "passouts",
//         localField: "passout_id",
//         foreignField: "_id",
//         as: "passdata"
//       }
//     },
//     { $match: { _id: new ObjectId(req.params.id) } },
//     { $unwind: "$passdata" }
//   ], function (err, data) {
//     if (err) {
//       console.log(err);
//     } else {
//       // console.log(data);
//       res.render('approve', {
//         transcripts: data, title: "Transcript request list", moment: moment,
//         headertext: "Transcript request list", updtmsg: ""
//       })
//     }
//   });
// });

// /* APPROVE A TRANSCRIPT*/
// router.post('/verify', function (req, res, next) {
//   // console.log(req.body);
//   var dataRecords = {
//     verify: true,
//     verificationdate: Date.now()
//   }
//   var pwd = "abhi@2022";
//   var trId = req.body.id;
//   console.log(trId);
//   console.log(dataRecords);
//   if (req.body.txtpwd == pwd) {
//     var update = TranscriptModel.findByIdAndUpdate(req.body.id, dataRecords);
//     update.exec(function (err, data) {
//       if (err) throw err;
//       trn.exec(function (err, data) {
//         if (err) throw err;
//         res.redirect("../reqlist");
//       })
//     })
//   } else {
//     TranscriptModel.aggregate([
//       {
//         $lookup: {
//           from: "passouts",
//           localField: "passout_id",
//           foreignField: "_id",
//           as: "passdata"
//         }
//       },
//       { $match: { _id: new ObjectId(req.body.id) } },
//       { $unwind: "$passdata" }
//     ], function (err, data) {
//       if (err) {
//         console.log(err);
//       } else {
//         console.log(data);
//         res.render('approve', {
//           transcripts: data, title: "Transcript request list", moment: moment,
//           headertext: "Transcript request list", updtmsg: "Incorrect password"
//         })
//       }
//     });
//   }
// });

// /* Final Dispatch*/
// router.post('/finaldisp', function (req, res, next) {
//   // console.log(req.body);
//   var dataRecords = {
//     dispatchmode: req.body.txtdispmode,
//     dispatchdt: Date.now(),
//     dispatchid: req.body.txtdspid,
//     remarks: req.body.txtremark
//   }
//   var pwd = "dispatch@2022";
//   var trId = req.body.id;
//   console.log(trId);
//   // console.log(dataRecords);
//   if (req.body.txtpwd == pwd) {
//     var update = TranscriptModel.findByIdAndUpdate(req.body.id, dataRecords);
//     update.exec(function (err, data) {
//       if (err) throw err;
//       trn.exec(function (err, data) {
//         if (err) throw err;
//         res.redirect("../verifylist");
//       })
//     })
//   } else {
//     TranscriptModel.aggregate([
//       {
//         $lookup: {
//           from: "passouts",
//           localField: "passout_id",
//           foreignField: "_id",
//           as: "passdata"
//         }
//       },
//       { $match: { _id: new ObjectId(req.body.id) } },
//       { $unwind: "$passdata" }
//     ], function (err, data) {
//       if (err) {
//         console.log(err);
//       } else {
//         console.log(data);
//         res.render('dispatch', {
//           transcripts: data, title: "Transcript request list", moment: moment,
//           headertext: "Transcript request list", updtmsg: "Incorrect password"
//         })
//       }
//     });
//   }
// });

// //Get single record by ID for dispatch
// router.get('/dispatch/:id', function (req, res) {
//   console.log(req.params.id);
//   TranscriptModel.aggregate([
//     {
//       $lookup: {
//         from: "passouts",
//         localField: "passout_id",
//         foreignField: "_id",
//         as: "passdata"
//       }
//     },
//     { $match: { _id: new ObjectId(req.params.id) } },
//     { $unwind: "$passdata" }
//   ], function (err, data) {
//     if (err) {
//       console.log(err);
//     } else {
//       // console.log(data);
//       res.render('dispatch', {
//         transcripts: data, title: "Dispatch list", moment: moment,
//         headertext: "Dispatch list", updtmsg: ""
//       })
//     }
//   });
// });
// /* DIPLAY ALL RECORDS OF TRANSCRIPT TABLE */
// router.get('/showall', function (req, res, next) {
//   TranscriptModel.aggregate([
//     {
//       $lookup: {
//         from: "passouts",
//         localField: "passout_id",
//         foreignField: "_id",
//         as: "passdata"
//       }
//     }, { $unwind: "$passdata" }
//   ], function (err, data) {
//     if (err) {
//       console.log(err);
//     } else {
//       res.render('showall', {
//         transcripts: data, title: "All reords of Transcripts", moment: moment,
//         headertext: "All reords of Transcripts", dtfrm: Date.now(), dtupto: Date.now()
//       })
//     }
//   }).sort({ "entrydt": -1 });
// });
// /* DIPLAY ALL RECORDS BY DATE ON TRANSCRIPT TABLE */
// router.post('/searchbydate', function (req, res, next) {
//   datefrom = new Date(req.body.txtdtfrom);
//   dateupto = new Date(req.body.txtdtupto);
//   console.log(datefrom);
//   TranscriptModel.aggregate([
//     {
//       $lookup: {
//         from: "passouts",
//         localField: "passout_id",
//         foreignField: "_id",
//         as: "passdata"
//       }
//     }, { $match: { entrydt: { $gte: datefrom, $lte: dateupto } } }, { $unwind: "$passdata" }
//     // {entrydt:{$gte:ISODate('2022-04-25')}}
//   ], function (err, data) {
//     if (err) {
//       console.log(err);
//     } else {
//       res.render('showall', {
//         transcripts: data, title: "Records entered between specified dates", moment: moment,
//         headertext: "Records entered between specified dates", dtfrm: datefrom, dtupto: dateupto
//       })
//     }
//   }).sort({ "entrydt": -1 });
// });

// //Get single record by ID to display all data
// router.get('/details/:id', function (req, res) {
//   console.log(req.params.id);
//   TranscriptModel.aggregate([
//     {
//       $lookup: {
//         from: "passouts",
//         localField: "passout_id",
//         foreignField: "_id",
//         as: "passdata"
//       }
//     },
//     { $match: { _id: new ObjectId(req.params.id) } },
//     { $unwind: "$passdata" }
//   ], function (err, data) {
//     if (err) {
//       console.log(err);
//     } else {
//       // console.log(data);
//       res.render('details', {
//         transcripts: data, title: "Detail list", moment: moment,
//         headertext: "Detail list", updtmsg: ""
//       })
//     }
//   });
// });
//ABOUT PAGE
router.get('/about', (req, res) => {
  res.render('about', { title: "This is about page", userId: req.session.userId });
});
// /* DELETE RECORDS FROM TRANSCRIPT TABLE*/
// router.get('/deleterecord/:id', function (req, res) {
//   TranscriptModel.findOne({ _id: req.params.id, verify: true }).count(function (err, results) {
//     if (err)
//       throw (err);
//     if (results > 0) {
//       console.log('Already verified');
//       res.render("hi", { title: "Already verified record!!!", headertext: "This record is verified, so you cann't delete." });
//     } else {
//       TranscriptModel.findOneAndDelete({ _id: req.params.id }, function (err, data) {
//         if (err) {
//           res.redirect("../reqlist");
//         } else {
//           res.redirect("../reqlist");
//         }
//       })
//     }
//   })
// })

// router.get('/sms/', function (req, res) {
//   //res.redirect("../reqlist");
//   var message = "Please complete your EVALUATION by the last date. Thank you [COE, St. Xavier's College, Kolkata]" +
//     "APIKEY=" + "WJLAskzsrJF" +
//     "&MobileNo=" + "9239042405" + "&SenderID=" + "SXCKOL" +
//     "&Message=" + URLEncoder.encode(message, "UTF-8") +
//     "&ServiceName=" + "TEMPLATE_BASED";

// });

// router.get('/utilities', (req, res) => {
//   res.render('utilities', { maxtemp: "", mintemp: "", actualtemp: "", description: "", city: "", title: "Welcome to Weather Report Page" })
// });
// router.post('/utilities', (req, res) => {
//   var city = req.body.txttown;
//   console.log(city);
//   climate.getMaximumTemp(city, function (maxtemp) {
//     console.log("Maximum temperature: " + maxtemp);
//     climate.getClimateDescription(city, function (description) {
//       console.log("Climate description: " + description);
//       climate.getActualTemp(city, function (actualtemp) {
//         console.log("Actual temperature: " + actualtemp);
//         climate.getMinimumTemp(city, function (mintemp) {
//           console.log("Minimum temperature: " + mintemp);
//           res.render('utilities', {
//             maxtemp: maxtemp, mintemp: mintemp, actualtemp: actualtemp, description: description,
//             city: city, title: "Welcome to Weather Report Page"
//           })
//         });
//       });
//     });
//   });

// });

/*TO GET ADDRESS FROM PIN CODE */
// router.get('/pincode', (req, res) => {
//   res.render('pincode', { postoffice: "", city: "", state: "", pincode: "", country: "", title: "Search address by pin code" });
// });
// router.post('/pincode', (req, res) => {
//   const pin = req.body.txtpin;
//   console.log(pin);
//   const request = require('request');
//   request({
//     url: "https://api.postalpincode.in/pincode/" + pin,
//     // var reqUrl="https://jsonplaceholder.typicode.com/posts";
//     json: true

//     //**al9103674
//   }, (err, response, body) => {
//     var finduser = body.find(user => body, undefined, 4);
//     //console.log(JSON.parse(body,undefined,4))
//     //console.log(JSON.stringify(finduser.PostOffice[0].Name));
//     if (JSON.parse(JSON.stringify(finduser.Message != "No records found"))) {
//       var Postoffice = JSON.parse(JSON.stringify(finduser.PostOffice[0].Name));
//       var District = JSON.parse(JSON.stringify(finduser.PostOffice[0].District));
//       var State = JSON.parse(JSON.stringify(finduser.PostOffice[0].State));
//       var Country = JSON.parse(JSON.stringify(finduser.PostOffice[0].Country));
//       var Pincode = JSON.parse(finduser.PostOffice[0].Pincode);

//       //var Pincode = JSON.stringify(finduser.PostOffice[0].Pincode);
//       console.log(Postoffice, District, State, Country, Pincode);
//       res.render('pincode', {
//         postoffice: Postoffice, city: District, state: State, pincode: Pincode, country: Country,
//         title: "Search address by pin code"
//       });
//     } else {
//       console.log(JSON.parse(JSON.stringify(finduser.Message)));
//       res.render('pincode', { postoffice: "No records found", city: "", state: "", pincode: "", country: "", title: "Search address by pin code" });
//     }
//   })


// });

module.exports = router;

//END OF FILE
