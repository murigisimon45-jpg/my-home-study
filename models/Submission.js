const mongoose = require('mongoose');
const AnswerSchema = new mongoose.Schema({
  qId:String,
  answer:String
},{_id:false});

const SubmissionSchema = new mongoose.Schema({
  assignmentId:{type:mongoose.Schema.Types.ObjectId, ref:'Assignment', required:true},
  assignmentIdStr:String,
  studentId:{type:mongoose.Schema.Types.ObjectId, ref:'User', required:true},
  answers:[AnswerSchema],
  status:{type:String, enum:['In Progress','Submitted','Graded'], default:'In Progress'},
  score:{type:Number, default:0},
  perQuestion:{type:Map, of:Number},
  feedback:String,
  submittedAt:{type:Date, default:Date.now},
  gradedAt:Date
});
SubmissionSchema.index({studentId:1, assignmentId:1});
module.exports = mongoose.model('Submission', SubmissionSchema);