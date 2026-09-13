import mongoose from "mongoose"
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
    // It terminates the Node.js process because our application cannot function properly without its database.
    // it tells the node.js to immeditely stop running the app and singnal to failure the os.
  }
};

export default connectDB;