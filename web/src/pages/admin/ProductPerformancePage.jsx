import React, { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingDown,
  TrendingUp,
  DollarSign,
  Package,
  AlertCircle,
  Star,
  Zap,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { getProductPerformance } from "../../services/dashboardService";
import Toast from "../../components/common/SnackbarComponent";
import "../../styles/admin/ProductPerformancePageStyle.css";

const ProductPerformancePage = () => {
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
      const result = await getProductPerformance();
      console.log("Product Performance Result:", result);
      const processedData = result.result || result.data || result;
      console.log("Processed Data:", processedData);
      setData(processedData || {});
    } catch (error) {
      showToast("Failed to load product performance data", "error");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, severity = "success") => {
    setToast({ open: true, message, severity });
  };

  if (loading) {
    return (
      <div className="product-performance-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading product performance...</p>
        </div>
      </div>
    );
  }

  const safeData = data || {};
  const slowMovingProducts = (safeData.slowMovingProducts || safeData.slowMoving || []).map(
    (p) => ({
      ...p,
      name: p.name || p.productName,
    }),
  );
  const fastMovingProducts = (safeData.fastMovingProducts || safeData.fastMoving || []).map(
    (p) => ({
      ...p,
      name: p.name || p.productName,
      totalSold: p.totalSold || p.unitsSold || 0,
    }),
  );
  const profitabilityAnalysis = (safeData.profitabilityAnalysis || safeData.profitability || []).map(
    (p) => ({
      ...p,
      name: p.name || p.productName,
      totalSold: p.totalSold || p.unitsSold || 0,
    }),
  );

  const fastMovingData = fastMovingProducts
    .slice(0, 10)
    .map((product) => ({
      name:
        product.name.length > 20
          ? product.name.substring(0, 20) + "..."
          : product.name,
      sales: product.totalSold || product.unitsSold || 0,
      revenue: product.totalRevenue || 0,
    }));

  const profitabilityData = profitabilityAnalysis
    .slice(0, 10)
    .map((product) => ({
      name:
        product.name.length > 20
          ? product.name.substring(0, 20) + "..."
          : product.name,
      margin: product.profitMargin || 0,
    }));

  return (
    <div className="product-performance-page">
      <Toast
        open={toast.open}
        message={toast.message}
        severity={toast.severity}
        onClose={() => setToast({ ...toast, open: false })}
      />

      <div className="page-header">
        <div className="header-content">
          <BarChart3 className="header-icon" size={32} />
          <div>
            <h1>Product Performance Reports</h1>
            <p>Analyze product sales, profitability, and inventory status</p>
          </div>
        </div>
        <button className="refresh-btn" onClick={fetchData}>
          <Zap size={18} />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card red">
          <div className="card-icon">
            <TrendingDown size={24} />
          </div>
          <div className="card-content">
            <p className="card-label">Slow-Moving Products</p>
            <h3 className="card-value">{slowMovingProducts.length}</h3>
            <p className="card-sublabel">Less than 5 units sold</p>
          </div>
        </div>

        <div className="summary-card green">
          <div className="card-icon">
            <TrendingUp size={24} />
          </div>
          <div className="card-content">
            <p className="card-label">Fast-Moving Products</p>
            <h3 className="card-value">{fastMovingProducts.length}</h3>
            <p className="card-sublabel">Top performers</p>
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
              {fastMovingProducts
                .reduce((sum, p) => sum + (p.totalRevenue || 0), 0)
                .toLocaleString("en-PH", {
                  maximumFractionDigits: 0,
                })}
            </h3>
            <p className="card-sublabel">From fast-moving products</p>
          </div>
        </div>

        <div className="summary-card purple">
          <div className="card-icon">
            <Star size={24} />
          </div>
          <div className="card-content">
            <p className="card-label">High Margin Products</p>
            <h3 className="card-value">
              {
                profitabilityAnalysis.filter((p) => (p.profitMargin || 0) >= 30)
                  .length
              }
            </h3>
            <p className="card-sublabel">30%+ profit margin</p>
          </div>
        </div>
      </div>

      <div className="performance-grid">
        {/* Slow-Moving Inventory Alert */}
        <div className="performance-card wide alert">
          <div className="card-header">
            <div className="header-left">
              <AlertCircle size={20} />
              <h3>Slow-Moving Inventory Alert</h3>
            </div>
            <span className="alert-badge">
              {slowMovingProducts.length}
            </span>
          </div>

          <div className="alert-table">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Current Stock</th>
                  <th>Units Sold</th>
                  <th>Revenue</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {slowMovingProducts.slice(0, 10).map((product) => (
                  <tr key={product._id}>
                    <td>
                      <div className="product-cell">
                        <div className="product-name">{product.name}</div>
                      </div>
                    </td>
                    <td>
                      <span className="category-badge">
                        {product.category || "N/A"}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`stock-badge ${(product.stock || 0) < 10 ? "critical" : "normal"}`}
                      >
                        {product.stock || 0}
                      </span>
                    </td>
                    <td className="units-sold">{product.totalSold || product.unitsSold || 0}</td>
                    <td className="revenue">
                      ₱
                      {(product.totalRevenue || 0)?.toLocaleString("en-PH", {
                        maximumFractionDigits: 0,
                      })}
                    </td>
                    <td>
                      <span className="status-badge warning">
                        <AlertCircle size={14} />
                        Slow
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Fast-Moving Products Chart */}
        <div className="performance-card">
          <div className="card-header">
            <div className="header-left">
              <TrendingUp size={20} />
              <h3>Top 10 Fast-Moving Products</h3>
            </div>
          </div>

          <div className="chart-container">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={fastMovingData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" stroke="#6b7280" fontSize={12} />
                <YAxis
                  dataKey="name"
                  type="category"
                  stroke="#6b7280"
                  fontSize={12}
                  width={120}
                />
                <Tooltip
                  contentStyle={{
                    background: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                />
                <Bar
                  dataKey="sales"
                  fill="#10b981"
                  radius={[0, 8, 8, 0]}
                  name="Units Sold"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="performance-note">
            <TrendingUp size={16} />
            <span>
              These products are selling well and generating consistent revenue
            </span>
          </div>
        </div>

        {/* Profitability Analysis */}
        <div className="performance-card">
          <div className="card-header">
            <div className="header-left">
              <DollarSign size={20} />
              <h3>Profitability Analysis</h3>
            </div>
          </div>

          <div className="chart-container">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={profitabilityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="name"
                  stroke="#6b7280"
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                  formatter={(value) => `${value.toFixed(2)}%`}
                />
                <Bar
                  dataKey="margin"
                  radius={[8, 8, 0, 0]}
                  name="Profit Margin (%)"
                >
                  {profitabilityData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.margin >= 30
                          ? "#10b981"
                          : entry.margin >= 15
                            ? "#fbbf24"
                            : "#ef4444"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="margin-legend">
            <div className="legend-item">
              <div className="legend-color high"></div>
              <span>High (≥30%)</span>
            </div>
            <div className="legend-item">
              <div className="legend-color medium"></div>
              <span>Medium (15-29%)</span>
            </div>
            <div className="legend-item">
              <div className="legend-color low"></div>
              <span>Low (&lt;15%)</span>
            </div>
          </div>
        </div>

        {/* Best Performers Summary */}
        <div className="performance-card highlight">
          <div className="card-header">
            <div className="header-left">
              <Star size={20} />
              <h3>Top 5 Best Performers</h3>
            </div>
          </div>

          <div className="performers-list">
            {fastMovingProducts.slice(0, 5).map((product, index) => (
              <div key={product._id} className="performer-item">
                <div className="performer-rank">
                  {index === 0 && "🥇"}
                  {index === 1 && "🥈"}
                  {index === 2 && "🥉"}
                  {index > 2 && `#${index + 1}`}
                </div>
                <div className="performer-info">
                  <div className="performer-name">{product.name}</div>
                  <div className="performer-stats">
                    <div className="stat">
                      <span className="label">Sold:</span>
                      <span className="value">{product.totalSold || product.unitsSold || 0} units</span>
                    </div>
                    <div className="stat">
                      <span className="label">Revenue:</span>
                      <span className="value revenue">
                        ₱
                        {(product.totalRevenue || 0).toLocaleString("en-PH", {
                          maximumFractionDigits: 0,
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stock Value Overview */}
        <div className="performance-card">
          <div className="card-header">
            <div className="header-left">
              <Package size={20} />
              <h3>Stock Value Overview</h3>
            </div>
          </div>

          <div className="stock-overview">
            <div className="overview-item">
              <div className="overview-label">Fast-Moving Stock Value</div>
              <div className="overview-value green">
                ₱
                {fastMovingProducts
                  .reduce((sum, p) => sum + (p.stock || 0) * (p.price || 0), 0)
                  .toLocaleString("en-PH", {
                    maximumFractionDigits: 0,
                  })}
              </div>
            </div>

            <div className="overview-item">
              <div className="overview-label">Slow-Moving Stock Value</div>
              <div className="overview-value red">
                ₱
                {slowMovingProducts
                  .reduce((sum, p) => sum + (p.stock || 0) * (p.price || 0), 0)
                  .toLocaleString("en-PH", {
                    maximumFractionDigits: 0,
                  })}
              </div>
            </div>

            <div className="overview-divider"></div>

            <div className="overview-item total">
              <div className="overview-label">Total Inventory Value</div>
              <div className="overview-value">
                ₱
                {(
                  fastMovingProducts.reduce(
                    (sum, p) => sum + (p.stock || 0) * (p.price || 0),
                    0,
                  ) +
                  slowMovingProducts.reduce(
                    (sum, p) => sum + (p.stock || 0) * (p.price || 0),
                    0,
                  )
                ).toLocaleString("en-PH", {
                  maximumFractionDigits: 0,
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductPerformancePage;
