var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var log_mst = new Schema({
    emp_name: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String, default: "user" },
    entrydt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('login', log_mst);