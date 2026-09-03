const express = require('express');
const auth = require('../middleware/auth');
const Submission = require('../models/Submission');
const Assignment = require('../models/Assignment');
const router = express.Router();

// Student: get own submissions, Teacher: get all submissions for his assignments
router.get('/', auth, async (req,res)=>{
  try{
    if(req.user.role==='teacher'){
      const assignments = await Assignment.find({teacherId:req.user.teacherId}).select('_id');
      const ids = assignments.map(a=>a._id);
      const subs = await Submission.find({assignmentId:{$in:ids}}).populate('studentId','firstName lastName email grade').sort({submittedAt:-1});
      res.json(subs);
    }else{
      const subs = await Submission.find({studentId:req.user._id}).sort({submittedAt:-1});
      res.json(subs);
    }
  }catch(e){ res.status(500).json({msg:'Server error'}); }
});

router.post('/', auth, async (req,res)=>{
  try{
    const {assignmentId, answers, status} = req.body;
    if(!assignmentId) return res.status(400).json({msg:'assignmentId required'});
    let sub = await Submission.findOne({assignmentId, studentId:req.user._id});
    if(sub){
      if(sub.status==='Submitted' || sub.status==='Graded') return res.status(400).json({msg:'Already submitted, waiting for grade'});
      sub.answers = answers || sub.answers;
      sub.status = status || sub.status;
      sub.submittedAt = new Date();
      await sub.save();
      return res.json(sub);
    }
    sub = await Submission.create({
      assignmentId,
      assignmentIdStr:assignmentId,
      studentId:req.user._id,
      answers,
      status: status||'In Progress'
    });
    res.json(sub);
  }catch(e){ console.error(e); res.status(500).json({msg:'Server error'}); }
});

// Grade
router.put('/:id/grade', auth, async (req,res)=>{
  try{
    if(req.user.role!=='teacher') return res.status(403).json({msg:'Only teachers'});
    const sub = await Submission.findById(req.params.id);
    if(!sub) return res.status(404).json({msg:'Not found'});
    const assignment = await Assignment.findById(sub.assignmentId);
    if(!assignment || assignment.teacherId!==req.user.teacherId) return res.status(403).json({msg:'Not yours'});
    const {perQuestion, feedback, score} = req.body;
    sub.perQuestion = perQuestion;
    sub.feedback = feedback;
    sub.score = score;
    sub.status = 'Graded';
    sub.gradedAt = new Date();
    await sub.save();
    res.json(sub);
  }catch(e){ res.status(500).json({msg:'Server error'}); }
});

module.exports = router;