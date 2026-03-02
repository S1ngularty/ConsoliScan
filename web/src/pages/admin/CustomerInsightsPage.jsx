import React, { useState, useEffect } from "react";
import {
  Users,
  TrendingUp,
  Star,
  DollarSign,
  ShoppingBag,
  Calendar,
  Award,
  Target,
} from "lucide-react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { getCustomerInsights } from "../../services/dashboardService";
import Toast from "../../components/common/SnackbarComponent";
import "../../styles/admin/CustomerInsightsPageStyle.css";

const CustomerInsightsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [limit, setLimit] = useState(10);
  const [toast, setToast] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    fetchData();
  }, [limit]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const result = await getCustomerInsights({ limit });
      console.log("Customer Insights Result:", result.result);
      const processedData = result.result || result;
      console.log("Processed Data:", processedData);
      setData(processedData || {});
    } catch (error) {
      console.error("Error fetching customer insights:", error);
      showToast("Failed to load customer insights", "error");
      setData({});
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, severity = "success") => {
    setToast({ open: true, message, severity });
  };

  if (loading) {
    return (
      <div className="customer-insights-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading customer insights...</p>
        </div>
      </div>
    );
  }

  const COLORS = ["#5c6f2b", "#7a8f3a", "#98ad49", "#b6cb58", "#d4e967"];

  const segmentationData = (data.segmentation || []).map((seg) => ({
    name: seg._id
      ? seg._id.charAt(0).toUpperCase() + seg._id.slice(1)
      : "Unclassified",
    value: seg.count,
  }));

  const frequencyData = (data.purchaseFrequency || []).map((freq) => ({
    orders: `${freq._id} orders`,
    customers: freq.customerCount,
  }));

  return (
    <div className="customer-insights-page">
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
            <h1>Customer Insights</h1>
            <p>Analyze customer behavior and lifetime value</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card green">
          <div className="card-icon">
            <Users size={24} />
          </div>
          <div className="card-content">
            <p className="card-label">New Customers (30d)</p>
            <h3 className="card-value">{data.newCustomersLast30Days || 0}</h3>
          </div>
        </div>

        <div className="summary-card blue">
          <div className="card-icon">
            <TrendingUp size={24} />
          </div>
          <div className="card-content">
            <p className="card-label">Returning Customers</p>
            <h3 className="card-value">
              {data.returningCustomersLast30Days || 0}
            </h3>
          </div>
        </div>

        <div className="summary-card purple">
          <div className="card-icon">
            <Star size={24} />
          </div>
          <div className="card-content">
            <p className="card-label">Total Segments</p>
            <h3 className="card-value">{(data.segmentation || []).length}</h3>
          </div>
        </div>

        <div className="summary-card orange">
          <div className="card-icon">
            <Award size={24} />
          </div>
          <div className="card-content">
            <p className="card-label">Top Customers</p>
            <h3 className="card-value">{(data.topCustomers || []).length}</h3>
          </div>
        </div>
      </div>

      <div className="insights-grid">
        {/* Top Customers by CLV */}
        <div className="insight-card wide">
          <div className="card-header">
            <div className="header-left">
              <DollarSign size={20} />
              <h3>Top Customers by Lifetime Value</h3>
            </div>
            <select
              value={limit}
              onChange={(e) => setLimit(parseInt(e.target.value))}
              className="limit-select"
            >
              <option value={5}>Top 5</option>
              <option value={10}>Top 10</option>
              <option value={20}>Top 20</option>
            </select>
          </div>

          <div className="customers-table">
            <table>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Customer</th>
                  <th>Type</th>
                  <th>Total Spent</th>
                  <th>Orders</th>
                  <th>Avg Order</th>
                  <th>First Purchase</th>
                  <th>Last Purchase</th>
                </tr>
              </thead>
              <tbody>
                {(data.topCustomers || []).map((customer, index) => (
                  <tr key={customer._id || index}>
                    <td>
                      <span className="rank-badge">#{index + 1}</span>
                    </td>
                    <td>
                      <div className="customer-info">
                        <div className="customer-avatar">
                          {customer._id
                            ? customer._id.charAt(0).toUpperCase()
                            : "G"}
                        </div>
                        <div>
                          <div className="customer-name">
                            {customer._id
                              ? customer._id.substring(0, 8).toUpperCase()
                              : "Guest"}
                          </div>
                          <div className="customer-email">
                            {customer._id
                              ? "ID: " + customer._id.substring(0, 12)
                              : "—"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span
                        className={`type-badge ${customer._id ? "registered" : "guest"}`}
                      >
                        {customer._id ? "Registered" : "Guest"}
                      </span>
                    </td>
                    <td className="amount">
                      ₱
                      {customer.totalSpent?.toLocaleString("en-PH", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td>{customer.orderCount}</td>
                    <td className="amount">
                      ₱
                      {customer.avgOrderValue?.toLocaleString("en-PH", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td>
                      {new Date(customer.firstPurchase).toLocaleDateString(
                        "en-PH",
                        { month: "short", day: "numeric", year: "numeric" },
                      )}
                    </td>
                    <td>
                      {new Date(customer.lastPurchase).toLocaleDateString(
                        "en-PH",
                        { month: "short", day: "numeric", year: "numeric" },
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Customer Segmentation */}
        <div className="insight-card">
          <div className="card-header">
            <div className="header-left">
              <Target size={20} />
              <h3>Customer Segmentation</h3>
            </div>
          </div>

          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={segmentationData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {segmentationData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="segment-list">
            {(data.segmentation || []).map((seg, index) => (
              <div key={seg._id || "unclassified"} className="segment-item">
                <div
                  className="segment-color"
                  style={{ background: COLORS[index % COLORS.length] }}
                ></div>
                <div className="segment-info">
                  <span className="segment-name">
                    {seg._id
                      ? seg._id.charAt(0).toUpperCase() + seg._id.slice(1)
                      : "Unclassified"}
                  </span>
                  <span className="segment-count">{seg.count} customers</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Purchase Frequency */}
        <div className="insight-card">
          <div className="card-header">
            <div className="header-left">
              <ShoppingBag size={20} />
              <h3>Purchase Frequency</h3>
            </div>
          </div>

          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={frequencyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="orders" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="customers" fill="#5c6f2b" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="frequency-summary">
            <p>
              Most customers have made{" "}
              <strong>{frequencyData[0]?.orders.split(" ")[0] || "—"}</strong>{" "}
              order(s)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerInsightsPage;
