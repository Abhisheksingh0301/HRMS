var mongoose = require('mongoose');
var Schema=mongoose.Schema;

var emp_mst=new Schema({
    emp_name:{type:String, required:true},
    year_of_joining:Number,
    gender:{type:String, required:true},
    entrydt:{type:Date, default:Date.now},
    remarks:String
});

module.exports=mongoose.model('emp_master',emp_mst);