const express = require('express');
const auth = require('../middleware/auth');
const Assignment = require('../models/Assignment');
const router = express.Router();

// Get assignments - for student filter by teacherId+grade, for teacher filter by teacherId
router.get('/', auth, async (req,res)=>{
  try{
    const user = req.user;
    let filter={};
    if(user.role==='teacher') filter.teacherId = user.teacherId;
    else filter = {teacherId:user.teacherId, grade:user.grade};
    const list = await Assignment.find(filter).sort({createdAt:-1});
    res.json(list);
  }catch(e){ res.status(500).json({msg:'Server error'}); }
});

router.post('/', auth, async (req,res)=>{
  try{
    if(req.user.role!=='teacher') return res.status(403).json({msg:'Only teachers'});
    const {title,subject,grade,description,totalMarks,dueDate,questions} = req.body;
    if(!title) return res.status(400).json({msg:'Title required'});
    const ass = await Assignment.create({
      teacherId:req.user.teacherId,
      teacherName:req.user.fullName,
      teacherUserId:req.user._id,
      title, subject, grade, description, totalMarks, dueDate, questions
    });
    res.json(ass);
  }catch(e){ console.error(e); res.status(500).json({msg:'Server error'}); }
});

router.delete('/:id', auth, async (req,res)=>{
  try{
    const ass = await Assignment.findById(req.params.id);
    if(!ass) return res.status(404).json({msg:'Not found'});
    if(ass.teacherId!==req.user.teacherId) return res.status(403).json({msg:'Not yours'});
    await ass.deleteOne();
    res.json({ok:true});
  }catch(e){ res.status(500).json({msg:'Server error'}); }
});

module.exports = router;