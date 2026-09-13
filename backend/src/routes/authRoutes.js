
// import express from "express";
// import { registerUser,loginUser,getMe } from "../controllers/authController.js";
// import protect from "../middleware/authMiddleware.js";

// const router = express.Router();

// router.post("/register", registerUser);
// router.post("/login",loginUser);
// router.get("/me",protect,getMe);

// export default router;

import express from "express";

import {
  registerUser,
  loginUser,
  getMe,
} from "../controllers/authController.js";

import protect from "../middleware/authMiddleware.js";
import validate from "../middleware/validateMiddleware.js";

import {
  registerSchema,
  loginSchema,
} from "../validators/authValidator.js";

const router = express.Router();

router.post(
  "/register",
  validate(registerSchema),
  registerUser
);

router.post(
  "/login",
  validate(loginSchema),
  loginUser
);

router.get(
  "/me",
  protect,
  getMe
);

export default router;