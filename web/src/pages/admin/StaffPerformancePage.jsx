import React, { useState, useEffect } from "react";
import {
  Users,
  TrendingUp,
  Award,
  Clock,
  DollarSign,
  ShoppingCart,
  Activity,
  BarChart3,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { getStaffPerformance } from "../../services/dashboardService";
import Toast from "../../components/common/SnackbarComponent";
import "../../styles/admin/StaffPerformancePageStyle.css";

const StaffPerformancePage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30");
  const [toast, setToast] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    fetchData();
  }, [period]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const result = await getStaffPerformance({ period: parseInt(period) });
      console.log("Staff Performance Result:", result);
      const processedData = result.result || result.data || result;
      console.log("Processed Data:", processedData);
      setData(processedData || {});
    } catch (error) {
      showToast("Failed to load staff performance data", "error");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, severity = "success") => {
    setToast({ open: true, message, severity });
  };

  if (loading) {
    return (
      <div className="staff-performance-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading staff performance...</p>
        </div>
      </div>
    );
  }

  const safeData = data || {};
  const cashierPerformance = safeData.cashierPerformance || [];
  const activityCounts =
    safeData.userActivityCount || safeData.activityCounts || [];

  const totalOrders = cashierPerformance.reduce(
    (sum, c) => sum + (c.totalOrders || c.ordersProcessed || 0),
    0,
  );
  const totalRevenue = cashierPerformance.reduce(
    (sum, c) => sum + (c.totalRevenue || 0),
    0,
  );
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const activityChartData = activityCounts.slice(0, 10).map((act) => ({
    name: act.userName || "Unknown",
    count: act.activityCount,
  }));

  return (
    <div className="staff-performance-page">
      <Toast
        open={toast.open}
        message={toast.message}
        severity={toast.severity}
        onClose={() => setToast({ ...toast, open: false })}
      />

      <div className="page-header">
        <div className="header-content">
          <Users className="header-icon" size={32} />
          <div>
            <h1>Staff Performance</h1>
            <p>Monitor team productivity and performance metrics</p>
          </div>
        </div>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="period-select"
        >
          <option value="7">Last 7 Days</option>
          <option value="30">Last 30 Days</option>
          <option value="90">Last 90 Days</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card green">
          <div className="card-icon">
            <ShoppingCart size={24} />
          </div>
          <div className="card-content">
            <p className="card-label">Total Orders</p>
            <h3 className="card-value">{totalOrders.toLocaleString()}</h3>
          </div>
        </div>

        <div className="summary-card blue">
          <div className="card-icon">
            <DollarSign size={24} />
          </div>
          <div className="card-content">
            <p className="card-label">Total Revenue</p>
            <h3 className="card-value">
              ₱
              {totalRevenue.toLocaleString("en-PH", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </h3>
          </div>
        </div>

        <div className="summary-card purple">
          <div className="card-icon">
            <Award size={24} />
          </div>
          <div className="card-content">
            <p className="card-label">Avg Order Value</p>
            <h3 className="card-value">
              ₱
              {avgOrderValue.toLocaleString("en-PH", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </h3>
          </div>
        </div>

        <div className="summary-card orange">
          <div className="card-icon">
            <Activity size={24} />
          </div>
          <div className="card-content">
            <p className="card-label">Active Staff</p>
            <h3 className="card-value">{cashierPerformance.length}</h3>
          </div>
        </div>
      </div>

      <div className="performance-grid">
        {/* Cashier Performance Table */}
        <div className="performance-card wide">
          <div className="card-header">
            <div className="header-left">
              <Award size={20} />
              <h3>Cashier Performance Rankings</h3>
            </div>
          </div>

          <div className="performance-table">
            <table>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Cashier</th>
                  <th>Orders Processed</th>
                  <th>Total Revenue</th>
                  <th>Avg Order Value</th>
                  <th>Performance</th>
                </tr>
              </thead>
              <tbody>
                {cashierPerformance.map((cashier, index) => {
                  const ordersProcessed =
                    cashier.totalOrders || cashier.ordersProcessed || 0;
                  const avgOrder =
                    ordersProcessed > 0
                      ? cashier.totalRevenue / ordersProcessed
                      : 0;
                  const performanceScore = totalRevenue
                    ? ((cashier.totalRevenue / totalRevenue) * 100).toFixed(1)
                    : "0.0";

                  return (
                    <tr key={cashier.cashierId || cashier._id || index}>
                      <td>
                        <span className={`rank-badge rank-${index + 1}`}>
                          #{index + 1}
                        </span>
                      </td>
                      <td>
                        <div className="cashier-info">
                          <div className="cashier-avatar">
                            {cashier.cashierName?.charAt(0) || "?"}
                          </div>
                          <div>
                            <div className="cashier-name">
                              {cashier.cashierName || "Unknown Staff"}
                            </div>
                            <div className="cashier-email">
                              {cashier.cashierEmail || "—"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="orders">
                        {ordersProcessed.toLocaleString()}
                      </td>
                      <td className="revenue">
                        ₱
                        {cashier.totalRevenue.toLocaleString("en-PH", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="avg-order">
                        ₱
                        {avgOrder.toLocaleString("en-PH", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td>
                        <div className="performance-bar-container">
                          <div
                            className="performance-bar"
                            style={{ width: `${performanceScore}%` }}
                          ></div>
                          <span className="performance-value">
                            {performanceScore}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Activity Rankings */}
        <div className="performance-card">
          <div className="card-header">
            <div className="header-left">
              <BarChart3 size={20} />
              <h3>Activity Rankings</h3>
            </div>
          </div>

          <div className="chart-container">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={activityChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" stroke="#6b7280" fontSize={12} />
                <YAxis
                  dataKey="name"
                  type="category"
                  stroke="#6b7280"
                  fontSize={12}
                  width={100}
                />
                <Tooltip
                  contentStyle={{
                    background: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                />
                <Bar
                  dataKey="count"
                  fill="#5c6f2b"
                  radius={[0, 8, 8, 0]}
                  label={{ position: "right", fontSize: 12 }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Performers */}
        <div className="performance-card">
          <div className="card-header">
            <div className="header-left">
              <TrendingUp size={20} />
              <h3>Top 5 Performers</h3>
            </div>
          </div>

          <div className="top-performers-list">
            {cashierPerformance.slice(0, 5).map((cashier, index) => (
              <div
                key={cashier.cashierId || cashier._id || index}
                className="performer-item"
              >
                <div className="performer-rank">
                  {index === 0 && "🥇"}
                  {index === 1 && "🥈"}
                  {index === 2 && "🥉"}
                  {index > 2 && `#${index + 1}`}
                </div>
                <div className="performer-info">
                  <div className="performer-name">
                    {cashier.cashierName || "Unknown Staff"}
                  </div>
                  <div className="performer-stats">
                    <span>
                      {cashier.totalOrders || cashier.ordersProcessed || 0}{" "}
                      orders
                    </span>
                    <span className="separator">•</span>
                    <span className="revenue">
                      ₱
                      {cashier.totalRevenue.toLocaleString("en-PH", {
                        maximumFractionDigits: 0,
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffPerformancePage;
