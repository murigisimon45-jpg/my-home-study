require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

const authRoutes = require('./routes/auth');
const assignmentRoutes = require('./routes/assignments');
const submissionRoutes = require('./routes/submissions');
const progressRoutes = require('./routes/progress');

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',') : '*',
  credentials: true
}));
app.use(express.json());

// Serve frontend static files
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api', (req,res)=> res.json({ok:true, msg:'MY HOME STUDY API running', version:'1.0'}));
app.get('/api/health', (req,res)=> res.json({status:'ok', time: new Date()}));

app.use('/api/auth', authRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/progress', progressRoutes);

// For any other route, serve frontend (for SPA)
app.get('*', (req,res)=>{
  if(req.path.startsWith('/api')) return res.status(404).json({msg:'Not found'});
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_URI)
  .then(()=> {
    console.log('MongoDB connected');
    app.listen(PORT, ()=> console.log(`Server running on port ${PORT}`));
  })
  .catch(err=> {
    console.error('MongoDB connection error', err);
    // Still start server for health check even if DB fails
    app.listen(PORT, ()=> console.log(`Server running without DB on port ${PORT}`));
  });