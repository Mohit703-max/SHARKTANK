const Job = require('../models/Job');

const Pitch=require('../models/Pitch');
const AppError=require('../utils/AppError.js');


  const createJob=async(innovatorID,pitchId,dto)=>{
    const post= await Pitch.findOne({
  _id:pitchId,
  innovator:innovatorID
});
if(!post)
    throw new AppError('Pitch not found',404);
  
  if(post.fundingStatus!=='funded'){
        throw new AppError('Only funded companies can post',403);
  }
    const job=await Job.create({
      ...dto,postedBy:innovatorID,pitch:pitchId
    });
    return job;
  };
  const getOpenJobs = async ({ page = 1, limit = 10, jobType, location }) => {
  
  const filter = { status: 'open' };
  
  if (jobType) filter.jobType = jobType;
  if (location) filter.location = location;

  const skip = (page - 1) * limit;

  const [jobs, total] = await Promise.all([
    Job.find(filter)
      .populate('postedBy', 'name bio avatarUrl')
      .populate('pitch', 'title industry fundingGoal')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Job.countDocuments(filter)
  ]);

  return {
    jobs,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1
    }
  };
};