module.exports = function(req, res, next) {
    if (req.session && req.session.userId) {
        // User is authenticated if req.session.userId exists
        return next();
    } else {
        // User is not authenticated, redirect to login page
        //res.redirect('/login');
        res.render('login',{title:"Login Page",userId: req.session.userId});
    }
};
