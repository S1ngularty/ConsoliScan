import React from "react";
import { TrendingUp, Users, Package, DollarSign } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import "../../styles/admin/DashboardPageStyle.css";
import Toast from "../../components/common/SnackbarComponent";

// Mock data for the last 7 days
const data = [
  { name: "Mon", sales: 4000 },
  { name: "Tue", sales: 3000 },
  { name: "Wed", sales: 5000 },
  { name: "Thu", sales: 2780 },
  { name: "Fri", sales: 1890 },
  { name: "Sat", sales: 2390 },
  { name: "Sun", sales: 3490 },
];

function DashboardPage() {
  const stats = [
    {
      title: "Total Sales",
      value: "$12,450.50",
      icon: <DollarSign />,
      trend: "+12.5%",
      color: "green",
    },
    {
      title: "Active Users",
      value: "1,050",
      icon: <Users />,
      trend: "+3.2%",
      color: "blue",
    },
    {
      title: "Products Sold",
      value: "482",
      icon: <Package />,
      trend: "+18%",
      color: "orange",
    },
    {
      title: "Conversion",
      value: "3.4%",
      icon: <TrendingUp />,
      trend: "-0.5%",
      color: "purple",
    },
  ];

  const [snackbar, setSnackbar] = React.useState({
    open: false,
    message: "",
    severity: "success",
  });

  React.useEffect(() => {
    if (sessionStorage.getItem("isLogin") === "true") {
      showToast("successfully logged in!");
      sessionStorage.clear();
    }
  }, []);

  const showToast = React.useCallback((message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const closeToast = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  return (
    <div className="dashboard-view">
      <Toast
        open={snackbar.open}
        message={snackbar.message}
        handleClose={closeToast}
        severity={snackbar.severity}
      />

      <div className="dashboard-header">
        <h1>Dashboard Overview</h1>
        <button className="report-btn">Generate Report</button>
      </div>

      <div className="stats-grid">
        {stats.map((stat, index) => (
          <div key={index} className="stat-card">
            <div className="stat-content">
              <p className="stat-label">{stat.title}</p>
              <h3 className="stat-value">{stat.value}</h3>
              <p
                className={`stat-trend ${
                  stat.trend.startsWith("+") ? "up" : "down"
                }`}
              >
                {stat.trend} <span>vs last month</span>
              </p>
            </div>
            <div className={`stat-icon-box ${stat.color}`}>{stat.icon}</div>
          </div>
        ))}
      </div>

      <div className="dashboard-details">
        {/* RECHARTS INTEGRATION */}
        <div className="chart-container">
          <div className="placeholder-header">
            <h3>Sales Analytics</h3>
            <select className="chart-select">
              <option>Last 7 Days</option>
            </select>
          </div>

          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00A86B" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00A86B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f0f0f0"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#9ca3af", fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#9ca3af", fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "10px",
                    border: "none",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="#00A86B"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorSales)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="recent-activity">
          <h3>Recent Transactions</h3>
          <ul className="activity-list">
            <li className="activity-item">
              <div className="user-avatar">JD</div>
              <div className="item-info">
                <p className="item-title">Purchase by John Doe</p>
                <p className="item-time">2 mins ago</p>
              </div>
              <p className="item-amount">+$85.50</p>
            </li>
            <li className="activity-item">
              <div className="user-avatar">AS</div>
              <div className="item-info">
                <p className="item-title">New User: Anna Smith</p>
                <p className="item-time">1 hour ago</p>
              </div>
              <p className="item-amount" style={{ color: "#3b82f6" }}>
                Verified
              </p>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
