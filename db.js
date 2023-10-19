const mongoose = require('mongoose');
require("dotenv").config();

const mongoURI = process.env.MONGO_URI; // Assuming the environment variable is named MONGO_URI

const connectToMongoDB= async() =>{
  try {
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  }
}

module.exports=connectToMongoDB;
