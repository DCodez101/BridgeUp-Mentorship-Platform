const mongoose = require('mongoose');

const connectToDatabase = async () => {
    
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("❌ MONGO_URI is undefined!");
    return;
  }
  console.log("MONGO_URI from .env:", process.env.MONGO_URI);
  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log("✅ Connected to MongoDB");
};

module.exports = connectToDatabase;
