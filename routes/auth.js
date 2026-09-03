const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const router = express.Router();

function genTeacherId(){ return 'TCH-' + Math.floor(100+Math.random()*900); }
function sign(user){ 
  return jwt.sign({id:user._id, role:user.role, teacherId:user.teacherId, teacherIds:user.teacherIds||[user.teacherId]}, process.env.JWT_SECRET, {expiresIn:'30d'}); 
}

// Register Teacher (unchanged)
router.post('/register/teacher', async (req,res)=>{
  try{
    const {fullName,school,phone,whatsapp,email,password} = req.body;
    if(!fullName||!school||!whatsapp||!email||!password) return res.status(400).json({msg:'Missing fields'});
    if(!/^(\+254|0)(7|1)\d{8}$/.test(whatsapp.trim())) return res.status(400).json({msg:'Invalid WhatsApp'});
    const exists = await User.findOne({email:email.toLowerCase()});
    if(exists) return res.status(400).json({msg:'Email already registered'});
    const hashed = await bcrypt.hash(password,10);
    let tid = genTeacherId();
    let tries=0; while(await User.findOne({teacherId:tid, role:'teacher'}) && tries<5){ tid = genTeacherId(); tries++; }
    const user = await User.create({
      role:'teacher', fullName, school, phone, whatsapp, email:email.toLowerCase(), password:hashed, teacherId:tid, teacherIds:[tid]
    });
    const token = sign(user);
    res.json({token, user:{id:user._id, role:'teacher', fullName, school, email:user.email, teacherId:tid, teacherIds:[tid]}});
  }catch(e){ console.error(e); res.status(500).json({msg:'Server error'}); }
});

// Register Student (updated for multi-teacher)
router.post('/register/student', async (req,res)=>{
  try{
    const {firstName,lastName,middleName,grade,teacherId,email,password} = req.body;
    if(!firstName||!lastName||!grade||!teacherId||!email||!password) return res.status(400).json({msg:'Missing fields'});
    if(!/^TCH-\d{3}$/.test(teacherId.toUpperCase())) return res.status(400).json({msg:'Invalid Teacher ID'});
    const teacher = await User.findOne({teacherId:teacherId.toUpperCase(), role:'teacher'});
    if(!teacher) return res.status(400).json({msg:'Teacher ID not found'});
    const exists = await User.findOne({email:email.toLowerCase()});
    if(exists) return res.status(400).json({msg:'Email already registered'});
    const hashed = await bcrypt.hash(password,10);
    const tidUpper = teacherId.toUpperCase();
    const user = await User.create({
      role:'student', firstName, lastName, middleName, grade, teacherId:tidUpper, teacherIds:[tidUpper], teacherNames:{[tidUpper]: teacher.fullName}, teacherName:teacher.fullName, email:email.toLowerCase(), password:hashed
    });
    const token = sign(user);
    res.json({token, user:{id:user._id, role:'student', firstName, lastName, grade, teacherId:tidUpper, teacherIds:[tidUpper], teacherName:teacher.fullName, email:user.email}});
  }catch(e){ console.error(e); res.status(500).json({msg:'Server error'}); }
});

// Add another teacher (NEW - multi-teacher support)
router.post('/student/add-teacher', auth, async (req,res)=>{
  try{
    if(req.user.role!=='student') return res.status(403).json({msg:'Only students'});
    const {teacherId} = req.body;
    if(!teacherId) return res.status(400).json({msg:'Teacher ID required'});
    if(!/^TCH-\d{3}$/.test(teacherId.toUpperCase())) return res.status(400).json({msg:'Invalid Teacher ID format'});
    const tidUpper = teacherId.toUpperCase();
    
    // Check if teacher exists
    const teacher = await User.findOne({teacherId:tidUpper, role:'teacher'});
    if(!teacher) return res.status(404).json({msg:'Teacher ID not found - check with your teacher'});
    
    // Check if already added
    const student = await User.findById(req.user._id);
    if(student.teacherIds && student.teacherIds.includes(tidUpper)){
      return res.status(400).json({msg:'Teacher already added'});
    }
    if(student.teacherId===tidUpper){
      return res.status(400).json({msg:'This is already your primary teacher'});
    }
    
    // Add teacher
    if(!student.teacherIds) student.teacherIds = [student.teacherId];
    student.teacherIds.push(tidUpper);
    student.teacherIds = [...new Set(student.teacherIds)]; // deduplicate
    
    if(!student.teacherNames) student.teacherNames = new Map();
    // For Map type, set
    if(student.teacherNames instanceof Map){
      student.teacherNames.set(tidUpper, teacher.fullName);
    } else {
      // If it's plain object
      student.teacherNames = {...student.teacherNames, [tidUpper]: teacher.fullName};
    }
    
    await student.save();
    
    // Return updated user with teachers info
    const teachersInfo = [];
    for(let tid of student.teacherIds){
      const t = await User.findOne({teacherId:tid, role:'teacher'}).select('fullName school teacherId');
      if(t) teachersInfo.push(t);
    }
    
    res.json({msg:'Teacher added successfully', teacherIds:student.teacherIds, teachersInfo, addedTeacher:teacher});
  }catch(e){ console.error(e); res.status(500).json({msg:'Server error'}); }
});

// Remove teacher (optional)
router.post('/student/remove-teacher', auth, async (req,res)=>{
  try{
    if(req.user.role!=='student') return res.status(403).json({msg:'Only students'});
    const {teacherId} = req.body;
    if(!teacherId) return res.status(400).json({msg:'Teacher ID required'});
    const tidUpper = teacherId.toUpperCase();
    const student = await User.findById(req.user._id);
    
    if(student.teacherId===tidUpper){
      return res.status(400).json({msg:'Cannot remove primary teacher'});
    }
    if(!student.teacherIds || !student.teacherIds.includes(tidUpper)){
      return res.status(400).json({msg:'Teacher not in your list'});
    }
    
    student.teacherIds = student.teacherIds.filter(id=>id!==tidUpper);
    await student.save();
    res.json({msg:'Teacher removed', teacherIds:student.teacherIds});
  }catch(e){ res.status(500).json({msg:'Server error'}); }
});

// Get my teachers
router.get('/student/my-teachers', auth, async (req,res)=>{
  try{
    if(req.user.role!=='student') return res.status(403).json({msg:'Only students'});
    const student = await User.findById(req.user._id);
    const teacherIds = student.teacherIds && student.teacherIds.length ? student.teacherIds : [student.teacherId];
    const teachers = [];
    for(let tid of teacherIds){
      const t = await User.findOne({teacherId:tid, role:'teacher'}).select('fullName school teacherId email');
      if(t) teachers.push(t);
    }
    res.json({teacherIds, teachers});
  }catch(e){ res.status(500).json({msg:'Server error'}); }
});

// Login (updated to include teacherIds)
router.post('/login', async (req,res)=>{
  try{
    const {email,password} = req.body;
    const user = await User.findOne({email:email.toLowerCase()});
    if(!user) return res.status(400).json({msg:'Account not found'});
    const ok = await bcrypt.compare(password, user.password);
    if(!ok) return res.status(400).json({msg:'Incorrect password'});
    // Ensure teacherIds exists for students
    if(user.role==='student' && (!user.teacherIds || user.teacherIds.length===0)){
      user.teacherIds = [user.teacherId];
      await user.save();
    }
    const token = sign(user);
    res.json({token, user});
  }catch(e){ res.status(500).json({msg:'Server error'}); }
});

// Forgot / Reset (unchanged)
router.post('/forgot/find', async (req,res)=>{
  try{
    const {role,email,teacherId} = req.body;
    const user = await User.findOne({role, email:email.toLowerCase(), teacherId:teacherId.toUpperCase()});
    if(!user) return res.status(404).json({msg:'Account not found'});
    res.json({found:true, display: role==='teacher'?user.fullName:user.firstName+' '+user.lastName, id:user._id});
  }catch(e){ res.status(500).json({msg:'Server error'}); }
});

router.post('/forgot/reset', async (req,res)=>{
  try{
    const {id,newPassword} = req.body;
    if(!newPassword || newPassword.length<8) return res.status(400).json({msg:'Password too short'});
    const hashed = await bcrypt.hash(newPassword,10);
    await User.findByIdAndUpdate(id, {password:hashed});
    res.json({msg:'Password reset successful'});
  }catch(e){ res.status(500).json({msg:'Server error'}); }
});

module.exports = router;

