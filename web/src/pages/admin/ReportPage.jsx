import React, { useState, useEffect, useCallback } from "react";
import {
  Download,
  Users,
  ShoppingBag,
  Package,
  Undo2,
  TrendingUp,
  RefreshCw,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import "../../styles/admin/ReportPageStyle.css";
import {
  getSalesAnalytics,
  getProductAnalytics,
  getUserAnalytics,
  getCategoryAnalytics,
  getOrderAnalytics,
  getInventoryAnalytics,
  getPromotionAnalytics,
  getReturnsReport,
  downloadComprehensiveReportPDF,
} from "../../services/dashboardService";

// ─── Helpers ───────────────────────────────────────────────────────────────────
const getResult = (r) => r?.result || r || {};
const currency = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});
const yFmt = (v) => (v >= 1000 ? `₱${(v / 1000).toFixed(0)}k` : `₱${v}`);
const yFmtNum = (v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v));
const pct = (a, b) => (b > 0 ? `${((a / b) * 100).toFixed(1)}%` : "—");
const shortDate = (v) => {
  if (!v) return "—";
  const d = new Date(v);
  return isNaN(d)
    ? v
    : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

// ─── Palette ───────────────────────────────────────────────────────────────────
const C = {
  green: "#5C6F2B",
  orange: "#DE802B",
  teal: "#2B7F6F",
  red: "#DC4F4F",
  blue: "#3B7DD8",
  purple: "#9B6FDB",
  muted: "#9ca3af",
};
const PIE_COLORS = [
  C.green,
  C.orange,
  C.teal,
  C.purple,
  "#D8A33B",
  C.red,
  C.blue,
  "#8884d8",
  "#82ca9d",
  "#ffc658",
];
const STATUS_COLOR = {
  CONFIRMED: "#10b981",
  COMPLETED: "#3b82f6",
  PENDING: "#f59e0b",
  CANCELLED: "#ef4444",
};
const axisProps = {
  axisLine: false,
  tickLine: false,
  tick: { fill: C.muted, fontSize: 11 },
};

// ─── Shared UI components ──────────────────────────────────────────────────────

const Skeleton = ({ h = 240 }) => (
  <div className="rp-skeleton" style={{ height: h }} />
);

const ChartTooltip = ({ active, payload, label, prefix = "₱" }) => {
  if (!active || !payload?.length) return null;
  const noPrefix = ["orders", "count", "usage", "qty", "stock", "sold"];
  return (
    <div className="rp-tooltip">
      <p className="rp-tooltip__label">{label}</p>
      {payload.map((e, i) => (
        <p
          key={i}
          className="rp-tooltip__value"
          style={{ color: e.color || C.green }}
        >
          {noPrefix.includes(e.name) ? "" : prefix}
          {typeof e.value === "number"
            ? e.value.toLocaleString("en-PH")
            : e.value}
          <span className="rp-tooltip__name">&nbsp;{e.name}</span>
        </p>
      ))}
    </div>
  );
};

// KPI card — top-border accent
const KpiCard = ({ label, value, sub, accent = C.green, alert = false }) => (
  <div
    className={`rp-kpi${alert ? " rp-kpi--alert" : ""}`}
    style={{ borderTopColor: accent }}
  >
    <span className="rp-kpi__label">{label}</span>
    <strong className="rp-kpi__value">{value}</strong>
    {sub && (
      <span
        className="rp-kpi__sub"
        style={{ color: alert ? accent : undefined }}
      >
        {sub}
      </span>
    )}
  </div>
);

// Thin horizontal section label with a rule line
const SectionLabel = ({ text }) => (
  <div className="rp-section-label">
    <span>{text}</span>
    <div className="rp-section-label__line" />
  </div>
);

// White panel card
const Panel = ({ title, sub, accent = C.green, children, wide = false }) => (
  <div className={`rp-panel${wide ? " rp-panel--wide" : ""}`}>
    <div className="rp-panel__head">
      <div className="rp-panel__accent" style={{ background: accent }} />
      <div>
        <h3 className="rp-panel__title">{title}</h3>
        {sub && <p className="rp-panel__sub">{sub}</p>}
      </div>
    </div>
    {children}
  </div>
);

// Data table
const DataTable = ({ headers, rows, emptyMsg = "No data available." }) => (
  <div className="rp-table-wrap">
    <table className="rp-table">
      <thead>
        <tr>
          {headers.map((h, i) => (
            <th key={i} className={i > 0 ? "align-right" : ""}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td colSpan={headers.length} className="rp-table__empty">
              {emptyMsg}
            </td>
          </tr>
        ) : (
          rows.map((row, ri) => (
            <tr key={ri} className="rp-table__row">
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  className={
                    ci === 0
                      ? "rp-table__primary"
                      : "rp-table__secondary align-right"
                  }
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);

// Coloured status pill
const StatusBadge = ({ status }) => {
  const color = STATUS_COLOR[status] || "#9ca3af";
  return (
    <span
      className="rp-status-badge"
      style={{ color, background: `${color}18` }}
    >
      {status || "Unknown"}
    </span>
  );
};

// Ranked row with progress bar (products, categories)
const RankRow = ({ rank, label, value, formatted, max, accent }) => (
  <div className="rp-rank-row">
    <span className="rp-rank-row__num">{rank}</span>
    <div className="rp-rank-row__body">
      <div className="rp-rank-row__top">
        <span className="rp-rank-row__label">{label}</span>
        <span className="rp-rank-row__val">{formatted}</span>
      </div>
      <div className="rp-rank-row__track">
        <div
          className="rp-rank-row__fill"
          style={{
            width: `${max > 0 ? (value / max) * 100 : 0}%`,
            background: accent,
          }}
        />
      </div>
    </div>
  </div>
);

// Stacked bar (order revenue by status)
const StackedBar = ({ breakdown }) => {
  if (!breakdown?.length) return null;
  const total = breakdown.reduce((s, x) => s + (x.totalRevenue || 0), 0);
  return (
    <div className="rp-stacked">
      {breakdown.map((item, i) => (
        <div
          key={i}
          className="rp-stacked__seg"
          title={`${item._id}: ${pct(item.totalRevenue || 0, total)}`}
          style={{
            width: pct(item.totalRevenue || 0, total),
            background:
              STATUS_COLOR[item._id] || PIE_COLORS[i % PIE_COLORS.length],
          }}
        />
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
const ReportPage = () => {
  const [activeTab, setActiveTab] = useState("sales");
  const [timeRange, setTimeRange] = useState("30");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [data, setData] = useState({
    salesSummary: { totalSales: 0, totalOrders: 0, averageOrderValue: 0 },
    salesData: [],
    products: [],
    categories: [],
    users: {},
    orders: {},
    inventory: {
      summary: {},
      lowStockProducts: [],
      outOfStockProducts: [],
      stockByCategory: [],
    },
    promotions: { performanceData: [] },
    returns: [],
  });

  const [charts, setCharts] = useState({
    sales: [],
    products: [],
    categories: [],
    orderStatus: [],
    orderTiming: [],
    returnStatus: [],
  });

  // ── Fetch ───────────────────────────────────────────────────────────────────
  const fetchReportData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - parseInt(timeRange, 10));
      const sd = start.toISOString().split("T")[0];
      const ed = end.toISOString().split("T")[0];
      const groupBy = parseInt(timeRange, 10) > 60 ? "month" : "day";

      const [sR, prR, catR, uR, oR, invR, proR, retR] = await Promise.all([
        getSalesAnalytics({ startDate: sd, endDate: ed, groupBy }),
        getProductAnalytics({
          limit: 10,
          sortBy: "revenue",
          startDate: sd,
          endDate: ed,
        }),
        getCategoryAnalytics({ startDate: sd, endDate: ed }),
        getUserAnalytics({ startDate: sd, endDate: ed }),
        getOrderAnalytics({ startDate: sd, endDate: ed }),
        getInventoryAnalytics(),
        getPromotionAnalytics({ startDate: sd, endDate: ed }),
        getReturnsReport({ startDate: sd, endDate: ed }),
      ]);

      const sales = getResult(sR);
      const users = getResult(uR);
      const orders = getResult(oR);
      const inv = getResult(invR);
      const promo = getResult(proR);
      const returnsReport = getResult(retR);
      const returnsData = Array.isArray(returnsReport?.data)
        ? returnsReport.data
        : Array.isArray(retR?.data)
          ? retR.data
          : Array.isArray(returnsReport)
            ? returnsReport
            : [];

      setData({
        salesSummary: sales.summary || {},
        salesData: sales.data || [],
        products: prR.data || [],
        categories: catR.data || [],
        users,
        orders,
        inventory: inv,
        promotions: promo,
        returns: returnsData,
      });

      const returnStatusMap = returnsData.reduce((acc, item) => {
        const key = item?.status || "UNKNOWN";
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});

      setCharts({
        sales: (sales.data || []).map((i) => ({
          name: shortDate(i._id?.date || i.date),
          sales: i.totalSales || 0,
          orders: i.orderCount || 0,
        })),
        products: (prR.data || []).slice(0, 8).map((i) => ({
          name:
            i.productName?.length > 18
              ? i.productName.slice(0, 18) + "…"
              : i.productName || "—",
          revenue: i.totalRevenue || 0,
          sold: i.totalSold || 0,
        })),
        categories: (catR.data || []).map((i) => ({
          name: i.categoryName || "Unknown",
          sales: i.totalSales || 0,
          qty: i.totalQuantity || 0,
        })),
        orderStatus: (orders.statusBreakdown || []).map((i) => ({
          name: i._id || "Unknown",
          value: i.count || 0,
          revenue: i.totalRevenue || 0,
        })),
        orderTiming: (orders.timingAnalysis || []).map((i) => ({
          name: `${i._id?.hour ?? 0}:00`,
          orders: i.orderCount || 0,
        })),
        returnStatus: Object.entries(returnStatusMap).map(([name, value]) => ({
          name,
          value,
        })),
      });
    } catch (e) {
      setError(e.message || "Failed to fetch report data.");
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  // ── Export PDF ──────────────────────────────────────────────────────────────
  const handleExport = async () => {
    try {
      const blob = await downloadComprehensiveReportPDF(timeRange);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `report-${timeRange}d-${new Date().getTime()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading report:", error);
      setError("Failed to download report. Please try again.");
    }
  };

  // ── Derived ─────────────────────────────────────────────────────────────────
  const totalRevenue = data.salesSummary.totalSales || 0;
  const totalOrders = data.salesSummary.totalOrders || 0;
  const avgOrderVal = data.salesSummary.averageOrderValue || 0;
  const topProdMax = data.products[0]?.totalRevenue || 1;
  const topCatMax = data.categories[0]?.totalSales || 1;
  const lowStockCount = data.inventory.lowStockProducts?.length || 0;
  const outStockCount = data.inventory.outOfStockProducts?.length || 0;
  const totalReturns = data.returns?.length || 0;
  const completedReturns = (data.returns || []).filter(
    (item) => item?.status === "COMPLETED",
  ).length;
  const rejectedReturns = (data.returns || []).filter(
    (item) => item?.status === "REJECTED",
  ).length;
  const pendingReturns = (data.returns || []).filter((item) =>
    ["PENDING", "VALIDATED", "INSPECTED"].includes(item?.status),
  ).length;
  const totalReturnedValue = (data.returns || []).reduce(
    (sum, item) => sum + Number(item?.originalPrice || 0),
    0,
  );

  // ════════════════════════════════════════════════════════════════════════════
  // TAB: SALES & REVENUE
  // Contains: Sales Performance + Order Analytics from AnalyticsPage
  // ════════════════════════════════════════════════════════════════════════════
  const renderSales = () => (
    <>
      {/* ── Sales Performance KPIs ── */}
      <SectionLabel text="Sales Performance" />
      <div className="rp-kpi-row">
        <KpiCard
          label="Total Revenue"
          value={currency.format(totalRevenue)}
          sub={`across ${totalOrders.toLocaleString()} orders`}
          accent={C.green}
        />
        <KpiCard
          label="Avg. Order Value"
          value={currency.format(avgOrderVal)}
          sub="per confirmed order"
          accent={C.green}
        />
        <KpiCard
          label="Active Users"
          value={(data.users.activeUsersCount || 0).toLocaleString()}
          sub="with activity in period"
          accent={C.teal}
        />
        <KpiCard
          label="Avg. Daily Rev."
          value={currency.format(
            Math.round(totalRevenue / Math.max(parseInt(timeRange, 10), 1)),
          )}
          sub="per day in period"
          accent={C.green}
        />
      </div>

      {/* ── Revenue trend ── */}
      <Panel
        title="Revenue Over Time"
        sub="Daily revenue across the selected period"
        accent={C.green}
        wide
      >
        {loading ? (
          <Skeleton h={280} />
        ) : (
          <div className="rp-chart" style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={
                  charts.sales.length ? charts.sales : [{ name: "—", sales: 0 }]
                }
                margin={{ top: 10, right: 12, left: -4, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={C.green} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={C.green} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f0f0f0"
                />
                <XAxis
                  dataKey="name"
                  {...axisProps}
                  interval="preserveStartEnd"
                  dy={6}
                />
                <YAxis {...axisProps} width={60} tickFormatter={yFmt} />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke={C.green}
                  strokeWidth={2.5}
                  fill="url(#gRev)"
                  dot={false}
                  activeDot={{ r: 5, fill: C.green, strokeWidth: 0 }}
                  animationDuration={700}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </Panel>

      {/* ── Orders/day + Revenue by category ── */}
      <div className="rp-grid rp-grid--2col">
        <Panel title="Orders Per Day" sub="Daily order volume" accent={C.teal}>
          {loading ? (
            <Skeleton />
          ) : (
            <div className="rp-chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={
                    charts.sales.length
                      ? charts.sales
                      : [{ name: "—", orders: 0 }]
                  }
                  margin={{ top: 8, right: 8, left: -8, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f0f0f0"
                  />
                  <XAxis
                    dataKey="name"
                    {...axisProps}
                    interval="preserveStartEnd"
                    dy={6}
                  />
                  <YAxis {...axisProps} width={38} tickFormatter={yFmtNum} />
                  <Tooltip content={<ChartTooltip prefix="" />} />
                  <Bar
                    dataKey="orders"
                    fill={C.teal}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={30}
                    animationDuration={700}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>

        <Panel
          title="Revenue by Category"
          sub="Ranked by total sales in period"
          accent={C.orange}
        >
          {loading ? (
            <Skeleton />
          ) : data.categories.length === 0 ? (
            <p className="rp-empty">No category data.</p>
          ) : (
            <div className="rp-rank-list">
              {data.categories.map((c, i) => (
                <RankRow
                  key={i}
                  rank={i + 1}
                  label={c.categoryName || "Unknown"}
                  value={c.totalSales || 0}
                  formatted={currency.format(c.totalSales || 0)}
                  max={topCatMax}
                  accent={PIE_COLORS[i % PIE_COLORS.length]}
                />
              ))}
            </div>
          )}
        </Panel>
      </div>

      {/* ── Order Analytics ── */}
      <SectionLabel text="Order Analytics" />
      <div className="rp-grid rp-grid--3col">
        {/* Order status donut */}
        <Panel
          title="Order Status Breakdown"
          sub="Distribution by status"
          accent={C.orange}
        >
          {loading ? (
            <Skeleton />
          ) : (
            <div className="rp-chart">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={
                      charts.orderStatus.length
                        ? charts.orderStatus
                        : [{ name: "No data", value: 1 }]
                    }
                    cx="50%"
                    cy="47%"
                    innerRadius={52}
                    outerRadius={78}
                    paddingAngle={3}
                    dataKey="value"
                    animationBegin={0}
                    animationDuration={700}
                  >
                    {charts.orderStatus.map((e, i) => (
                      <Cell
                        key={i}
                        fill={
                          STATUS_COLOR[e.name] ||
                          PIE_COLORS[i % PIE_COLORS.length]
                        }
                        stroke="none"
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip prefix="" />} />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={(v) => (
                      <span
                        style={{
                          fontSize: 11,
                          color: "#6b7280",
                          fontWeight: 500,
                        }}
                      >
                        {v}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>

        {/* Peak order hours */}
        <Panel
          title="Peak Order Hours"
          sub="Orders by hour of day"
          accent={C.orange}
        >
          {loading ? (
            <Skeleton />
          ) : (
            <div className="rp-chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={
                    charts.orderTiming.length
                      ? charts.orderTiming
                      : [{ name: "—", orders: 0 }]
                  }
                  margin={{ top: 8, right: 8, left: -10, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f0f0f0"
                  />
                  <XAxis
                    dataKey="name"
                    {...axisProps}
                    tick={{ ...axisProps.tick, fontSize: 10 }}
                    interval={2}
                    dy={6}
                  />
                  <YAxis {...axisProps} width={32} tickFormatter={yFmtNum} />
                  <Tooltip content={<ChartTooltip prefix="" />} />
                  <Bar
                    dataKey="orders"
                    fill={C.orange}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={20}
                    animationDuration={700}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>

        {/* Status table + stacked bar */}
        <Panel
          title="Status Revenue Breakdown"
          sub="Revenue & average per group"
          accent={C.orange}
        >
          {loading ? (
            <Skeleton h={220} />
          ) : (
            <>
              <DataTable
                headers={["Status", "Orders", "Revenue", "Avg."]}
                rows={(data.orders.statusBreakdown || []).map((item) => [
                  <StatusBadge status={item._id} />,
                  (item.count || 0).toLocaleString(),
                  currency.format(item.totalRevenue || 0),
                  currency.format(item.averageValue || 0),
                ])}
                emptyMsg="No order data."
              />
              <StackedBar breakdown={data.orders.statusBreakdown} />
            </>
          )}
        </Panel>
      </div>

      {/* ── Daily sales log ── */}
      <SectionLabel text="Daily Sales Log" />
      <Panel
        title="Full Sales Log"
        sub="Every recorded data point for the selected period"
        accent={C.green}
        wide
      >
        {loading ? (
          <Skeleton h={180} />
        ) : (
          <DataTable
            headers={["Date", "Orders", "Revenue", "Avg. Order Value"]}
            rows={(data.salesData || []).map((item) => [
              shortDate(item._id?.date || item.date),
              (item.orderCount || 0).toLocaleString(),
              currency.format(item.totalSales || 0),
              currency.format(
                item.orderCount > 0
                  ? Math.round((item.totalSales || 0) / item.orderCount)
                  : 0,
              ),
            ])}
            emptyMsg="No sales data for this period."
          />
        )}
      </Panel>
    </>
  );

  // ════════════════════════════════════════════════════════════════════════════
  // TAB: RETURNS REPORT
  // ════════════════════════════════════════════════════════════════════════════
  const renderReturns = () => (
    <>
      <SectionLabel text="Returns Report" />
      <div className="rp-kpi-row">
        <KpiCard
          label="Total Return Requests"
          value={totalReturns.toLocaleString()}
          sub="all recorded returns"
          accent={C.red}
        />
        <KpiCard
          label="Completed Returns"
          value={completedReturns.toLocaleString()}
          sub={pct(completedReturns, totalReturns)}
          accent={C.green}
        />
        <KpiCard
          label="Rejected Returns"
          value={rejectedReturns.toLocaleString()}
          sub={pct(rejectedReturns, totalReturns)}
          accent={C.orange}
        />
        <KpiCard
          label="Returned Value"
          value={currency.format(totalReturnedValue)}
          sub="sum of item original prices"
          accent={C.red}
        />
      </div>

      <div className="rp-grid rp-grid--2col">
        <Panel
          title="Return Status Breakdown"
          sub="Current state distribution"
          accent={C.red}
        >
          {loading ? (
            <Skeleton />
          ) : (
            <div className="rp-chart">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={
                      charts.returnStatus.length
                        ? charts.returnStatus
                        : [{ name: "No data", value: 1 }]
                    }
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={82}
                    paddingAngle={3}
                    dataKey="value"
                    animationDuration={700}
                  >
                    {charts.returnStatus.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={
                          STATUS_COLOR[entry.name] ||
                          PIE_COLORS[i % PIE_COLORS.length]
                        }
                        stroke="none"
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip prefix="" />} />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={(v) => (
                      <span
                        style={{
                          fontSize: 11,
                          color: "#6b7280",
                          fontWeight: 500,
                        }}
                      >
                        {v}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>

        <Panel
          title="Returns Snapshot"
          sub="Operational summary"
          accent={C.red}
        >
          {loading ? (
            <Skeleton h={200} />
          ) : (
            <DataTable
              headers={["Metric", "Value"]}
              rows={[
                ["Pending / In-progress", pendingReturns.toLocaleString()],
                ["Completed", completedReturns.toLocaleString()],
                ["Rejected", rejectedReturns.toLocaleString()],
                [
                  "Cancellation",
                  (data.returns || [])
                    .filter((i) => i?.status === "CANCELLED")
                    .length.toLocaleString(),
                ],
              ]}
              emptyMsg="No return metrics available."
            />
          )}
        </Panel>
      </div>

      <Panel
        title="Recent Returns"
        sub="Latest return requests and outcomes"
        accent={C.red}
        wide
      >
        {loading ? (
          <Skeleton h={220} />
        ) : (
          <DataTable
            headers={[
              "Date",
              "Item",
              "Value",
              "Status",
              "Fulfillment",
              "Inspection",
            ]}
            rows={(data.returns || [])
              .slice()
              .sort(
                (a, b) =>
                  new Date(b?.initiatedAt || b?.createdAt || 0) -
                  new Date(a?.initiatedAt || a?.createdAt || 0),
              )
              .slice(0, 10)
              .map((item) => [
                shortDate(item?.initiatedAt || item?.createdAt),
                item?.originalItemName || "Unknown item",
                currency.format(item?.originalPrice || 0),
                <StatusBadge status={item?.status || "UNKNOWN"} />,
                item?.fulfillmentType || "—",
                item?.inspectionStatus || "—",
              ])}
            emptyMsg="No return records found."
          />
        )}
      </Panel>
    </>
  );

  // ════════════════════════════════════════════════════════════════════════════
  // TAB: PROFIT & MARKUP
  // ════════════════════════════════════════════════════════════════════════════
  const renderProfit = () => {
    // Calculate simulated profit based on 20% markup
    const profitData = (data.salesData || []).map((item) => ({
      name: shortDate(item._id?.date || item.date),
      revenue: item.totalSales || 0,
      profit: (item.totalSales || 0) * 0.2,
    }));

    return (
      <>
        <SectionLabel text="Profit Analysis" />
        <div className="rp-kpi-row">
          <KpiCard
            label="Estimated Gross Profit"
            value={currency.format(totalRevenue * 0.2)}
            sub="based on 20% margin"
            accent={C.green}
          />
          <KpiCard
            label="Net Margin"
            value="20.0%"
            sub="estimated average"
            accent={C.teal}
          />
        </div>

        <Panel
          title="Gross Profit Trends"
          sub="Estimated 20% Markup Analysis"
          accent={C.green}
          wide
        >
          {loading ? (
            <Skeleton h={280} />
          ) : (
            <div className="rp-chart" style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={profitData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f0f0f0"
                  />
                  <XAxis dataKey="name" {...axisProps} dy={6} />
                  <YAxis {...axisProps} width={60} tickFormatter={yFmt} />
                  <Tooltip content={<ChartTooltip prefix="₱" />} />
                  <Bar
                    dataKey="profit"
                    fill={C.green}
                    radius={[4, 4, 0, 0]}
                    name="Profit"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>

        <Panel
          title="Profit & Discount Log"
          sub="Detailed breakdown"
          accent={C.green}
          wide
        >
          <DataTable
            headers={[
              "Date",
              "Total Revenue",
              "Est. Profit (20%)",
              "PWD/Senior Disc. (Est. 5%)",
            ]}
            rows={profitData.map((item) => [
              item.name,
              currency.format(item.revenue),
              <span style={{ color: C.green, fontWeight: 600 }}>
                {currency.format(item.profit)}
              </span>,
              <span style={{ color: C.red }}>
                {currency.format(item.revenue * 0.05)}
              </span>,
            ])}
          />
        </Panel>
      </>
    );
  };

  // ════════════════════════════════════════════════════════════════════════════
  // TAB: USER INSIGHTS
  // Contains: Customer Insights from AnalyticsPage
  // ════════════════════════════════════════════════════════════════════════════
  const renderUsers = () => (
    <>
      <SectionLabel text="Customer Overview" />
      <div className="rp-kpi-row">
        <KpiCard
          label="Total Registered"
          value={(data.users.totalUsers || 0).toLocaleString()}
          sub="all time"
          accent={C.blue}
        />
        <KpiCard
          label="New in Period"
          value={(data.users.newUsers || 0).toLocaleString()}
          sub="registered recently"
          accent={C.blue}
        />
        <KpiCard
          label="Active Users"
          value={(data.users.activeUsersCount || 0).toLocaleString()}
          sub="with orders / activity"
          accent={C.teal}
        />
        <KpiCard
          label="Activation Rate"
          value={pct(
            data.users.activeUsersCount || 0,
            data.users.totalUsers || 0,
          )}
          sub="active vs. total"
          accent={C.teal}
        />
      </div>

      <SectionLabel text="Top Spenders" />
      <Panel
        title="Highest Lifetime Value Customers"
        sub="Ranked by total spend in selected period"
        accent={C.blue}
        wide
      >
        {loading ? (
          <Skeleton h={240} />
        ) : (
          <DataTable
            headers={["#", "Customer", "Orders", "Total Spent", "Avg. / Order"]}
            rows={(data.users.topSpenders || []).map((u, i) => [
              <span
                className="rp-rank-badge"
                style={{
                  background: i < 3 ? C.blue : "#f3f4f6",
                  color: i < 3 ? "#fff" : C.muted,
                }}
              >
                {i + 1}
              </span>,
              u.userName || u.userEmail || "Unknown",
              (u.orderCount || 0).toLocaleString(),
              currency.format(u.totalSpent || 0),
              currency.format(
                u.orderCount > 0
                  ? Math.round((u.totalSpent || 0) / u.orderCount)
                  : 0,
              ),
            ])}
            emptyMsg="No spender data available."
          />
        )}
      </Panel>
    </>
  );

  // ════════════════════════════════════════════════════════════════════════════
  // TAB: PRODUCT PERFORMANCE
  // Contains: Products & Categories from AnalyticsPage
  // ════════════════════════════════════════════════════════════════════════════
  const renderProducts = () => (
    <>
      {/* ── Charts ── */}
      <SectionLabel text="Revenue Charts" />
      <div className="rp-grid rp-grid--2col">
        {/* Horizontal bar — top products */}
        <Panel
          title="Top Products by Revenue"
          sub="Highest-grossing products"
          accent={C.green}
        >
          {loading ? (
            <Skeleton h={280} />
          ) : (
            <div className="rp-chart" style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={
                    charts.products.length
                      ? charts.products
                      : [{ name: "No data", revenue: 0 }]
                  }
                  layout="vertical"
                  margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                    stroke="#f0f0f0"
                  />
                  <XAxis type="number" {...axisProps} tickFormatter={yFmt} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    {...axisProps}
                    tick={{
                      ...axisProps.tick,
                      fill: "#374151",
                      fontWeight: 600,
                    }}
                    width={110}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar
                    dataKey="revenue"
                    fill={C.green}
                    radius={[0, 5, 5, 0]}
                    maxBarSize={18}
                    animationDuration={700}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>

        {/* Category pie */}
        <Panel
          title="Category Sales Distribution"
          sub="Revenue share by category"
          accent={C.orange}
        >
          {loading ? (
            <Skeleton h={280} />
          ) : (
            <div className="rp-chart" style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={
                      charts.categories.length
                        ? charts.categories
                        : [{ name: "No data", sales: 1 }]
                    }
                    cx="50%"
                    cy="50%"
                    outerRadius={95}
                    paddingAngle={2}
                    dataKey="sales"
                    animationBegin={0}
                    animationDuration={700}
                  >
                    {charts.categories.map((_, i) => (
                      <Cell
                        key={i}
                        fill={PIE_COLORS[i % PIE_COLORS.length]}
                        stroke="none"
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={(v) => (
                      <span
                        style={{
                          fontSize: 11,
                          color: "#6b7280",
                          fontWeight: 500,
                        }}
                      >
                        {v}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>
      </div>

      {/* ── Product ranking ── */}
      <SectionLabel text="Product Ranking" />
      <Panel
        title="Product Revenue Ranking"
        sub="Progress bars show share of the #1 product"
        accent={C.green}
        wide
      >
        {loading ? (
          <Skeleton h={260} />
        ) : data.products.length === 0 ? (
          <p className="rp-empty">No product data.</p>
        ) : (
          <div className="rp-rank-list rp-rank-list--wide">
            {data.products.slice(0, 10).map((p, i) => (
              <RankRow
                key={i}
                rank={i + 1}
                label={p.productName || "Unnamed"}
                value={p.totalRevenue || 0}
                formatted={`${currency.format(p.totalRevenue || 0)} · ${(p.totalSold || 0).toLocaleString()} sold`}
                max={topProdMax}
                accent={i < 3 ? C.green : C.teal}
              />
            ))}
          </div>
        )}
      </Panel>

      {/* ── Detailed tables ── */}
      <SectionLabel text="Detailed Tables" />
      <div className="rp-grid rp-grid--2col">
        <Panel title="Top Products" sub="Sorted by revenue" accent={C.green}>
          {loading ? (
            <Skeleton h={200} />
          ) : (
            <DataTable
              headers={["Product", "Units Sold", "Revenue"]}
              rows={(data.products || []).map((item) => [
                item.productName || "Unnamed",
                (item.totalSold || 0).toLocaleString(),
                currency.format(item.totalRevenue || 0),
                currency.format(item.totalRevenue || 0),
              ])}
              emptyMsg="No product data."
            />
          )}
        </Panel>

        <Panel
          title="Category Performance"
          sub="Sorted by total sales"
          accent={C.orange}
        >
          {loading ? (
            <Skeleton h={200} />
          ) : (
            <DataTable
              headers={["Category", "Qty Sold", "Total Sales"]}
              rows={(data.categories || []).map((item) => [
                item.categoryName || "Unknown",
                (item.totalQuantity || 0).toLocaleString(),
                currency.format(item.totalSales || 0),
              ])}
              emptyMsg="No category data."
            />
          )}
        </Panel>
      </div>
    </>
  );

  // ════════════════════════════════════════════════════════════════════════════
  // TAB: INVENTORY STATUS
  // Contains: Inventory Status + Promotions from AnalyticsPage
  // ════════════════════════════════════════════════════════════════════════════
  const renderInventory = () => (
    <>
      {/* ── Inventory KPIs ── */}
      <SectionLabel text="Inventory Status" />
      <div className="rp-kpi-row">
        <KpiCard
          label="Total Units"
          value={(data.inventory.summary?.totalUnits || 0).toLocaleString()}
          sub="across all SKUs"
          accent={C.green}
        />
        <KpiCard
          label="Inventory Value"
          value={currency.format(data.inventory.summary?.totalValue || 0)}
          sub="at current prices"
          accent={C.green}
        />
        <KpiCard
          label="Low Stock"
          value={lowStockCount}
          sub="products below 10 units"
          accent={C.orange}
          alert={lowStockCount > 0}
        />
        <KpiCard
          label="Out of Stock"
          value={outStockCount}
          sub="need immediate restock"
          accent={C.red}
          alert={outStockCount > 0}
        />
      </div>

      <div className="rp-grid rp-grid--2col">
        {/* Stock by category bar chart */}
        <Panel
          title="Stock by Category"
          sub="Current units in inventory per category"
          accent={C.green}
        >
          {loading ? (
            <Skeleton />
          ) : (
            (() => {
              const d = (data.inventory.stockByCategory || []).map((c) => ({
                name:
                  c.categoryName?.length > 16
                    ? c.categoryName.slice(0, 16) + "…"
                    : c.categoryName || "?",
                stock: c.totalStock || 0,
              }));
              return (
                <div className="rp-chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={d.length ? d : [{ name: "—", stock: 0 }]}
                      margin={{ top: 4, right: 8, left: -8, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#f0f0f0"
                      />
                      <XAxis dataKey="name" {...axisProps} dy={6} />
                      <YAxis
                        {...axisProps}
                        width={38}
                        tickFormatter={yFmtNum}
                      />
                      <Tooltip content={<ChartTooltip prefix="" />} />
                      <Bar
                        dataKey="stock"
                        fill={C.green}
                        radius={[4, 4, 0, 0]}
                        maxBarSize={30}
                        animationDuration={700}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              );
            })()
          )}
        </Panel>

        {/* Low stock alert table */}
        <Panel
          title="⚠ Low Stock Alert"
          sub="Products needing restock — below 10 units"
          accent={C.orange}
        >
          {loading ? (
            <Skeleton h={200} />
          ) : (
            <DataTable
              headers={["Product", "Units Left", "Unit Price"]}
              rows={(data.inventory.lowStockProducts || []).map((item) => [
                item.name || "Unknown",
                <span
                  className={`rp-stock-num ${item.stockQuantity <= 3 ? "rp-stock-num--critical" : "rp-stock-num--low"}`}
                >
                  {item.stockQuantity || 0} units
                </span>,
                currency.format(item.price || 0),
              ])}
              emptyMsg="✓ All products are well stocked."
            />
          )}
        </Panel>
      </div>

      {/* ── Promotions ── */}
      <SectionLabel text="Promotions" />
      <div className="rp-kpi-row">
        <KpiCard
          label="Total Promo Codes"
          value={data.promotions.totalPromos || 0}
          sub="created"
          accent={C.purple}
        />
        <KpiCard
          label="Active Now"
          value={data.promotions.activePromos || 0}
          sub="currently running"
          accent={C.green}
        />
        <KpiCard
          label="Inactive / Expired"
          value={data.promotions.inactivePromos || 0}
          sub="not running"
          accent={C.muted}
        />
      </div>

      <div className="rp-grid rp-grid--2col">
        {/* Promo usage bar */}
        <Panel
          title="Promo Usage"
          sub="Times each code was applied in selected period"
          accent={C.purple}
        >
          {loading ? (
            <Skeleton />
          ) : (
            (() => {
              const d = (data.promotions.performanceData || []).map((p) => ({
                name: p.promoName || p.promoCode || "?",
                usage: p.usageCount || 0,
              }));
              return (
                <div className="rp-chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={d.length ? d : [{ name: "—", usage: 0 }]}
                      margin={{ top: 4, right: 8, left: -8, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#f0f0f0"
                      />
                      <XAxis dataKey="name" {...axisProps} dy={6} />
                      <YAxis
                        {...axisProps}
                        width={36}
                        tickFormatter={yFmtNum}
                      />
                      <Tooltip content={<ChartTooltip prefix="" />} />
                      <Bar
                        dataKey="usage"
                        fill={C.purple}
                        radius={[4, 4, 0, 0]}
                        maxBarSize={30}
                        animationDuration={700}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              );
            })()
          )}
        </Panel>

        {/* Promo performance table */}
        <Panel
          title="Promotion Performance"
          sub="Discount impact per code"
          accent={C.purple}
        >
          {loading ? (
            <Skeleton h={200} />
          ) : (
            <DataTable
              headers={["Promo Code", "Uses", "Total Discount Given"]}
              rows={(data.promotions.performanceData || []).map((item) => [
                <span className="rp-promo-code">
                  {item.promoName || item.promoCode || "—"}
                </span>,
                (item.usageCount || 0).toLocaleString(),
                currency.format(item.totalDiscountGiven || 0),
              ])}
              emptyMsg="No promotion data available."
            />
          )}
        </Panel>
      </div>
    </>
  );

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="report-page">
      {/* ── Page header ────────────────────────────────────────────────────── */}
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
          <button
            className="rp-refresh-btn"
            onClick={fetchReportData}
            disabled={loading}
          >
            <RefreshCw size={15} className={loading ? "rp-spin" : ""} />
            {loading ? "Loading…" : "Refresh"}
          </button>
          <button className="export-btn" onClick={handleExport}>
            <Download size={18} />
            Download Report
          </button>
        </div>
      </div>

      {error && <div className="rp-error">⚠ {error}</div>}

      {/* ── Tabs ────────────────────────────────────────────────────────────── */}
      <div className="report-tabs">
        <button
          className={`tab-btn${activeTab === "sales" ? " active" : ""}`}
          onClick={() => setActiveTab("sales")}
        >
          <TrendingUp size={16} /> Sales &amp; Revenue
        </button>
        <button
          className={`tab-btn${activeTab === "users" ? " active" : ""}`}
          onClick={() => setActiveTab("users")}
        >
          <Users size={16} /> User Insights
        </button>
        <button
          className={`tab-btn${activeTab === "products" ? " active" : ""}`}
          onClick={() => setActiveTab("products")}
        >
          <ShoppingBag size={16} /> Product Performance
        </button>
        <button
          className={`tab-btn${activeTab === "inventory" ? " active" : ""}`}
          onClick={() => setActiveTab("inventory")}
        >
          <Package size={16} /> Inventory Status
        </button>
        <button
          className={`tab-btn${activeTab === "returns" ? " active" : ""}`}
          onClick={() => setActiveTab("returns")}
        >
          <Undo2 size={16} /> Returns Report
        </button>
      </div>

      {/* ── Tab body ────────────────────────────────────────────────────────── */}
      <div className="rp-tab-body">
        {activeTab === "sales" && renderSales()}
        {activeTab === "profit" && renderProfit()}
        {activeTab === "users" && renderUsers()}
        {activeTab === "products" && renderProducts()}
        {activeTab === "inventory" && renderInventory()}
        {activeTab === "returns" && renderReturns()}
      </div>
    </div>
  );
};

export default ReportPage;
