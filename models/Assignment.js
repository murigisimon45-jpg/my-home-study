const mongoose = require('mongoose');
const QuestionSchema = new mongoose.Schema({
  id:String,
  text:String,
  marks:Number
},{_id:false});
const AssignmentSchema = new mongoose.Schema({
  teacherId:{type:String, required:true, index:true},
  teacherName:String,
  teacherUserId:{type:mongoose.Schema.Types.ObjectId, ref:'User'},
  title:{type:String, required:true},
  subject:String,
  grade:{type:String, required:true},
  description:String,
  totalMarks:Number,
  dueDate:String,
  questions:[QuestionSchema],
  createdAt:{type:Date, default:Date.now}
});
module.exports = mongoose.model('Assignment', AssignmentSchema);