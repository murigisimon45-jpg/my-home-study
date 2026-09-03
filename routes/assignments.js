const express = require('express');
const auth = require('../middleware/auth');
const Assignment = require('../models/Assignment');
const router = express.Router();

// Get assignments - for student filter by ALL teacherIds + grade, for teacher filter by teacherId
router.get('/', auth, async (req,res)=>{
  try{
    const user = req.user;
    let filter={};
    if(user.role==='teacher'){
      filter.teacherId = user.teacherId;
    } else {
      // Student: get assignments from ALL teachers they have added
      const teacherIds = user.teacherIds && user.teacherIds.length ? user.teacherIds : [user.teacherId];
      filter = {teacherId:{$in:teacherIds}, grade:user.grade};
    }
    const list = await Assignment.find(filter).sort({createdAt:-1});
    res.json(list);
  }catch(e){ console.error(e); res.status(500).json({msg:'Server error'}); }
});

router.post('/', auth, async (req,res)=>{
  try{
    if(req.user.role!=='teacher') return res.status(403).json({msg:'Only teachers'});
    const {title,subject,grade,description,totalMarks,dueDate,questions} = req.body;
    if(!title) return res.status(400).json({msg:'Title required'});
    const total = totalMarks || (questions?questions.reduce((s,q)=>s+(parseInt(q.marks)||0),0):0);
    const ass = await Assignment.create({
      teacherId:req.user.teacherId,
      title, subject, grade, description, totalMarks:total, dueDate, questions
    });
    res.json(ass);
  }catch(e){ console.error(e); res.status(500).json({msg:'Server error'}); }
});

router.put('/:id', auth, async (req,res)=>{
  try{
    if(req.user.role!=='teacher') return res.status(403).json({msg:'Only teachers'});
    const ass = await Assignment.findById(req.params.id);
    if(!ass || ass.teacherId!==req.user.teacherId) return res.status(403).json({msg:'Not yours'});
    Object.assign(ass, req.body);
    if(req.body.questions){
      ass.totalMarks = req.body.totalMarks || req.body.questions.reduce((s,q)=>s+(parseInt(q.marks)||0),0);
    }
    await ass.save();
    res.json(ass);
  }catch(e){ res.status(500).json({msg:'Server error'}); }
});

router.delete('/:id', auth, async (req,res)=>{
  try{
    if(req.user.role!=='teacher') return res.status(403).json({msg:'Only teachers'});
    const ass = await Assignment.findById(req.params.id);
    if(!ass || ass.teacherId!==req.user.teacherId) return res.status(403).json({msg:'Not yours'});
    await Assignment.findByIdAndDelete(req.params.id);
    res.json({msg:'Deleted'});
  }catch(e){ res.status(500).json({msg:'Server error'}); }
});

module.exports = router;

