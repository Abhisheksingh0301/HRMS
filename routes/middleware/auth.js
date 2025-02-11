const LogModel = require("../../schema/login");

module.exports = async function (req, res, next) {
    if (req.session && req.session.userId) {
        // User is authenticated if req.session.userId exists
        return next();
    } else {
        try {
            const Loglist = await LogModel.find().sort({ emp_name: 1 });
            res.render('login', { title: "Login form", userId: req.session.userId, empdata: Loglist });
        } catch (err) {
            console.error(err);
            next(err);
        }
    }
};
