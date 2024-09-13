var mongoose = require('mongoose');
var Schema=mongoose.Schema;

var leave_mst=new Schema({
    leave_abb:{type:String, required:true},
    leave_desc:{type:String, required:true},
    leave_alloted:{type:Number, required:true},
    entrydt:{type:Date, default:Date.now},
    remarks:String
});

module.exports=mongoose.model('leave_master',leave_mst);