import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  Package,
  AlertTriangle,
  Clock,
  BarChart3,
  Activity,
  ShoppingBag,
  Zap,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { getPredictiveAnalytics } from "../../services/dashboardService";
import Toast from "../../components/common/SnackbarComponent";
import "../../styles/admin/PredictiveAnalyticsPageStyle.css";

const PredictiveAnalyticsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const result = await getPredictiveAnalytics();
      console.log("Predictive Analytics Result:", result);
      const processedData = result.result || result.data || result;
      console.log("Processed Data:", processedData);
      setData(processedData || {});
    } catch (error) {
      showToast("Failed to load predictive analytics", "error");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, severity = "success") => {
    setToast({ open: true, message, severity });
  };

  if (loading) {
    return (
      <div className="predictive-analytics-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading predictive analytics...</p>
        </div>
      </div>
    );
  }

  const safeData = data || {};
  const salesForecast =
    safeData.salesForecast || safeData.historicalTrend || [];
  const peakHours = safeData.peakHours || [];
  const reorderRecommendations =
    safeData.inventoryReorderRecommendations ||
    safeData.reorderRecommendations ||
    [];
  const forecastSummary = safeData.forecast || {};

  const forecastData = salesForecast.map((item) => ({
    date: new Date(
      item.date ||
        (item._id
          ? `${item._id.year}-${String(item._id.month).padStart(2, "0")}-${String(
              item._id.day,
            ).padStart(2, "0")}`
          : new Date().toISOString()),
    ).toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
    }),
    forecast: item.forecastedSales || item.dailyRevenue || 0,
  }));

  const peakHoursData = peakHours.map((item) => ({
    hour: `${item.hour || item._id || 0}:00`,
    orders: item.orderCount,
  }));

  const totalReorderItems = reorderRecommendations.length;
  const criticalStock = reorderRecommendations.filter(
    (item) => item.stock <= 10,
  ).length;

  return (
    <div className="predictive-analytics-page">
      <Toast
        open={toast.open}
        message={toast.message}
        severity={toast.severity}
        onClose={() => setToast({ ...toast, open: false })}
      />

      <div className="page-header">
        <div className="header-content">
          <Activity className="header-icon" size={32} />
          <div>
            <h1>Predictive Analytics</h1>
            <p>AI-powered forecasting and insights</p>
          </div>
        </div>
        <button className="refresh-btn" onClick={fetchData}>
          <Zap size={18} />
          Refresh Data
        </button>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card blue">
          <div className="card-icon">
            <TrendingUp size={24} />
          </div>
          <div className="card-content">
            <p className="card-label">30-Day Forecast</p>
            <h3 className="card-value">
              ₱
              {(
                forecastSummary.projectedMonthlyRevenue ||
                salesForecast.reduce(
                  (sum, item) =>
                    sum + (item.forecastedSales || item.dailyRevenue || 0),
                  0,
                )
              ).toLocaleString("en-PH", {
                maximumFractionDigits: 0,
              })}
            </h3>
            <p className="card-sublabel">Estimated Revenue</p>
          </div>
        </div>

        <div className="summary-card orange">
          <div className="card-icon">
            <AlertTriangle size={24} />
          </div>
          <div className="card-content">
            <p className="card-label">Reorder Alerts</p>
            <h3 className="card-value">{totalReorderItems}</h3>
            <p className="card-sublabel">
              {criticalStock > 0 ? `${criticalStock} Critical` : "None"}
            </p>
          </div>
        </div>

        <div className="summary-card purple">
          <div className="card-icon">
            <Clock size={24} />
          </div>
          <div className="card-content">
            <p className="card-label">Peak Hour</p>
            <h3 className="card-value">
              {peakHours[0]?.hour || peakHours[0]?._id || 0}:00
            </h3>
            <p className="card-sublabel">
              {peakHours[0]?.orderCount || 0} orders
            </p>
          </div>
        </div>

        <div className="summary-card green">
          <div className="card-icon">
            <ShoppingBag size={24} />
          </div>
          <div className="card-content">
            <p className="card-label">Avg Daily Orders</p>
            <h3 className="card-value">
              {forecastSummary.avgDailyOrders
                ? Math.round(forecastSummary.avgDailyOrders)
                : salesForecast.length > 0
                  ? Math.round(
                      salesForecast.reduce(
                        (sum, item) =>
                          sum + (item.orderCount || item.forecastedSales || 0),
                        0,
                      ) / salesForecast.length,
                    )
                  : 0}
            </h3>
            <p className="card-sublabel">Next 30 Days</p>
          </div>
        </div>
      </div>

      <div className="analytics-grid">
        {/* Sales Forecast */}
        <div className="analytics-card wide">
          <div className="card-header">
            <div className="header-left">
              <TrendingUp size={20} />
              <h3>Sales Forecast (Next 30 Days)</h3>
            </div>
            <div className="forecast-badge">
              <Activity size={16} />
              AI-Powered
            </div>
          </div>

          <div className="chart-container large">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={forecastData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  stroke="#6b7280"
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                  formatter={(value) =>
                    `₱${value.toLocaleString("en-PH", {
                      minimumFractionDigits: 2,
                    })}`
                  }
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="forecast"
                  stroke="#5c6f2b"
                  strokeWidth={3}
                  dot={{ fill: "#5c6f2b", r: 4 }}
                  name="Forecasted Sales"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="forecast-note">
            <p>
              <strong>Note:</strong> Forecast based on 90-day historical sales
              data and seasonal trends
            </p>
          </div>
        </div>

        {/* Peak Hours */}
        <div className="analytics-card">
          <div className="card-header">
            <div className="header-left">
              <Clock size={20} />
              <h3>Peak Hours Analysis</h3>
            </div>
          </div>

          <div className="chart-container">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={peakHoursData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="hour" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                />
                <Bar
                  dataKey="orders"
                  fill="#7c3aed"
                  radius={[8, 8, 0, 0]}
                  name="Orders"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="peak-summary">
            <p>
              Schedule more staff during{" "}
              <strong>
                {peakHours[0]?.hour || peakHours[0]?._id || 0}:00 -{" "}
                {(peakHours[0]?.hour || peakHours[0]?._id || 0) + 2}:00
              </strong>
            </p>
          </div>
        </div>

        {/* Inventory Reorder Recommendations */}
        <div className="analytics-card">
          <div className="card-header">
            <div className="header-left">
              <Package size={20} />
              <h3>Inventory Reorder Alerts</h3>
            </div>
            <span className="alert-count">{totalReorderItems}</span>
          </div>

          <div className="reorder-table">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Stock</th>
                  <th>Avg Daily Sales</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {reorderRecommendations.slice(0, 10).map((item) => (
                  <tr key={item.productId}>
                    <td>
                      <div className="product-info">
                        <div className="product-name">{item.productName}</div>
                        <div className="product-category">
                          {item.category || "Uncategorized"}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span
                        className={`stock-badge ${
                          item.stock <= 10
                            ? "critical"
                            : item.stock <= 30
                              ? "warning"
                              : "ok"
                        }`}
                      >
                        {item.stock}
                      </span>
                    </td>
                    <td className="avg-sales">
                      {item.avgDailySales.toFixed(1)} units
                    </td>
                    <td>
                      {item.stock <= 10 ? (
                        <span className="status-badge urgent">
                          <AlertTriangle size={14} />
                          Urgent
                        </span>
                      ) : item.stock <= 30 ? (
                        <span className="status-badge warning">
                          Reorder Soon
                        </span>
                      ) : (
                        <span className="status-badge ok">Normal</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PredictiveAnalyticsPage;
