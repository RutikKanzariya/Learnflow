import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "./models/User.js";

dotenv.config({ path: "../.env" });
import dns from "dns";
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const testUser = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected");

    const user = await User.create({
      name: "Test Student",
      email: "test@example.com",
      passwordHash: "temporary-hash",
    });

    console.log("User created:", user);

    await mongoose.disconnect();
  } catch (error) {
    console.error("Error:", error.message);
  }
};

testUser();