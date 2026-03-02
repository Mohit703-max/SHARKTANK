const mongoose = require('mongoose');
const{Schema}=mongoose;
const JobSchema= new Schema(
  {
  title : {
    type:String,
    required:[true,'job title required'],
    trim:true,
    minlength:[5,'min length shd be 5'],
    maxlength:[120,'max length is 120']
  },
  description:{
    type:String,
    required:[true,'description is required'],
    trim:true,
    minlength:[30,'min length shd be 5'],
    maxlength:[5000,'max length shd be ']
  },
  location:{
    type:String,
    required:[true,'location is required'],
    trim:true
  },
  jobtype:{
    type:String,
    enum:['full-time','part-time','contract','internship'],
     required:[true,'jobtype is required']
  },
  salary:{
    type:String
  },
  experience:{
    type:String
  },
  skills:[String],
  status:{
    type:String,
    enum:['open','closed','paused'],
    default:'open'
  },
  postedBy:{
    type:Schema.Types.ObjectId,
    ref:'User',
    required:true
  },
  pitch:{
    type:Schema.Types.ObjectId,
    ref:'Pitch',
    required:true
  }
},
  {
    timestamps:true,
    toJSON:{virtuals:true},
    toObject:{virtuals:true}
  }
)
JobSchema.index({status:1,postedBy:1});
JobSchema.index({pitch:1});
const Job=mongoose.model('Job',JobSchema);
module.exports=Job;