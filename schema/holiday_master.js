var mongoose = require('mongoose');
var Schema=mongoose.Schema;

var holiday_mst=new Schema({
   holiday_date:{type:Date, required:true},
   holiday_description:{type:String, required:true},
    entrydt:{type:Date, default:Date.now},
    remarks:String
});

module.exports=mongoose.model('holiday_master',holiday_mst);