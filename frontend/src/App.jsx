import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from './assets/vite.svg';  // Fixed import path for vite.svg
import "./App.css";
import SpamFilterPage from "./pages/Prediction";  // Corrected import for Prediction.jsx
import Login from "./pages/Login";

import AdminDashboard from "./pages/Dashboard";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";

function App() {
  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<SpamFilterPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup/>} />
          <Route path="/dashboard" element={<Dashboard/>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
