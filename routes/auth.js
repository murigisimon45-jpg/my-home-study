const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

function genTeacherId(){ return 'TCH-' + Math.floor(100+Math.random()*900); }
function sign(user){ return jwt.sign({id:user._id, role:user.role, teacherId:user.teacherId}, process.env.JWT_SECRET, {expiresIn:'30d'}); }

// Register Teacher
router.post('/register/teacher', async (req,res)=>{
  try{
    const {fullName,school,phone,whatsapp,email,password} = req.body;
    if(!fullName||!school||!whatsapp||!email||!password) return res.status(400).json({msg:'Missing fields'});
    if(!/^(\+254|0)(7|1)\d{8}$/.test(whatsapp.trim())) return res.status(400).json({msg:'Invalid WhatsApp'});
    const exists = await User.findOne({email:email.toLowerCase()});
    if(exists) return res.status(400).json({msg:'Email already registered'});
    const hashed = await bcrypt.hash(password,10);
    const tid = genTeacherId();
    // ensure unique tid
    let tries=0; while(await User.findOne({teacherId:tid, role:'teacher'}) && tries<5){ tid = genTeacherId(); tries++; }
    const user = await User.create({
      role:'teacher', fullName, school, phone, whatsapp, email:email.toLowerCase(), password:hashed, teacherId:tid
    });
    const token = sign(user);
    res.json({token, user:{id:user._id, role:'teacher', fullName, school, email:user.email, teacherId:tid}});
  }catch(e){ console.error(e); res.status(500).json({msg:'Server error'}); }
});

// Register Student
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
    const user = await User.create({
      role:'student', firstName, lastName, middleName, grade, teacherId:teacherId.toUpperCase(), teacherName:teacher.fullName, email:email.toLowerCase(), password:hashed
    });
    const token = sign(user);
    res.json({token, user:{id:user._id, role:'student', firstName, lastName, grade, teacherId:teacher.teacherId, teacherName:teacher.fullName, email:user.email}});
  }catch(e){ console.error(e); res.status(500).json({msg:'Server error'}); }
});

// Login
router.post('/login', async (req,res)=>{
  try{
    const {email,password} = req.body;
    const user = await User.findOne({email:email.toLowerCase()});
    if(!user) return res.status(400).json({msg:'Account not found'});
    const ok = await bcrypt.compare(password, user.password);
    if(!ok) return res.status(400).json({msg:'Incorrect password'});
    const token = sign(user);
    res.json({token, user});
  }catch(e){ res.status(500).json({msg:'Server error'}); }
});

// Forgot / Reset - verify email + teacherId then allow new password
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
    res.json({ok:true});
  }catch(e){ res.status(500).json({msg:'Server error'}); }
});

module.exports = router;