import mongoose from 'mongoose';

const uri = "mongodb://debi18348_db_user:h8bLThWwUHNKfOtV@ac-jz55szz-shard-00-00.lq0rwsq.mongodb.net:27017,ac-jz55szz-shard-00-01.lq0rwsq.mongodb.net:27017,ac-jz55szz-shard-00-02.lq0rwsq.mongodb.net:27017/ecopulse?ssl=true&authSource=admin&retryWrites=true&w=majority";

console.log("Attempting to connect to MongoDB Atlas...");
mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 })
  .then(() => {
    console.log("SUCCESS: Connected to MongoDB Atlas successfully!");
    process.exit(0);
  })
  .catch(err => {
    console.error("ERROR connecting to MongoDB Atlas:", err.message);
    process.exit(1);
  });
