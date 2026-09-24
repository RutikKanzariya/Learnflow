import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const registerUser = async (req, res) => {
  try {
    const { name, email, password, adminKey } = req.body || {};

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required",
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        message: "User already exists",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Determine the role.
    let role = "student";

    const configuredAdminKey = process.env.ADMIN_KEY;

    // 1. Matching admin key -> admin.
    if (
      configuredAdminKey &&
      adminKey &&
      String(adminKey).trim() === String(configuredAdminKey).trim()
    ) {
      role = "admin";
    }

    // 2. First registered user on the platform -> admin (bootstrap).
    if (role !== "admin") {
      const userCount = await User.countDocuments();
      if (userCount === 0) {
        role = "admin";
      }
    }

    const user = await User.create({
      name,
      email,
      passwordHash,
      role,
    });

    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Registration error:", error.message);

    res.status(500).json({
      message: "Server error",
    });
  }
};


export const loginUser = async (req,res) => {
    try {
        const { email, password } = req.body || {};

        if (!email || !password){
            return res.status(400).json({
                message:"Email and password are required."
            });
        }

        const user = await User.findOne({email});

        if(!user){
            return res.status(401).json({
                message:"Invalid email or password"
            });
        }

        const isPasswordCorrect = await bcrypt.compare(
            password,
            user.passwordHash
        );

        if(!isPasswordCorrect){
            return res.status(401).json({
                message : "Invalid email or password",
            });
        }
        const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);

    res.status(500).json({
      message: "Server error",
    });
    }
}

export const getMe = async (req, res) => {
  res.status(200).json({
    user: req.user,
  });
};