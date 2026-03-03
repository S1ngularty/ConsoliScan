import React, { useState, useEffect } from "react";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  PieChart as PieChartIcon,
  BarChart3,
  CreditCard,
  Wallet,
  Calendar,
} from "lucide-react";
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { getFinancialReports } from "../../services/dashboardService";
import Toast from "../../components/common/SnackbarComponent";
import "../../styles/admin/FinancialReportsPageStyle.css";

const FinancialReportsPage = () => {
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
      const result = await getFinancialReports({ period: parseInt(period) });
      console.log("Financial Reports Result:", result);
      const processedData = result.result || result.data || result;
      console.log("Processed Data:", processedData);
      setData(processedData || {});
    } catch (error) {
      showToast("Failed to load financial reports", "error");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, severity = "success") => {
    setToast({ open: true, message, severity });
  };

  if (loading) {
    return (
      <div className="financial-reports-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading financial reports...</p>
        </div>
      </div>
    );
  }

  const PAYMENT_COLORS = {
    cash: "#10b981",
    card: "#3b82f6",
    gcash: "#2563eb",
    paymaya: "#10b981",
    other: "#6b7280",
  };

  const safeData = data || {};
  const paymentMethodBreakdown =
    safeData.paymentMethodBreakdown || safeData.paymentBreakdown || [];
  const dailyCashFlow = safeData.dailyCashFlow || [];
  const profitMarginSummary = safeData.profitMargin || {};

  const paymentData = paymentMethodBreakdown.map((item) => ({
    name: item._id
      ? item._id.charAt(0).toUpperCase() + item._id.slice(1)
      : "Other",
    value: item.totalAmount || 0,
    count: item.count || 0,
  }));

  const summaryRevenue = profitMarginSummary.totalRevenue || 0;
  const summaryCost = profitMarginSummary.totalCost || 0;
  const costRatio = summaryRevenue > 0 ? summaryCost / summaryRevenue : 0;

  const cashFlowData = dailyCashFlow.map((item) => ({
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
    revenue: item.revenue || item.totalRevenue || 0,
    cost: item.cost || (item.revenue || item.totalRevenue || 0) * costRatio,
    profit:
      item.profit || (item.revenue || item.totalRevenue || 0) * (1 - costRatio),
  }));

  const profitMarginAnalysis =
    safeData.profitMarginAnalysis ||
    cashFlowData.map((item, index) => ({
      date:
        dailyCashFlow[index]?.date ||
        (dailyCashFlow[index]?._id
          ? `${dailyCashFlow[index]._id.year}-${String(
              dailyCashFlow[index]._id.month,
            ).padStart(
              2,
              "0",
            )}-${String(dailyCashFlow[index]._id.day).padStart(2, "0")}`
          : new Date().toISOString()),
      revenue: item.revenue,
      cost: item.cost,
      profit: item.profit,
    }));

  const totalRevenue =
    profitMarginSummary.totalRevenue ||
    profitMarginAnalysis.reduce((sum, item) => sum + (item.revenue || 0), 0);
  const totalCost =
    profitMarginSummary.totalCost ||
    profitMarginAnalysis.reduce((sum, item) => sum + (item.cost || 0), 0);
  const totalProfit =
    profitMarginSummary.grossProfit ||
    profitMarginAnalysis.reduce((sum, item) => sum + (item.profit || 0), 0);
  const profitMargin =
    typeof profitMarginSummary.profitMargin === "number"
      ? profitMarginSummary.profitMargin
      : totalRevenue > 0
        ? (totalProfit / totalRevenue) * 100
        : 0;

  return (
    <div className="financial-reports-page">
      <Toast
        open={toast.open}
        message={toast.message}
        severity={toast.severity}
        onClose={() => setToast({ ...toast, open: false })}
      />

      <div className="page-header">
        <div className="header-content">
          <DollarSign className="header-icon" size={32} />
          <div>
            <h1>Financial Reports</h1>
            <p>Track revenue, costs, and profitability</p>
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
            <TrendingUp size={24} />
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

        <div className="summary-card red">
          <div className="card-icon">
            <TrendingDown size={24} />
          </div>
          <div className="card-content">
            <p className="card-label">Total Cost</p>
            <h3 className="card-value">
              ₱
              {totalCost.toLocaleString("en-PH", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </h3>
          </div>
        </div>

        <div className="summary-card blue">
          <div className="card-icon">
            <DollarSign size={24} />
          </div>
          <div className="card-content">
            <p className="card-label">Net Profit</p>
            <h3 className="card-value">
              ₱
              {totalProfit.toLocaleString("en-PH", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </h3>
          </div>
        </div>

        <div className="summary-card purple">
          <div className="card-icon">
            <BarChart3 size={24} />
          </div>
          <div className="card-content">
            <p className="card-label">Profit Margin</p>
            <h3 className="card-value">{profitMargin.toFixed(2)}%</h3>
          </div>
        </div>
      </div>

      <div className="reports-grid">
        {/* Daily Cash Flow */}
        <div className="report-card wide">
          <div className="card-header">
            <div className="header-left">
              <Calendar size={20} />
              <h3>Daily Cash Flow Trend</h3>
            </div>
          </div>

          <div className="chart-container large">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cashFlowData}>
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
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stackId="1"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.6}
                  name="Revenue"
                />
                <Area
                  type="monotone"
                  dataKey="cost"
                  stackId="2"
                  stroke="#ef4444"
                  fill="#ef4444"
                  fillOpacity={0.6}
                  name="Cost"
                />
                <Area
                  type="monotone"
                  dataKey="profit"
                  stackId="3"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.6}
                  name="Profit"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Method Breakdown */}
        <div className="report-card">
          <div className="card-header">
            <div className="header-left">
              <CreditCard size={20} />
              <h3>Payment Method Breakdown</h3>
            </div>
          </div>

          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={paymentData}
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
                  {paymentData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        PAYMENT_COLORS[entry.name.toLowerCase()] || "#6b7280"
                      }
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) =>
                    `₱${value.toLocaleString("en-PH", {
                      minimumFractionDigits: 2,
                    })}`
                  }
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="payment-list">
            {paymentData.map((item, index) => (
              <div key={`${item.name}-${index}`} className="payment-item">
                <div
                  className="payment-color"
                  style={{
                    background:
                      PAYMENT_COLORS[item.name.toLowerCase()] || "#6b7280",
                  }}
                ></div>
                <div className="payment-info">
                  <div className="payment-details">
                    <span className="payment-name">{item.name}</span>
                    <span className="payment-count">
                      ({item.count} transactions)
                    </span>
                  </div>
                  <span className="payment-amount">
                    ₱
                    {item.value.toLocaleString("en-PH", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Profit Margin Analysis */}
        <div className="report-card">
          <div className="card-header">
            <div className="header-left">
              <Wallet size={20} />
              <h3>Profit Margin Analysis</h3>
            </div>
          </div>

          <div className="margin-table">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Revenue</th>
                  <th>Cost</th>
                  <th>Profit</th>
                  <th>Margin</th>
                </tr>
              </thead>
              <tbody>
                {profitMarginAnalysis.slice(0, 10).map((item, index) => {
                  const margin =
                    (item.revenue || 0) > 0
                      ? ((item.profit / item.revenue) * 100).toFixed(2)
                      : "0.00";
                  return (
                    <tr key={item.date || index}>
                      <td>
                        {new Date(item.date).toLocaleDateString("en-PH", {
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="revenue">
                        ₱
                        {item.revenue.toLocaleString("en-PH", {
                          maximumFractionDigits: 0,
                        })}
                      </td>
                      <td className="cost">
                        ₱
                        {item.cost.toLocaleString("en-PH", {
                          maximumFractionDigits: 0,
                        })}
                      </td>
                      <td className="profit">
                        ₱
                        {item.profit.toLocaleString("en-PH", {
                          maximumFractionDigits: 0,
                        })}
                      </td>
                      <td>
                        <span
                          className={`margin-badge ${
                            parseFloat(margin) >= 30
                              ? "high"
                              : parseFloat(margin) >= 15
                                ? "medium"
                                : "low"
                          }`}
                        >
                          {margin}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialReportsPage;
