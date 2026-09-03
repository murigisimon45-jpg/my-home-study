const mongoose = require('mongoose');

const TopicCompletionSchema = new mongoose.Schema({
  studentId:{type:mongoose.Schema.Types.ObjectId, ref:'User', required:true},
  topicId:{type:String, required:true},
  completedAt:{type:Date, default:Date.now}
});
TopicCompletionSchema.index({studentId:1, topicId:1}, {unique:true});

const PracticeScoreSchema = new mongoose.Schema({
  studentId:{type:mongoose.Schema.Types.ObjectId, ref:'User', required:true},
  topicId:String,
  score:Number,
  completedAt:{type:Date, default:Date.now}
});

const ConceptUnderstandSchema = new mongoose.Schema({
  studentId:{type:mongoose.Schema.Types.ObjectId, ref:'User', required:true},
  topicId:String,
  understood:[Number]
});

module.exports = {
  TopicCompletion: mongoose.model('TopicCompletion', TopicCompletionSchema),
  PracticeScore: mongoose.model('PracticeScore', PracticeScoreSchema),
  ConceptUnderstand: mongoose.model('ConceptUnderstand', ConceptUnderstandSchema)
};