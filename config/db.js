const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {});
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error.message || error);
        console.error('Retrying MongoDB connection in 5 seconds...');
        setTimeout(connectDB, 5000);
    }
};

module.exports = connectDB;