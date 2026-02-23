import React, { useState, useEffect } from "react";
import { 
  FileText, 
  Download, 
  Users, 
  ShoppingBag, 
  Package, 
  TrendingUp, 
  Calendar,
  Filter,
  BarChart2,
  PieChart,
  DollarSign
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import "../../styles/admin/ReportPageStyle.css";
import { 
  getSalesAnalytics, 
  getProductAnalytics, 
  getUserAnalytics, 
  getCategoryAnalytics 
} from "../../services/dashboardService";

const ReportPage = () => {
  const [activeTab, setActiveTab] = useState("sales");
  const [timeRange, setTimeRange] = useState("30");
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);

  // Mock data structure for initial render or fallback
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

  useEffect(() => {
    fetchReportData();
  }, [activeTab, timeRange]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(timeRange));

      let data;
      switch (activeTab) {
        case "sales":
          data = await getSalesAnalytics({ 
            startDate: startDate.toISOString().split('T')[0], 
            endDate: endDate.toISOString().split('T')[0],
            groupBy: parseInt(timeRange) > 60 ? "month" : "day"
          });
          break;
        case "profit": // New profit case
          // In a real scenario, this would be a separate API call or derived from sales data
          // For now, we'll derive it from sales data assuming a fixed margin or if backend provides it
          const salesData = await getSalesAnalytics({ 
            startDate: startDate.toISOString().split('T')[0], 
            endDate: endDate.toISOString().split('T')[0],
            groupBy: parseInt(timeRange) > 60 ? "month" : "day"
          });
          // Mocking profit calculation: 20% markup on average
          data = {
            ...salesData,
            totalProfit: (salesData.totalSales || 0) * 0.2,
            data: salesData.data.map(item => ({
              ...item,
              profit: (item.totalSales || 0) * 0.2
            }))
          };
          break;
        case "products":
          data = await getProductAnalytics({ limit: 10, sortBy: "sales" });
          break;
        case "users":
          data = await getUserAnalytics({ 
            startDate: startDate.toISOString().split('T')[0], 
            endDate: endDate.toISOString().split('T')[0] 
          });
          break;
        case "inventory":
          data = await getCategoryAnalytics();
          break;
        default:
          data = {};
      }
      setReportData(data);
    } catch (error) {
      console.error("Failed to fetch report data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    // Implementation for exporting report as CSV/PDF
    console.log("Exporting report...");
    alert("Report export started...");
  };

  const renderProfitChart = () => {
    if (!reportData?.data) return null;
    
    const chartData = reportData.data.map(item => ({
      name: item._id || item.date,
      profit: item.profit || 0
    }));

    return (
      <div className="chart-container">
        <h3>Gross Profit Trends (Estimated 20% Markup)</h3>
        <div className="chart-wrapper">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <XAxis dataKey="name" />
              <YAxis />
              <CartesianGrid strokeDasharray="3 3" />
              <Tooltip formatter={(value) => [`₱${value.toLocaleString()}`, "Profit"]} />
              <Bar dataKey="profit" fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderSalesChart = () => {
    if (!reportData?.data) return null;
    
    // Transform data for chart
    const chartData = reportData.data.map(item => ({
      name: item._id || item.date,
      revenue: item.totalSales || 0,
      orders: item.orderCount || 0
    }));

    return (
      <div className="chart-container">
        <h3>Revenue Trends</h3>
        <div className="chart-wrapper">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00A86B" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#00A86B" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="name" />
              <YAxis />
              <CartesianGrid strokeDasharray="3 3" />
              <Tooltip />
              <Area type="monotone" dataKey="revenue" stroke="#00A86B" fillOpacity={1} fill="url(#colorRevenue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  return (
    <div className="report-page">
      <div className="report-header">
        <div>
          <h1>Business Reports</h1>
          <p>Comprehensive analytics and system insights</p>
        </div>
        <div className="header-actions">
          <select 
            className="time-select" 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 3 Months</option>
            <option value="365">Last Year</option>
          </select>
          <button className="export-btn" onClick={handleExport}>
            <Download size={18} />
            Export Report
          </button>
        </div>
      </div>

      <div className="report-tabs">
        <button 
          className={`tab-btn ${activeTab === "sales" ? "active" : ""}`}
          onClick={() => setActiveTab("sales")}
        >
          <TrendingUp size={18} /> Sales & Revenue
        </button>
        <button 
          className={`tab-btn ${activeTab === "profit" ? "active" : ""}`}
          onClick={() => setActiveTab("profit")}
        >
          <DollarSign size={18} /> Profit & Markup
        </button>
        <button 
          className={`tab-btn ${activeTab === "users" ? "active" : ""}`}
          onClick={() => setActiveTab("users")}
        >
          <Users size={18} /> User Insights
        </button>
        <button 
          className={`tab-btn ${activeTab === "products" ? "active" : ""}`}
          onClick={() => setActiveTab("products")}
        >
          <ShoppingBag size={18} /> Product Performance
        </button>
        <button 
          className={`tab-btn ${activeTab === "inventory" ? "active" : ""}`}
          onClick={() => setActiveTab("inventory")}
        >
          <Package size={18} /> Inventory Status
        </button>
      </div>

      <div className="report-content">
        {loading ? (
          <div className="loading-state">Generating report data...</div>
        ) : (
          <>
            <div className="summary-cards">
              <div className="summary-card">
                <div className="card-icon green"><TrendingUp size={24} /></div>
                <div className="card-info">
                  <span className="card-label">Total Revenue</span>
                  <span className="card-value">₱{reportData?.totalRevenue?.toLocaleString() || "0"}</span>
                </div>
              </div>
              <div className="summary-card">
                <div className="card-icon blue"><ShoppingBag size={24} /></div>
                <div className="card-info">
                  <span className="card-label">Total Orders</span>
                  <span className="card-value">{reportData?.totalOrders?.toLocaleString() || "0"}</span>
                </div>
              </div>
              <div className="summary-card">
                <div className="card-icon orange"><Users size={24} /></div>
                <div className="card-info">
                  <span className="card-label">Active Users</span>
                  <span className="card-value">{reportData?.activeUsers?.toLocaleString() || "0"}</span>
                </div>
              </div>
            </div>

            {/* Dynamic Content based on Active Tab */}
            {activeTab === "sales" && (
              <div className="tab-content">
                {renderSalesChart()}
                <div className="data-table-container">
                  <h3>Detailed Sales Log</h3>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Orders</th>
                        <th>Revenue</th>
                        <th>Avg. Order Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData?.data?.map((item, index) => (
                        <tr key={index}>
                          <td>{item._id || item.date}</td>
                          <td>{item.orderCount}</td>
                          <td>₱{item.totalSales?.toLocaleString()}</td>
                          <td>₱{Math.round(item.totalSales / item.orderCount || 0).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "profit" && (
              <div className="tab-content">
                {renderProfitChart()}
                <div className="data-table-container">
                  <h3>Profit & Discount Analysis</h3>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Total Revenue</th>
                        <th>Est. Gross Profit (20%)</th>
                        <th>PWD/Senior Discounts Given</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData?.data?.map((item, index) => (
                        <tr key={index}>
                          <td>{item._id || item.date}</td>
                          <td>₱{item.totalSales?.toLocaleString()}</td>
                          <td style={{ color: "#10B981", fontWeight: "bold" }}>₱{item.profit?.toLocaleString()}</td>
                          <td style={{ color: "#EF4444" }}>₱{Math.round((item.totalSales * 0.05)).toLocaleString()} (Est.)</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Add other tab contents (Users, Products, Inventory) similar to Sales */}
          </>
        )}
      </div>
    </div>
  );
};

export default ReportPage;