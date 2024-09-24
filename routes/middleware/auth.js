// var LogModel = require("../schema/login");
const LogModel = require("../../schema/login");
module.exports = function(req, res, next) {
    if (req.session && req.session.userId) {
        // User is authenticated if req.session.userId exists
        return next();
    } else {
        // User is not authenticated, redirect to login page
        //res.redirect('/login');
        LogModel.find((err,Loglist)=>{
            if (err) {
                console.error(err);
            } else {
                console.log(Loglist);
                res.render('login',{title:"Login form",userId: req.session.userId, empdata:Loglist});
            }
        }).sort({emp_name:1})
       
    }
};
