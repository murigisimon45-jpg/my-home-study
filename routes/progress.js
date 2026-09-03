const express = require('express');
const auth = require('../middleware/auth');
const { TopicCompletion, PracticeScore, ConceptUnderstand } = require('../models/Progress');
const User = require('../models/User');
const router = express.Router();

// Get students for teacher - now includes students who added this teacher (multi-teacher support)
router.get('/teacher/students', auth, async (req,res)=>{
  try{
    if(req.user.role!=='teacher') return res.status(403).json({msg:'Only teachers'});
    // Find students where teacherId matches OR teacherIds array contains teacher's ID
    const students = await User.find({
      role:'student',
      $or:[
        {teacherId:req.user.teacherId},
        {teacherIds:req.user.teacherId}
      ]
    }).select('-password');
    
    const results = [];
    for(let stu of students){
      const completions = await TopicCompletion.countDocuments({studentId:stu._id});
      const practices = await PracticeScore.find({studentId:stu._id});
      const avg = practices.length ? Math.round(practices.reduce((a,b)=>a+b.score,0)/practices.length) : 0;
      // Determine if primary or added teacher
      const isPrimary = stu.teacherId===req.user.teacherId;
      results.push({student:stu, completions, practicesCount:practices.length, avgPractice:avg, isPrimary, allTeachers:stu.teacherIds||[stu.teacherId]});
    }
    res.json(results);
  }catch(e){
    console.error(e);
    res.status(500).json({msg:'Server error'});
  }
});

router.get('/completions', auth, async (req,res)=>{
  try{
    const list = await TopicCompletion.find({studentId:req.user._id});
    res.json(list);
  }catch(e){ res.status(500).json({msg:'Server error'}); }
});

router.get('/practice', auth, async (req,res)=>{
  try{
    const list = await PracticeScore.find({studentId:req.user._id});
    res.json(list);
  }catch(e){ res.status(500).json({msg:'Server error'}); }
});

router.post('/completion', auth, async (req,res)=>{
  try{
    const {topicId, subject, grade} = req.body;
    if(!topicId) return res.status(400).json({msg:'topicId required'});
    const exists = await TopicCompletion.findOne({studentId:req.user._id, topicId});
    if(exists) return res.json(exists);
    const comp = await TopicCompletion.create({studentId:req.user._id, topicId, subject, grade});
    res.json(comp);
  }catch(e){ res.status(500).json({msg:'Server error'}); }
});

router.post('/practice', auth, async (req,res)=>{
  try{
    const {topicId, subject, score, total, answers} = req.body;
    const entry = await PracticeScore.create({studentId:req.user._id, topicId, subject, score, total, answers});
    res.json(entry);
  }catch(e){ res.status(500).json({msg:'Server error'}); }
});

module.exports = router;

