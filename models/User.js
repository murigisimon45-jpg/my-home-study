const mongoose = require('mongoose');
const UserSchema = new mongoose.Schema({
  role:{type:String, enum:['student','teacher'], required:true},
  firstName:String,
  lastName:String,
  middleName:String,
  fullName:String,
  grade:{type:String, enum:['Grade 8','Grade 9']},
  teacherId:{type:String, required:true}, // Primary teacher ID for student, own ID for teacher
  teacherIds:{type:[String], default:[]}, // All teacher IDs for student (multi-teacher support)
  teacherNames:{type:Map, of:String, default:{}}, // Map of teacherId -> teacherName
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
UserSchema.index({teacherIds:1});

// Before save, ensure teacherIds includes teacherId for students
UserSchema.pre('save', function(next){
  if(this.role==='student'){
    if(!this.teacherIds || this.teacherIds.length===0){
      this.teacherIds = [this.teacherId];
    } else if(!this.teacherIds.includes(this.teacherId)){
      this.teacherIds.unshift(this.teacherId);
    }
    // Deduplicate
    this.teacherIds = [...new Set(this.teacherIds.map(id=>id.toUpperCase()))];
  }
  next();
});

module.exports = mongoose.model('User', UserSchema);

