import React from "react";
import {
  TrendingUp,
  Users,
  Package,
  DollarSign,
  RefreshCw,
  FileText,
  ChevronDown,
  Activity,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import "../../styles/admin/DashboardPageStyle.css";
import Toast from "../../components/common/SnackbarComponent";
import {
  getDashboardSummary,
  getSalesAnalytics,
  getOrderAnalytics,
} from "../../services/dashboardService";

// ─── Custom Tooltip ──────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: "rgba(255,255,255,0.97)",
        borderRadius: "14px",
        padding: "12px 18px",
        boxShadow: "0 8px 32px rgba(92,111,43,0.18)",
        border: "1px solid rgba(92,111,43,0.12)",
        fontFamily: "inherit",
      }}>
        <p style={{ margin: "0 0 6px", color: "#6b7280", fontSize: "12px", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>{label}</p>
        {payload.map((entry, i) => (
          <p key={i} style={{ margin: "2px 0", color: "#5C6F2B", fontSize: "15px", fontWeight: 700 }}>
            {entry.name === "sales" ? "₱" : ""}{entry.value?.toLocaleString("en-PH")}
            <span style={{ color: "#9ca3af", fontWeight: 400, fontSize: "12px", marginLeft: "4px" }}>{entry.name}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// ─── Animated Counter ─────────────────────────────────────────────────────────
function useCountUp(target, duration = 1200, active = true) {
  const [value, setValue] = React.useState(0);
  React.useEffect(() => {
    if (!active) return;
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) { setValue(target); clearInterval(timer); }
      else setValue(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration, active]);
  return value;
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ stat, index, loading }) => {
  const numericValue = parseFloat(stat.rawValue || 0);
  const animated = useCountUp(numericValue, 1000 + index * 150, !loading);
  const isUp = stat.trend.startsWith("+");

  const displayValue = stat.title === "Total Sales"
    ? `₱${animated.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : animated.toLocaleString();

  return (
    <div
      className="stat-card"
      style={{
        animationDelay: `${index * 80}ms`,
        animation: "cardSlideIn 0.5s ease forwards",
        opacity: 0,
      }}
    >
      <div className="stat-content">
        <p className="stat-label">{stat.title}</p>
        <h3 className="stat-value">{loading ? "—" : displayValue}</h3>
        <p className={`stat-trend ${isUp ? "up" : "down"}`}>
          <span className="trend-arrow">{isUp ? "↑" : "↓"}</span>
          {stat.trend} <span>vs last month</span>
        </p>
      </div>
      <div className={`stat-icon-box ${stat.color}`}>
        <div className="stat-icon-inner">{stat.icon}</div>
        <div className="stat-icon-glow" />
      </div>
    </div>
  );
};

// ─── Day Filter Pills ──────────────────────────────────────────────────────────
const DAY_OPTIONS = [
  { label: "7D", value: 7 },
  { label: "14D", value: 14 },
  { label: "30D", value: 30 },
  { label: "90D", value: 90 },
];

// ─── Main Component ───────────────────────────────────────────────────────────
function DashboardPage() {
  const [snackbar, setSnackbar] = React.useState({ open: false, message: "", severity: "success" });
  const [loading, setLoading] = React.useState(true);
  const [chartLoading, setChartLoading] = React.useState(false);
  const [dashboardData, setDashboardData] = React.useState(null);
  const [chartData, setChartData] = React.useState([]);
  const [selectedDays, setSelectedDays] = React.useState(7);
  const [chartType, setChartType] = React.useState("area"); // "area" | "bar"
  const [stats, setStats] = React.useState([
    { title: "Total Sales", rawValue: 0, value: "₱0.00", icon: <DollarSign size={20} />, trend: "+0%", color: "green" },
    { title: "Total Users", rawValue: 0, value: "0", icon: <Users size={20} />, trend: "+0%", color: "blue" },
    { title: "Total Orders", rawValue: 0, value: "0", icon: <Package size={20} />, trend: "+0%", color: "orange" },
    { title: "Products", rawValue: 0, value: "0", icon: <TrendingUp size={20} />, trend: "+0%", color: "purple" },
  ]);

  const showToast = React.useCallback((message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  }, []);

  // Derive groupBy the same way the backend expects:
  // ≤14 days → "day", ≤60 days → "week", >60 days → "month"
  const getGroupBy = (days) => {
    if (days <= 14) return "day";
    if (days <= 60) return "week";
    return "month";
  };

  // Format a date string for the X-axis label based on groupBy
  const formatLabel = (dateStr, groupBy) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    if (groupBy === "day") return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    if (groupBy === "week") return `W${getISOWeek(d)} ${d.toLocaleDateString("en-US", { month: "short" })}`;
    return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
  };

  const getISOWeek = (d) => {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    return Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
  };

  // Fetch chart data separately so filter changes don't reload everything
  const fetchChartData = React.useCallback(async (days) => {
    try {
      setChartLoading(true);

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const groupBy = getGroupBy(days);

      const salesResponse = await getSalesAnalytics({
        startDate: startDate.toISOString().split("T")[0],
        endDate: endDate.toISOString().split("T")[0],
        groupBy,
      });

      const salesData = salesResponse.data || [];

      // Backend returns: { _id: { date: "YYYY-MM-DD" }, totalSales, orderCount, ... }
      const transformed = salesData.map((item) => {
        const rawDate = item._id?.date || item._id || item.date || "";
        return {
          name: formatLabel(rawDate, groupBy),
          sales: item.totalSales || 0,
          orders: item.orderCount || 0,
        };
      });

      // If backend returned no data, build an empty scaffold so chart still renders
      if (transformed.length === 0) {
        const count = groupBy === "day" ? days : groupBy === "week" ? Math.ceil(days / 7) : Math.ceil(days / 30);
        const scaffold = Array.from({ length: count }, (_, i) => {
          const d = new Date();
          if (groupBy === "day") d.setDate(d.getDate() - (count - 1 - i));
          else if (groupBy === "week") d.setDate(d.getDate() - (count - 1 - i) * 7);
          else d.setMonth(d.getMonth() - (count - 1 - i));
          return { name: formatLabel(d.toISOString().split("T")[0], groupBy), sales: 0, orders: 0 };
        });
        setChartData(scaffold);
      } else {
        setChartData(transformed);
      }
    } catch (err) {
      console.error("Chart data error:", err);
      setChartData([]);
    } finally {
      setChartLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDashboardData = React.useCallback(async () => {
    try {
      setLoading(true);
      const summaryResponse = await getDashboardSummary();
      const summary = summaryResponse.result || summaryResponse;
      setDashboardData(summary);

      const totalRevenue = summary.totalRevenue || 0;
      const totalUsers = summary.totalUsers || 0;
      const totalOrders = summary.totalOrders || 0;
      const totalProducts = summary.totalProducts || 0;

      setStats([
        { title: "Total Sales", rawValue: totalRevenue, value: `₱${totalRevenue.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: <DollarSign size={20} />, trend: "+12.5%", color: "green" },
        { title: "Total Users", rawValue: totalUsers, value: totalUsers.toString(), icon: <Users size={20} />, trend: "+3.2%", color: "blue" },
        { title: "Total Orders", rawValue: totalOrders, value: totalOrders.toString(), icon: <Package size={20} />, trend: "+18%", color: "orange" },
        { title: "Products", rawValue: totalProducts, value: totalProducts.toString(), icon: <TrendingUp size={20} />, trend: "-0.5%", color: "purple" },
      ]);

      showToast("Dashboard refreshed!", "success");
    } catch (error) {
      console.error("Dashboard error:", error);
      showToast("Failed to load dashboard data.", "warning");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  React.useEffect(() => {
    if (sessionStorage.getItem("isLogin") === "true") {
      showToast("Successfully logged in!");
      sessionStorage.clear();
    }
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Refetch chart whenever selectedDays changes
  React.useEffect(() => {
    fetchChartData(selectedDays);
  }, [selectedDays, fetchChartData]);

  const handleDayChange = (days) => {
    if (days === selectedDays || chartLoading) return;
    setSelectedDays(days);
  };

  // Human-readable subtitle for the chart header
  const rangeLabel = React.useMemo(() => {
    const gb = selectedDays <= 14 ? "daily" : selectedDays <= 60 ? "weekly" : "monthly";
    return `Last ${selectedDays} days · ${gb} view`;
  }, [selectedDays]);

  const closeToast = () => setSnackbar((prev) => ({ ...prev, open: false }));

  return (
    <div className="dashboard-view">
      <style>{`
        @keyframes cardSlideIn {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50%       { opacity: 0.7; transform: scale(1.15); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }

        .dashboard-view { animation: fadeIn 0.4s ease; }

        /* ── Header ── */
        .dashboard-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 28px;
        }
        .dashboard-header h1 {
          font-size: 24px;
          font-weight: 700;
          color: #1a1a1a;
          letter-spacing: -0.5px;
        }
        .dashboard-header-actions { display: flex; gap: 10px; }

        /* ── Buttons ── */
        .report-btn {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 9px 18px;
          border-radius: 10px;
          font-size: 13.5px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
        }
        .btn-primary {
          background: #5C6F2B;
          color: #fff;
          box-shadow: 0 2px 10px rgba(92,111,43,0.28);
        }
        .btn-primary:hover:not(:disabled) {
          background: #4a5a22;
          box-shadow: 0 4px 16px rgba(92,111,43,0.38);
          transform: translateY(-1px);
        }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .btn-secondary {
          background: #fff;
          color: #5C6F2B;
          border: 1.5px solid #d4dab8;
        }
        .btn-secondary:hover {
          background: #f5f7ee;
          border-color: #5C6F2B;
          transform: translateY(-1px);
        }
        .spin { animation: spin 1s linear infinite; }

        /* ── Stat Cards ── */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
          gap: 18px;
          margin-bottom: 24px;
        }
        .stat-card {
          background: #fff;
          border-radius: 16px;
          padding: 20px 22px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-shadow: 0 2px 12px rgba(0,0,0,0.06);
          border: 1px solid rgba(0,0,0,0.05);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          position: relative;
          overflow: hidden;
        }
        .stat-card::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.5) 100%);
          pointer-events: none;
        }
        .stat-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.1); }
        .stat-label { font-size: 12px; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.06em; margin: 0 0 6px; }
        .stat-value { font-size: 22px; font-weight: 800; color: #111; margin: 0 0 8px; letter-spacing: -0.5px; }
        .stat-trend { font-size: 12px; font-weight: 600; margin: 0; display: flex; align-items: center; gap: 4px; }
        .stat-trend.up { color: #10b981; }
        .stat-trend.down { color: #ef4444; }
        .stat-trend span { color: #9ca3af; font-weight: 400; }
        .trend-arrow { font-size: 14px; }
        .stat-icon-box {
          width: 52px; height: 52px;
          border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          position: relative; flex-shrink: 0;
        }
        .stat-icon-inner { position: relative; z-index: 1; }
        .stat-icon-glow {
          position: absolute; inset: 0; border-radius: 14px;
          animation: pulse-glow 3s ease-in-out infinite;
        }
        .stat-icon-box.green  { background: rgba(92,111,43,0.12); color: #5C6F2B; }
        .stat-icon-box.green .stat-icon-glow  { background: rgba(92,111,43,0.2); }
        .stat-icon-box.blue   { background: rgba(59,130,246,0.1); color: #3b82f6; }
        .stat-icon-box.blue .stat-icon-glow   { background: rgba(59,130,246,0.15); }
        .stat-icon-box.orange { background: rgba(249,115,22,0.1); color: #f97316; }
        .stat-icon-box.orange .stat-icon-glow { background: rgba(249,115,22,0.15); }
        .stat-icon-box.purple { background: rgba(139,92,246,0.1); color: #8b5cf6; }
        .stat-icon-box.purple .stat-icon-glow { background: rgba(139,92,246,0.15); }

        /* ── Dashboard Details ── */
        .dashboard-details { display: grid; grid-template-columns: 1fr 340px; gap: 20px; }
        @media (max-width: 1024px) { .dashboard-details { grid-template-columns: 1fr; } }

        /* ── Chart Container ── */
        .chart-container {
          background: #fff;
          border-radius: 18px;
          padding: 22px 24px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.06);
          border: 1px solid rgba(0,0,0,0.05);
          animation: cardSlideIn 0.5s ease 0.3s forwards;
          opacity: 0;
        }
        .chart-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 18px;
          flex-wrap: wrap;
          gap: 12px;
        }
        .chart-header h3 {
          font-size: 16px;
          font-weight: 700;
          color: #111;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .chart-live-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: #10b981;
          animation: pulse-glow 2s ease-in-out infinite;
          display: inline-block;
        }
        .chart-controls { display: flex; align-items: center; gap: 10px; }

        /* Day filter pills */
        .day-filter {
          display: flex;
          background: #f3f4f6;
          border-radius: 10px;
          padding: 3px;
          gap: 2px;
        }
        .day-pill {
          padding: 5px 13px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          border: none;
          background: transparent;
          color: #6b7280;
          transition: all 0.2s ease;
        }
        .day-pill.active {
          background: #5C6F2B;
          color: #fff;
          box-shadow: 0 2px 8px rgba(92,111,43,0.3);
        }
        .day-pill:hover:not(.active) { background: #e5e7eb; color: #374151; }

        /* Chart type toggle */
        .chart-type-toggle {
          display: flex;
          background: #f3f4f6;
          border-radius: 10px;
          padding: 3px;
          gap: 2px;
        }
        .type-pill {
          padding: 5px 11px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          border: none;
          background: transparent;
          color: #6b7280;
          transition: all 0.2s ease;
        }
        .type-pill.active { background: #fff; color: #5C6F2B; box-shadow: 0 1px 4px rgba(0,0,0,0.1); }

        .chart-wrapper {
          height: 260px;
          position: relative;
          transition: opacity 0.3s ease;
        }
        .chart-wrapper.loading { opacity: 0.4; pointer-events: none; }
        .chart-loading-overlay {
          position: absolute; inset: 0;
          display: flex; align-items: center; justify-content: center;
          z-index: 10;
          font-size: 13px; color: #5C6F2B; font-weight: 600;
        }

        /* ── Recent Activity ── */
        .recent-activity {
          background: #fff;
          border-radius: 18px;
          padding: 22px 22px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.06);
          border: 1px solid rgba(0,0,0,0.05);
          animation: cardSlideIn 0.5s ease 0.4s forwards;
          opacity: 0;
          overflow: hidden;
        }
        .recent-activity h3 {
          font-size: 16px; font-weight: 700; color: #111;
          margin: 0 0 16px;
          display: flex; align-items: center; gap: 8px;
        }
        .activity-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 2px; }
        .activity-item {
          display: flex; align-items: center; gap: 12px;
          padding: 11px 10px; border-radius: 12px;
          transition: background 0.15s ease;
          cursor: default;
        }
        .activity-item:hover { background: #f9fafb; }
        .user-avatar {
          width: 38px; height: 38px; border-radius: 12px;
          background: linear-gradient(135deg, #5C6F2B, #8aaa3e);
          color: #fff; font-size: 12px; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          letter-spacing: 0.05em;
        }
        .item-info { flex: 1; min-width: 0; }
        .item-title { font-size: 13px; font-weight: 600; color: #374151; margin: 0 0 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .item-time { font-size: 11px; color: #9ca3af; margin: 0; }
        .item-amount { font-size: 12px; font-weight: 700; margin: 0; flex-shrink: 0; }
        .activity-empty {
          text-align: center; padding: 40px 20px;
          color: #9ca3af; font-size: 14px;
        }
        .activity-empty-icon { font-size: 36px; margin-bottom: 10px; opacity: 0.4; }
      `}</style>

      <Toast open={snackbar.open} message={snackbar.message} handleClose={closeToast} severity={snackbar.severity} />

      {/* Header */}
      <div className="dashboard-header">
        <h1>Dashboard Overview</h1>
        <div className="dashboard-header-actions">
          <button className="report-btn btn-primary" onClick={fetchDashboardData} disabled={loading}>
            <RefreshCw size={14} className={loading ? "spin" : ""} />
            {loading ? "Refreshing..." : "Refresh"}
          </button>
          <button className="report-btn btn-secondary">
            <FileText size={14} />
            Generate Report
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {stats.map((stat, i) => (
          <StatCard key={stat.title} stat={stat} index={i} loading={loading} />
        ))}
      </div>

      {/* Dashboard Details */}
      <div className="dashboard-details">

        {/* Chart */}
        <div className="chart-container">
          <div className="chart-header">
            <div>
              <h3 style={{ marginBottom: 2 }}>
                <span className="chart-live-dot" />
                Sales Analytics
              </h3>
              <p style={{ margin: 0, fontSize: "11px", color: "#9ca3af", fontWeight: 500 }}>{rangeLabel}</p>
            </div>
            <div className="chart-controls">
              {/* Chart type */}
              <div className="chart-type-toggle">
                <button className={`type-pill ${chartType === "area" ? "active" : ""}`} onClick={() => setChartType("area")}>Area</button>
                <button className={`type-pill ${chartType === "bar" ? "active" : ""}`} onClick={() => setChartType("bar")}>Bar</button>
              </div>
              {/* Day filter */}
              <div className="day-filter">
                {DAY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    className={`day-pill ${selectedDays === opt.value ? "active" : ""}`}
                    onClick={() => handleDayChange(opt.value)}
                    disabled={chartLoading}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className={`chart-wrapper ${chartLoading ? "loading" : ""}`}>
            {chartLoading && (
              <div className="chart-loading-overlay">
                <RefreshCw size={16} className="spin" style={{ marginRight: 6 }} /> Loading chart…
              </div>
            )}
            <ResponsiveContainer width="100%" height="100%">
              {chartType === "area" ? (
                <AreaChart
                  key={`area-${selectedDays}`}
                  data={chartData.length > 0 ? chartData : [{ name: "No data", sales: 0 }]}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#5C6F2B" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#5C6F2B" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#9ca3af", fontSize: 11, fontWeight: 500 }}
                    dy={8}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#9ca3af", fontSize: 11, fontWeight: 500 }}
                    width={60}
                    tickFormatter={(v) => v >= 1000 ? `₱${(v / 1000).toFixed(0)}k` : `₱${v}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="sales" stroke="#5C6F2B" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSales)" dot={false} activeDot={{ r: 5, fill: "#5C6F2B", strokeWidth: 0 }} animationDuration={800} />
                </AreaChart>
              ) : (
                <BarChart
                  key={`bar-${selectedDays}`}
                  data={chartData.length > 0 ? chartData : [{ name: "No data", sales: 0 }]}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#9ca3af", fontSize: 11, fontWeight: 500 }}
                    dy={8}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#9ca3af", fontSize: 11, fontWeight: 500 }}
                    width={60}
                    tickFormatter={(v) => v >= 1000 ? `₱${(v / 1000).toFixed(0)}k` : `₱${v}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="sales" fill="#5C6F2B" radius={[6, 6, 0, 0]} maxBarSize={48} animationDuration={800} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="recent-activity">
          <h3>
            <Activity size={16} color="#5C6F2B" />
            Recent Activity
          </h3>

          {dashboardData?.recentActivity && dashboardData.recentActivity.length > 0 ? (
            <ul className="activity-list">
              {dashboardData.recentActivity.slice(0, 6).map((activity, idx) => (
                <li
                  key={idx}
                  className="activity-item"
                  style={{ animation: `cardSlideIn 0.4s ease ${0.5 + idx * 0.07}s forwards`, opacity: 0 }}
                >
                  <div className="user-avatar">
                    {activity.user?.name?.substring(0, 2).toUpperCase() || "NA"}
                  </div>
                  <div className="item-info">
                    <p className="item-title">{activity.action}</p>
                    <p className="item-time">{new Date(activity.createdAt).toLocaleString()}</p>
                  </div>
                  <p className="item-amount" style={{ color: activity.status === "SUCCESS" ? "#10b981" : "#ef4444" }}>
                    {activity.status}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <div className="activity-empty">
              <div className="activity-empty-icon">📋</div>
              <p>{loading ? "Loading activity…" : "No recent activity"}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;