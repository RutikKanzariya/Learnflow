import mongoose from "mongoose";

const errorMiddleware = (err, req, res, next) => {
  console.error("Server error:", err);

  // Invalid MongoDB ObjectId
  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({
      message: "Invalid resource ID",
    });
  }

  // Mongoose validation error
  if (err instanceof mongoose.Error.ValidationError) {
    return res.status(400).json({
      message: "Validation failed",
      errors: Object.values(err.errors).map((error) => error.message),
    });
  }

  // Duplicate MongoDB field
  if (err.code === 11000) {
    return res.status(409).json({
      message: "A resource with this value already exists",
    });
  }

  // Default server error
  return res.status(500).json({
    message: "Internal server error",
  });
};

export default errorMiddleware;