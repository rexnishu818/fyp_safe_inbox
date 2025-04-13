import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { 
  AreaChart, Area, BarChart, Bar, PieChart, Pie, 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, Cell 
} from "recharts";
import { BarChart2, Users, ShieldAlert, CheckCircle, Calendar, TrendingUp, Menu, X } from 'lucide-react';
import './Dashboard.css';
import { Link } from "react-router-dom";

const Dashboard = () => {
  const [totalRequests, setTotalRequests] = useState(0);
  const [spamCount, setSpamCount] = useState(0);
  const [hamCount, setHamCount] = useState(0);
  const [chartData, setChartData] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  // Fetch token from local storage
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      navigate("/login");
    }
    const fetchData = async () => {
      try {
        // Fetch total requests
        const totalRes = await axios.get(
          "http://localhost:5001/api/dashboard/total-requests",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setTotalRequests(totalRes.data.totalRequests);

        // Fetch spam count
        const spamRes = await axios.get(
          "http://localhost:5001/api/dashboard/spam-count",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setSpamCount(spamRes.data.spamCount);

        // Fetch ham count
        const hamRes = await axios.get(
          "http://localhost:5001/api/dashboard/ham-count",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setHamCount(hamRes.data.hamCount);

        // Fetch chart data
        const chartRes = await axios.get(
          "http://localhost:5001/api/dashboard/chart-data",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        // Format data for charts
        const formattedData = chartRes.data.chartData.map((item) => ({
          ...item,
          date: new Date(item.date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
        }));
        setChartData(formattedData);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        alert("Failed to load dashboard data. Please try again.");
      }
    };
    fetchData();
  }, [token, navigate]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // ✅ Logout Functionality
  const handleLogout = async () => {
    try {
      // Optional: Call the logout endpoint
      await axios.post("http://localhost:5001/api/auth/logout", null, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Clear token and userId from local storage
      localStorage.removeItem("token");
      localStorage.removeItem("userId");

      // Redirect to login page
      navigate("/login");
    } catch (err) {
      console.error("Error during logout:", err);
      alert("Failed to log out. Please try again.");
    }
  };

  // Data for pie chart
  const pieData = [
    { name: "Spam", value: spamCount, color: "#ff6b6b" },
    { name: "Ham", value: hamCount, color: "#4ecdc4" },
  ];

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <h2>SafeInbox</h2>
          <button className="close-sidebar" onClick={toggleSidebar}>
            <X size={20} />
          </button>
        </div>
        <ul className="sidebar-menu">
          <li className="active">
            <BarChart2 size={18} /> Dashboard
          </li>
          <Link to="/">
            <li className="active1">
              <ShieldAlert size={18} /> Predict
            </li>
          </Link>
          {/* ✅ Add Logout Button */}
          <li className="logout" onClick={handleLogout}>
            <TrendingUp size={18} /> Logout
          </li>
        </ul>
      </div>
      {/* Main Content */}
      <div className="main-content">
        <div className="top-bar">
          <button className="menu-button" onClick={toggleSidebar}>
            <Menu size={24} />
          </button>
          <h1>Dashboard</h1>
          <div className="user-profile">
            <div className="avatar">SI</div>
          </div>
        </div>
        {/* Stats Cards */}
        <div className="stats-container">
          <div className="stat-card">
            <div className="stat-icon total">
              <BarChart2 size={24} />
            </div>
            <div className="stat-details">
              <h3>Total Requests</h3>
              <p>{totalRequests}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon spam">
              <ShieldAlert size={24} />
            </div>
            <div className="stat-details">
              <h3>Spam Count</h3>
              <p>{spamCount}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon ham">
              <CheckCircle size={24} />
            </div>
            <div className="stat-details">
              <h3>Ham Count</h3>
              <p>{hamCount}</p>
            </div>
          </div>
        </div>
        {/* Charts Section */}
        <div className="charts-container">
          <div className="chart-card large">
            <h3>Classification Trends (Last 7 Days)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorSpam" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff6b6b" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#ff6b6b" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="colorHam" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4ecdc4" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#4ecdc4" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" />
                <YAxis />
                <CartesianGrid strokeDasharray="3 3" />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="spam"
                  stroke="#ff6b6b"
                  fillOpacity={1}
                  fill="url(#colorSpam)"
                />
                <Area
                  type="monotone"
                  dataKey="ham"
                  stroke="#4ecdc4"
                  fillOpacity={1}
                  fill="url(#colorHam)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-row">
            <div className="chart-card">
              <h3>Distribution</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="chart-card">
              <h3>Daily Comparison</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="spam" fill="#ff6b6b" />
                  <Bar dataKey="ham" fill="#4ecdc4" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
