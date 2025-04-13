const express = require("express");
const mongoose = require("mongoose");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());
app.use(cors({ origin: "*" })); // Allow all origins

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

//  Define User Schema - Removed role field as requested
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model("User", UserSchema);

// Define Prediction Schema
const PredictionSchema = new mongoose.Schema({
  message: { type: String, required: true },
  prediction: { type: String, required: true },
  confidence: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});
const Prediction = mongoose.model("Prediction", PredictionSchema);

// Middleware for Authentication
const authenticate = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token)
    return res.status(401).json({ error: "Unauthorized: No token provided" });

  try {
    const decoded = jwt.verify(token.split(" ")[1], process.env.JWT_SECRET);
    req.user = decoded; // Attach user info to the request
    next();
  } catch (err) {
    res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
};

// Register User Route - Updated to only use username/password
app.post("/api/auth/register", async (req, res) => {
  try {
    console.log("Received registration request:", req.body);

    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: "Username already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("Hashed password:", hashedPassword);

    const user = new User({
      username,
      password: hashedPassword,
    });

    await user.save();
    console.log("User registered successfully:", user);

    res.json({ message: "User registered successfully" });
  } catch (err) {
    console.error("Error during registration:", err.message);
    res.status(500).json({ error: "Internal server error", details: err.message });
  }
});

// Login User Route - Updated for username/password
app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ error: "Invalid username or password" });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ token, userId: user._id });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Internal server error", details: err.message });
  }
});

// Classify Email Route
app.post("/classify-email", async (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Email content is required" });
  }
  try {
    const response = await axios.post("http://localhost:5000/predict", {
      message,
    });
    const data = response.data;
    const prediction = await Prediction.create({
      confidence: data.confidence,
      message: data.message,
      prediction: data.prediction,
    });
    res.json({ prediction });
  } catch (err) {
    res.status(500).json({ error: "Error classifying email", details: err.message });
  }
});

// Dashboard API endpoints
// Get total count of classification requests
app.get("/api/dashboard/total-requests", authenticate, async (req, res) => {
  try {
    const count = await Prediction.countDocuments();
    res.json({ totalRequests: count });
  } catch (err) {
    res.status(500).json({ error: "Error fetching data", details: err.message });
  }
});

// Get count of spam emails - FIXED: Properly case-insensitive query
app.get("/api/dashboard/spam-count", authenticate, async (req, res) => {
  try {
    // Use case-insensitive regex to match both "spam" and "SPAM"
    const count = await Prediction.countDocuments({ 
      prediction: { $regex: new RegExp("^spam$", "i") } 
    });
    res.json({ spamCount: count });
  } catch (err) {
    res.status(500).json({ error: "Error fetching data", details: err.message });
  }
});

app.get("/api/dashboard/ham-count", authenticate, async (req, res) => {
  try {
    console.log("Fetching ham count...");
    
    // Use direct comparison with lowercase for better performance
    const count = await Prediction.countDocuments({
      prediction: { $regex: new RegExp("^not spam$", "i") } 
    });
    
    console.log(`Ham count result: ${count}`);
    res.json({ hamCount: count });
  } catch (err) {
    console.error("Error fetching ham count:", err);
    res.status(500).json({ error: "Error fetching data", details: err.message });
  }
});

// Get chart data (last 7 days) - FIXED: Case-insensitive matching for predictions
app.get("/api/dashboard/chart-data", authenticate, async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const predictions = await Prediction.find({ 
      createdAt: { $gte: sevenDaysAgo } 
    }).sort('createdAt');
    
    // Process data for chart
    const chartData = [];
    const dateMap = new Map();
    
    // Initialize date map with zeros for all dates
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dateMap.set(dateStr, { date: dateStr, spam: 0, ham: 0 });
    }
    
    // Count predictions by date and type - FIXED: Case-insensitive comparison
    predictions.forEach(pred => {
      const dateStr = pred.createdAt.toISOString().split('T')[0];
      if (dateMap.has(dateStr)) {
        const entry = dateMap.get(dateStr);
        if (pred.prediction.toLowerCase() === 'spam') {
          entry.spam += 1;
        } else if (pred.prediction.toLowerCase() === 'not spam') {
          entry.ham += 1;
        }
      }
    });
    
    // Convert map to array
    dateMap.forEach(value => chartData.push(value));
    
    // Sort by date
    chartData.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    res.json({ chartData });
  } catch (err) {
    res.status(500).json({ error: "Error fetching chart data", details: err.message });
  }
});

// Logout Route
app.post("/api/auth/logout", (req, res) => {
  // No server-side action needed for JWT logout
  res.json({ message: "Logout successful" });
});
// Start Server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));