var express = require("express");
var os = require('os');
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

/* GET index page */
router.get("/", authMiddleware, function (req, res, next) {
  res.render("index", { title: "Introduction page", userId: req.session.userId });

});

//Get Employees page
router.get("/employees", authMiddleware, function (req, res, next) {
  res.render("employees", { title: "Employees page", userId: req.session.userId })
});
//Add new employee
router.post("/addemp/", authMiddleware, (req, res) => {
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
        mob: req.body.txtmob,
        remarks: req.body.rmrk
      }
      var data = EmpMstModel(empData);
      data.save(function (err) {
        if (err) {
          console.log('error', err);
        } else {
          EmpMstModel.find((err, data) => {
            console.log(data);
            // res.render('emplist', { employeelist: data, title: "Employees list", userId: req.session.userId });
            res.redirect('../emplist');
          }).sort({ emp_name: 1 });

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
router.post("/addlv/", authMiddleware, (req, res) => {
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
router.get('/leavetype', authMiddleware, async (req, res) => {
  try {
    // Fetch the leave types and sort them
    const lvlist = await LeaveMstModel.find().sort({ leave_abb: 1 });

    // Render the leave type view with the retrieved data
    res.render('leavetype', {
      lvlist: lvlist,
      title: "Leaves Category",
      userId: req.session.userId
    });
  } catch (err) {
    // Log the error and send an appropriate response
    console.error('Error retrieving leave types:', err);
    res.status(500).send('Internal server error');
  }
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
router.post("/edit-empl", authMiddleware, (req, res) => {
  const empData = {
    emp_name: (req.body.empname).toUpperCase(),
    year_of_joining: req.body.joinyr,
    gender: req.body.cmbGender,
    mob: req.body.txtmob,
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
router.get("/attendance_entry", authMiddleware, async (req, res) => {
  try {
    const empdata = await EmpMstModel.find();
    const leavedata = await LeaveMstModel.find();
    const prm = await LogModel.find({ role: 'admin', emp_name: req.session.fullName });

    console.log("prm variable ::::::::::::::::::::", prm.length);

    if (prm.length > 0) {
      console.log(prm.length);
      res.render('attendance_entry', {
        title: "Attendance entry",
        userId: req.session.userId,
        leavedata: leavedata,
        empdata: empdata,
        attData: "",
        moment: moment
      });
    } else {
      console.log(prm.length);
      return res.render("hi", {
        title: "You are not authorised",
        userId: req.session.userId
      });
    }
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).send('Internal Server Error');
  }
});

//ADD ATTENDANCE
router.post("/addatt/", authMiddleware, (req, res) => {
  AttendanceModel.find({ emp_name: req.body.empnm, leave_date: req.body.dt }).count(function (err, result) {
    if (err)
      throw err;
    // console.log('Total count::::', result);
    if (result > 0) {
      console.log('Duplicate');
      res.render("hi", { title: "Duplicate record", userId: req.session.userId })
    } else {
      const lvdt = moment(req.body.dt).format('dddd');
      if (lvdt == 'Sunday') {
        res.render("hi", { title: "Selected date is Sunday", userId: req.session.userId })
      } else {
        // if({role: 'admin'}){}
        //const user = await LogModel.findOne({ emp_name: (req.body.txtuser).toUpperCase() });
        const prm = LogModel.find({ role: 'admin', emp_name: req.session.fullName });
        if (prm) {


          const attData = {
            emp_name: (req.body.empnm).toUpperCase(),
            leave_type: (req.body.lvcat).toUpperCase(),
            leave_date: req.body.dt,
            enteredby: (req.session.fullName).toUpperCase(),
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
                      // console.log(attData);

                      res.render('attendance_entry', { title: "Attendance entry", leavedata: leavedata, empdata: empdata, attData: attData, moment: moment, userId: req.session.userId });
                    }
                  })
                }
              })
            }
          });//** */
        } else {
          return res.render("hi", { title: "You are not authourised", userId: req.session.userId });
        }
      }
    }
  })
});

//Access report page
router.get('/reports', authMiddleware, (req, res) => {

  res.render('reports', { title: "Report page", userId: req.session.userId });
});

//Daily attendance report
router.get('/dailyreport', authMiddleware, (req, res) => {
  EmpMstModel.find((err, empdata) => {
    if (err) {
      console.log(err);
    } else {
      LeaveMstModel.find((err, lv) => {
        if (err) {
          console.log(err);
        } else {
          const yr = moment().year();
          // console.log(lv);
          res.render('dailyreport', {
            title: "Individual attendance report", empdata: empdata, moment: moment, year: yr,
            userId: req.session.userId, lvdata: lv
          });
        }
      });
    }
  })
});

//Individual report :: POST menthod
router.post('/individualrpt', authMiddleware, (req, res) => {
  const currentdate = new Date();
  const empname = req.body.empnm;
  const chkleaves = req.body.chkleaves || [''];
  // const chkleaves = req.body.chkleaves ? req.body.chkleaves.map(id => ObjectId(id)) : [];
  const stdate = new Date(req.body.stdt);
  const enddate = new Date(req.body.enddt);
  // Prepare the match condition
  const matchCondition = {
    emp_name: empname,
    leave_date: { $gte: stdate, $lte: enddate }
  };
  //const selectedHobbies = Array.isArray(hobbies) ? hobbies : [hobbies].filter(Boolean);
  const selectedLv = Array.isArray(chkleaves) ? chkleaves : [chkleaves].filter(Boolean);
  // Add the leave_abb condition only if chkleaves is not empty
  if (selectedLv.length > 0) {
    matchCondition["Leave.leave_abb"] = { $in: selectedLv };
    console.log(chkleaves);
    //matchCondition[leave_type] = { $in: chkleaves };
  }
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
      $match: matchCondition
    },
    { $sort: { "leave_date": 1 } }
  ], function (err, data) {
    if (err) {
      console.log("Error:", err);
    } else {
      //const cnt = data.length;
      // console.log(req.body.chkleaves);
      // console.log(data);
      // if (data.length || chkleaves.length) {
      //********************************************** */
      //console.log(data);
      const totalDays = Math.ceil(data.reduce((count, record) => {
        const leaveDate = new Date(record.leave_date);
        return count + (leaveDate.getDay() === 6 ? 0.5 : 1); // 0.5 for Saturday
      }, 0));

      //////////************************************** */

      if (totalDays > 0) {
        res.render('individualreport', {
          heading: "Employee Attendance Report",
          title: empname,
          data: data,
          dept: "COE Office",
          moment: moment,
          stdate: stdate,
          enddate: enddate,
          curdt: currentdate,
          totalRecords: totalDays
        });
      } else {
        return res.render("hi", { title: "No leaves in this period", userId: req.session.userId });
      }

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
      res.render('summaryreport', { title: "Summarised report", empdata: empdata, moment: moment, year: yr, userId: req.session.userId });
    }
  })
});

//Summary report :: POST method
router.post('/summaryrpt', authMiddleware, (req, res) => {
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
          leave_type: "$Leave.leave_desc",
          leave_date: "$leave_date" // Include leave_date for Saturday checking
        },
        totalLeaves: { $sum: 1 } // Count the number of leaves for each employee
      }
    },
    { $sort: { "_id.emp_name": 1, "_id.leave_type": 1 } }
  ], function (err, data) {
    if (err) {
      console.log("Error:", err);
    } else {
      // Create an object to hold adjusted totals for each employee
      const adjustedTotals = {};

      // Calculate total leaves considering Saturdays as 0.5
      data.forEach(record => {
        const leaveDate = new Date(record._id.leave_date);
        const isSaturday = leaveDate.getDay() === 6; // 6 means Saturday
        const adjustedLeaves = isSaturday ? 0.5 : 1; // Count Saturday as 0.5

        const empName = record._id.emp_name;
        const leaveType = record._id.leave_type;

        if (!adjustedTotals[empName]) {
          adjustedTotals[empName] = {};
        }

        if (!adjustedTotals[empName][leaveType]) {
          adjustedTotals[empName][leaveType] = 0;
        }

        adjustedTotals[empName][leaveType] += adjustedLeaves; // Accumulate adjusted leaves
      });

      // Convert adjusted totals into an array format
      const formattedPivotTable = Object.keys(adjustedTotals).map(empName => {
        const leaveData = { emp_name: empName };

        Object.keys(adjustedTotals[empName]).forEach(leaveType => {
          leaveData[`${leaveType}_total_leaves`] = Math.ceil(adjustedTotals[empName][leaveType]); // Use Math.floor to ensure integer
        });

        return leaveData;
      });

      // Calculate total records as an integer
      const totalRecords = Math.ceil(formattedPivotTable.reduce((sum, row) => {
        return sum + Object.values(row).filter(v => typeof v === 'number').reduce((a, b) => a + b, 0);
      }, 0));

      //console.log(formattedPivotTable);

      res.render('summreport', {
        title: "Summarised Attendance Report",
        data: formattedPivotTable,
        dept: "COE Office",
        moment: moment,
        stdate: stdate,
        enddate: enddate,
        curdt: currentdate,
        totalRecords: totalRecords // This will be an integer
      });
    }
  });
});



//Login Post Form
router.post('/login', async (req, res, next) => {
  try {
    // Find a user with the given emp_name
    const user = await LogModel.findOne({ emp_name: (req.body.txtuser).toUpperCase() });

    // If user is not found or password is incorrect
    if (!user || !(await bcrypt.compare(req.body.txtpwd, user.password))) {
      console.log('Invalid credentials');
      return res.render("hi", { title: "Invalid credentials", userId: req.session.userId });
    }

    // Extract first name from full name
    const namePart = req.body.txtuser.split(" ");
    const firstName = namePart[0];

    // Set session variables
    req.session.userId = (firstName).toUpperCase();
    req.session.fullName = req.body.txtuser;
    //console.log(req.session.userId);

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
      if (req.body.txtcnfrmpwd == req.body.txtpwd) {

        const employeelist = await EmpMstModel.find({ emp_name: req.body.empname }).sort({ emp_name: 1 });
        const logindata = {
          emp_name: req.body.empname,
          password: req.body.txtpwd,
        };
        const LogData = new LogModel(logindata);

        //Hash the password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(LogData.password, saltRounds);

        //Set the hashed password
        LogData.password = hashedPassword;

        //Save the new user to the Database
        await LogData.save();

        LogModel.find((err, Loglist) => {
          if (err) {
            console.error(err);
          } else {
            //console.log(Loglist);
            res.render('login', { title: "Login form", userId: req.session.userId, empdata: Loglist });
          }
        }).sort({ emp_name: 1 })


        // res.render('login', { title: "Login form", userId: req.session.userId });
      } else {
        res.render('hi', { title: "Password didn't match", userId: req.session.userId });
      }
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



//ABOUT PAGE
router.get('/about', (req, res) => {
  res.render('about', { title: "This is about page", userId: req.session.userId });
});




module.exports = router;

//END OF FILE
