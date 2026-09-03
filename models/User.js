const mongoose = require('mongoose');
const UserSchema = new mongoose.Schema({
  role:{type:String, enum:['student','teacher'], required:true},
  firstName:String,
  lastName:String,
  middleName:String,
  fullName:String,
  grade:{type:String, enum:['Grade 8','Grade 9']},
  teacherId:{type:String, required:true}, // TCH-XXX, for student it's teacher's id, for teacher it's own id
  teacherName:String,
  school:String,
  phone:String,
  whatsapp:String,
  email:{type:String, required:true, unique:true, lowercase:true},
  password:{type:String, required:true},
  createdAt:{type:Date, default:Date.now}
});
UserSchema.index({email:1});
UserSchema.index({teacherId:1});
module.exports = mongoose.model('User', UserSchema);