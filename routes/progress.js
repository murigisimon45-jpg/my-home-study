const express = require('express');
const auth = require('../middleware/auth');
const { TopicCompletion, PracticeScore, ConceptUnderstand } = require('../models/Progress');
const User = require('../models/User');
const router = express.Router();

// Get students for teacher with their progress aggregates
router.get('/teacher/students', auth, async (req,res)=>{
  try{
    if(req.user.role!=='teacher') return res.status(403).json({msg:'Only teachers'});
    const students = await User.find({role:'student', teacherId:req.user.teacherId}).select('-password');
    const results = [];
    for(let stu of students){
      const completions = await TopicCompletion.countDocuments({studentId:stu._id});
      const practices = await PracticeScore.find({studentId:stu._id});
      const avg = practices.length ? Math.round(practices.reduce((a,b)=>a+b.score,0)/practices.length) : 0;
      results.push({student:stu, completions, practicesCount:practices.length, avgPractice:avg});
    }
    res.json(results);
  }catch(e){ res.status(500).json({msg:'Server error'}); }
});

// Topic completions
router.get('/completions', auth, async (req,res)=>{
  const list = await TopicCompletion.find({studentId:req.user._id});
  res.json(list);
});

router.post('/completions', auth, async (req,res)=>{
  try{
    const {topicId} = req.body;
    const exists = await TopicCompletion.findOne({studentId:req.user._id, topicId});
    if(exists) return res.json(exists);
    const doc = await TopicCompletion.create({studentId:req.user._id, topicId});
    res.json(doc);
  }catch(e){ res.status(500).json({msg:'Server error'}); }
});

// Practice scores
router.get('/practice', auth, async (req,res)=>{
  const list = await PracticeScore.find({studentId:req.user._id}).sort({completedAt:-1});
  res.json(list);
});

router.post('/practice', auth, async (req,res)=>{
  try{
    const {topicId, score} = req.body;
    const doc = await PracticeScore.create({studentId:req.user._id, topicId, score});
    res.json(doc);
  }catch(e){ res.status(500).json({msg:'Server error'}); }
});

// Concept understanding
router.get('/concepts/:topicId', auth, async (req,res)=>{
  const doc = await ConceptUnderstand.findOne({studentId:req.user._id, topicId:req.params.topicId});
  res.json(doc||{understood:[]});
});

router.post('/concepts', auth, async (req,res)=>{
  try{
    const {topicId, understood} = req.body;
    let doc = await ConceptUnderstand.findOne({studentId:req.user._id, topicId});
    if(!doc) doc = await ConceptUnderstand.create({studentId:req.user._id, topicId, understood});
    else { doc.understood = understood; await doc.save(); }
    res.json(doc);
  }catch(e){ res.status(500).json({msg:'Server error'}); }
});

module.exports = router;