var mongoose = require('mongoose');
var Schema=mongoose.Schema;

var att_entry=new Schema({
    emp_name: {type:String, required:true},
    leave_type: {type:String, required:true},
    leave_date: Date,
    enteredby:{type:String, required:true},
    entrydt:{type:Date, default:Date.now}
});

module.exports=mongoose.model('attendance',att_entry);