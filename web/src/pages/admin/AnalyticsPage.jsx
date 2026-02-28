import React from "react";
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
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import {
  getSalesAnalytics,
  getProductAnalytics,
  getCategoryAnalytics,
  getUserAnalytics,
  getOrderAnalytics,
  getInventoryAnalytics,
  getPromotionAnalytics,
} from "../../services/dashboardService";
import "../../styles/admin/AnalyticsPageStyle.css";

// ─── Helpers ───────────────────────────────────────────────────────────────────
const formatDateInput = (date) => date.toISOString().split("T")[0];

const currency = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});

const getResult = (r) => r?.result || r || {};

const formatShortDate = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d)) return value;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const yFmt = (v) => (v >= 1000 ? `₱${(v / 1000).toFixed(0)}k` : `₱${v}`);
const yFmtNum = (v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v));

// ─── Palette ───────────────────────────────────────────────────────────────────
const C_GREEN = "#5C6F2B";
const C_ORANGE = "#DE802B";
const C_TEAL = "#2B7F6F";
const C_RED = "#DC4F4F";
const C_BLUE = "#3B7DD8";
const C_PURPLE = "#9B6FDB";

const PIE_COLORS = [
  C_GREEN,
  C_ORANGE,
  C_TEAL,
  C_PURPLE,
  "#D8A33B",
  C_RED,
  C_BLUE,
];

const STATUS_COLOR = {
  CONFIRMED: "#10b981",
  COMPLETED: "#3b82f6",
  PENDING: "#f59e0b",
  CANCELLED: "#ef4444",
};

// ─── Custom tooltip ────────────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label, prefix = "₱" }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip__label">{label}</p>
      {payload.map((entry, i) => (
        <p
          key={i}
          className="chart-tooltip__value"
          style={{ color: entry.color || C_GREEN }}
        >
          {entry.name === "orders" ||
          entry.name === "count" ||
          entry.name === "usage" ||
          entry.name === "qty" ||
          entry.name === "stock"
            ? ""
            : prefix}
          {typeof entry.value === "number"
            ? entry.value.toLocaleString("en-PH")
            : entry.value}
          <span className="chart-tooltip__name">{entry.name}</span>
        </p>
      ))}
    </div>
  );
};

// ─── Section wrapper ───────────────────────────────────────────────────────────
const Section = ({ children, className = "" }) => (
  <div className={`analytics-section ${className}`}>{children}</div>
);

// ─── Section header ────────────────────────────────────────────────────────────
const SectionHeader = ({ icon, title, subtitle, accent = C_GREEN }) => (
  <div className="section-header">
    <div
      className="section-header__icon"
      style={{ background: `${accent}18`, color: accent }}
    >
      {icon}
    </div>
    <div>
      <h2 className="section-header__title">{title}</h2>
      {subtitle && <p className="section-header__sub">{subtitle}</p>}
    </div>
    <div className="section-header__bar" style={{ background: accent }} />
  </div>
);

// ─── Chart card ────────────────────────────────────────────────────────────────
const ChartCard = ({ title, subtitle, accent = C_GREEN, children }) => (
  <div className="analytics-card chart-card">
    <div className="chart-card__head">
      <div>
        <h3>{title}</h3>
        {subtitle && <p className="chart-card__sub">{subtitle}</p>}
      </div>
      <div className="chart-card__bar" style={{ background: accent }} />
    </div>
    {children}
  </div>
);

// ─── Mini stat ─────────────────────────────────────────────────────────────────
const MiniStat = ({ label, value, accent = C_GREEN }) => (
  <div
    className="mini-stat"
    style={{ borderColor: `${accent}25`, background: `${accent}08` }}
  >
    <span className="mini-stat__label">{label}</span>
    <strong className="mini-stat__value">{value}</strong>
  </div>
);

// ─── Data table ────────────────────────────────────────────────────────────────
const DataTable = ({ headers, rows, emptyMsg = "No data available." }) => (
  <div className="data-table-wrap">
    <table className="data-table">
      <thead>
        <tr>
          {headers.map((h, i) => (
            <th key={i} className={i === 0 ? "" : "align-right"}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td colSpan={headers.length} className="data-table__empty">
              {emptyMsg}
            </td>
          </tr>
        ) : (
          rows.map((row, ri) => (
            <tr key={ri} className="data-table__row">
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  className={
                    ci === 0
                      ? "data-table__primary"
                      : "data-table__secondary align-right"
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

// ─── Skeleton ──────────────────────────────────────────────────────────────────
const Skeleton = ({ h = 220 }) => (
  <div className="skeleton" style={{ height: h }} />
);

// ─── Status badge ──────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const color = STATUS_COLOR[status] || "#9ca3af";
  return (
    <span className="status-badge" style={{ color, background: `${color}18` }}>
      {status || "Unknown"}
    </span>
  );
};

// ─── Main ──────────────────────────────────────────────────────────────────────
function AnalyticsPage() {
  const today = new Date();
  const defaultStart = new Date();
  defaultStart.setDate(today.getDate() - 30);

  const [startDate, setStartDate] = React.useState(
    formatDateInput(defaultStart),
  );
  const [endDate, setEndDate] = React.useState(formatDateInput(today));
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const [analytics, setAnalytics] = React.useState({
    salesSummary: { totalSales: 0, totalOrders: 0, averageOrderValue: 0 },
    products: [],
    categories: [],
    users: {},
    orders: {},
    inventory: {
      summary: { totalUnits: 0, totalValue: 0 },
      lowStockProducts: [],
      outOfStockProducts: [],
      stockByCategory: [],
    },
    promotions: { performanceData: [] },
  });

  const [charts, setCharts] = React.useState({
    sales: [],
    categories: [],
    products: [],
    orderStatus: [],
    orderTiming: [],
  });

  const fetchAnalytics = React.useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [
        salesRes,
        productRes,
        categoryRes,
        userRes,
        orderRes,
        inventoryRes,
        promoRes,
      ] = await Promise.all([
        getSalesAnalytics({ startDate, endDate, groupBy: "day" }),
        getProductAnalytics({
          limit: 10,
          sortBy: "revenue",
          startDate,
          endDate,
        }),
        getCategoryAnalytics({ startDate, endDate }),
        getUserAnalytics({ startDate, endDate }),
        getOrderAnalytics({ startDate, endDate }),
        getInventoryAnalytics(),
        getPromotionAnalytics({ startDate, endDate }),
      ]);

      const salesResult = getResult(salesRes);
      const userResult = getResult(userRes);
      const orderResult = getResult(orderRes);
      const inventoryResult = getResult(inventoryRes);
      const promoResult = getResult(promoRes);

      setAnalytics({
        salesSummary: salesResult.summary || {
          totalSales: 0,
          totalOrders: 0,
          averageOrderValue: 0,
        },
        products: productRes.data || [],
        categories: categoryRes.data || [],
        users: userResult,
        orders: orderResult,
        inventory: inventoryResult,
        promotions: promoResult,
      });

      setCharts({
        sales: (salesResult.data || []).map((item) => ({
          name: formatShortDate(item._id?.date || item.date),
          sales: item.totalSales || 0,
          orders: item.orderCount || 0,
        })),
        categories: (categoryRes.data || []).map((item) => ({
          name: item.categoryName || "Unknown",
          sales: item.totalSales || 0,
          qty: item.totalQuantity || 0,
        })),
        products: (productRes.data || []).slice(0, 8).map((item) => ({
          name:
            item.productName?.length > 16
              ? item.productName.slice(0, 16) + "…"
              : item.productName || "Unnamed",
          revenue: item.totalRevenue || 0,
          sold: item.totalSold || 0,
        })),
        orderStatus: (orderResult.statusBreakdown || []).map((item) => ({
          name: item._id || "Unknown",
          value: item.count || 0,
          revenue: item.totalRevenue || 0,
        })),
        orderTiming: (orderResult.timingAnalysis || []).map((item) => ({
          name: `${item._id?.hour ?? 0}:00`,
          orders: item.orderCount || 0,
        })),
      });
    } catch (err) {
      setError(err.message || "Failed to load analytics.");
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  React.useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="analytics-view">
      {/* ── Page header ── */}
      <div className="analytics-header">
        <div>
          <h1>Analytics</h1>
          <p className="analytics-subtitle">
            Sales, products, customers &amp; inventory performance
          </p>
        </div>
        <div className="date-range">
          <div className="date-input">
            <label htmlFor="an-start">From</label>
            <input
              id="an-start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="date-input">
            <label htmlFor="an-end">To</label>
            <input
              id="an-end"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <button
            className="apply-btn"
            onClick={fetchAnalytics}
            disabled={loading}
          >
            {loading ? "Loading…" : "Apply"}
          </button>
        </div>
      </div>

      {error && <div className="analytics-error">⚠ {error}</div>}

      {/* ══════════════════════════════════════════════
          SECTION 1 — SALES
      ══════════════════════════════════════════════ */}
      <Section>
        <SectionHeader
          icon="📈"
          title="Sales Performance"
          subtitle="Revenue & order trends for the selected period"
          accent={C_GREEN}
        />

        <div className="mini-stats-row">
          <MiniStat
            label="Total Sales"
            value={currency.format(analytics.salesSummary.totalSales || 0)}
            accent={C_GREEN}
          />
          <MiniStat
            label="Total Orders"
            value={(analytics.salesSummary.totalOrders || 0).toLocaleString()}
            accent={C_GREEN}
          />
          <MiniStat
            label="Avg. Order Value"
            value={currency.format(
              analytics.salesSummary.averageOrderValue || 0,
            )}
            accent={C_GREEN}
          />
          <MiniStat
            label="Active Users"
            value={(analytics.users.activeUsersCount || 0).toLocaleString()}
            accent={C_TEAL}
          />
        </div>

        <div className="analytics-columns">
          <ChartCard
            title="Revenue Over Time"
            subtitle="Daily sales in selected period"
            accent={C_GREEN}
          >
            {loading ? (
              <Skeleton />
            ) : (
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={
                      charts.sales.length
                        ? charts.sales
                        : [{ name: "—", sales: 0 }]
                    }
                    margin={{ top: 8, right: 8, left: -8, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="gSales" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor={C_GREEN}
                          stopOpacity={0.2}
                        />
                        <stop
                          offset="95%"
                          stopColor={C_GREEN}
                          stopOpacity={0}
                        />
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
                      tick={{ fill: "#9ca3af", fontSize: 11 }}
                      interval="preserveStartEnd"
                      dy={6}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      width={56}
                      tick={{ fill: "#9ca3af", fontSize: 11 }}
                      tickFormatter={yFmt}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="sales"
                      stroke={C_GREEN}
                      strokeWidth={2.5}
                      fill="url(#gSales)"
                      dot={false}
                      activeDot={{ r: 5, fill: C_GREEN, strokeWidth: 0 }}
                      animationDuration={800}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </ChartCard>

          <ChartCard
            title="Daily Order Count"
            subtitle="Number of orders per day"
            accent={C_TEAL}
          >
            {loading ? (
              <Skeleton />
            ) : (
              <div className="chart-wrapper">
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
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#9ca3af", fontSize: 11 }}
                      interval="preserveStartEnd"
                      dy={6}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      width={40}
                      tick={{ fill: "#9ca3af", fontSize: 11 }}
                      tickFormatter={yFmtNum}
                    />
                    <Tooltip content={<ChartTooltip prefix="" />} />
                    <Bar
                      dataKey="orders"
                      fill={C_TEAL}
                      radius={[5, 5, 0, 0]}
                      maxBarSize={32}
                      animationDuration={800}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </ChartCard>
        </div>
      </Section>

      {/* ══════════════════════════════════════════════
          SECTION 2 — ORDERS
      ══════════════════════════════════════════════ */}
      <Section>
        <SectionHeader
          icon=""
          title="Order Analytics"
          subtitle="Status breakdown and peak ordering hours"
          accent={C_ORANGE}
        />

        <div className="analytics-columns">
          <ChartCard
            title="Order Status Breakdown"
            subtitle="Distribution by status"
            accent={C_ORANGE}
          >
            {loading ? (
              <Skeleton />
            ) : (
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={
                        charts.orderStatus.length
                          ? charts.orderStatus
                          : [{ name: "No data", value: 1 }]
                      }
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                      animationBegin={0}
                      animationDuration={800}
                    >
                      {charts.orderStatus.map((entry, i) => (
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
                            fontSize: 12,
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
          </ChartCard>

          <ChartCard
            title="Peak Order Hours"
            subtitle="Orders by hour of day"
            accent={C_ORANGE}
          >
            {loading ? (
              <Skeleton />
            ) : (
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={
                      charts.orderTiming.length
                        ? charts.orderTiming
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
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#9ca3af", fontSize: 10 }}
                      interval={1}
                      dy={6}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      width={36}
                      tick={{ fill: "#9ca3af", fontSize: 11 }}
                      tickFormatter={yFmtNum}
                    />
                    <Tooltip content={<ChartTooltip prefix="" />} />
                    <Bar
                      dataKey="orders"
                      fill={C_ORANGE}
                      radius={[4, 4, 0, 0]}
                      maxBarSize={24}
                      animationDuration={800}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </ChartCard>
        </div>

        <div className="analytics-card">
          <h3>Order Status Table</h3>
          <DataTable
            headers={["Status", "Orders", "Total Revenue", "Avg. Value"]}
            rows={(analytics.orders.statusBreakdown || []).map((item) => [
              <StatusBadge status={item._id} />,
              (item.count || 0).toLocaleString(),
              currency.format(item.totalRevenue || 0),
              currency.format(item.averageValue || 0),
            ])}
            emptyMsg="No order data available."
          />
        </div>
      </Section>

      {/* ══════════════════════════════════════════════
          SECTION 3 — PRODUCTS & CATEGORIES
      ══════════════════════════════════════════════ */}
      <Section>
        <SectionHeader
          icon="🛒"
          title="Products & Categories"
          subtitle="Top performers by revenue and quantity"
          accent={C_GREEN}
        />

        <div className="analytics-columns">
          <ChartCard
            title="Top Products by Revenue"
            subtitle="Highest-grossing products (horizontal)"
            accent={C_GREEN}
          >
            {loading ? (
              <Skeleton />
            ) : (
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={
                      charts.products.length
                        ? charts.products
                        : [{ name: "No data", revenue: 0 }]
                    }
                    layout="vertical"
                    margin={{ top: 4, right: 12, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      horizontal={false}
                      stroke="#f0f0f0"
                    />
                    <XAxis
                      type="number"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#9ca3af", fontSize: 11 }}
                      tickFormatter={yFmt}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#374151", fontSize: 11, fontWeight: 600 }}
                      width={100}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar
                      dataKey="revenue"
                      fill={C_GREEN}
                      radius={[0, 5, 5, 0]}
                      maxBarSize={20}
                      animationDuration={800}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </ChartCard>

          <ChartCard
            title="Category Sales Distribution"
            subtitle="Revenue share by category"
            accent={C_ORANGE}
          >
            {loading ? (
              <Skeleton />
            ) : (
              <div className="chart-wrapper">
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
                      outerRadius={85}
                      paddingAngle={2}
                      dataKey="sales"
                      animationBegin={0}
                      animationDuration={800}
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
                            fontSize: 12,
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
          </ChartCard>
        </div>

        <div className="analytics-columns">
          <div className="analytics-card">
            <h3>Top Products</h3>
            <DataTable
              headers={["Product", "Sold", "Revenue"]}
              rows={(analytics.products || []).map((item) => [
                item.productName || "Unnamed",
                (item.totalSold || 0).toLocaleString(),
                currency.format(item.totalRevenue || 0),
              ])}
              emptyMsg="No product data."
            />
          </div>

          <div className="analytics-card">
            <h3>Category Performance</h3>
            <DataTable
              headers={["Category", "Qty", "Sales"]}
              rows={(analytics.categories || []).map((item) => [
                item.categoryName || "Unknown",
                (item.totalQuantity || 0).toLocaleString(),
                currency.format(item.totalSales || 0),
              ])}
              emptyMsg="No category data."
            />
          </div>
        </div>
      </Section>

      {/* ══════════════════════════════════════════════
          SECTION 4 — CUSTOMERS
      ══════════════════════════════════════════════ */}
      <Section>
        <SectionHeader
          icon="👥"
          title="Customer Insights"
          subtitle="User growth and top spenders"
          accent={C_BLUE}
        />

        <div
          className="analytics-grid"
          style={{
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          }}
        >
          <MiniStat
            label="Total Users"
            value={(analytics.users.totalUsers || 0).toLocaleString()}
            accent={C_BLUE}
          />
          <MiniStat
            label="New Users"
            value={(analytics.users.newUsers || 0).toLocaleString()}
            accent={C_BLUE}
          />
          <MiniStat
            label="Active Users"
            value={(analytics.users.activeUsersCount || 0).toLocaleString()}
            accent={C_TEAL}
          />
        </div>

        <div className="analytics-card">
          <h3>Top Spenders</h3>
          <DataTable
            headers={["Customer", "Orders", "Total Spent"]}
            rows={(analytics.users.topSpenders || []).map((item) => [
              item.userName || item.userEmail || "Unknown",
              (item.orderCount || 0).toLocaleString(),
              currency.format(item.totalSpent || 0),
            ])}
            emptyMsg="No spender data available."
          />
        </div>
      </Section>

      {/* ══════════════════════════════════════════════
          SECTION 5 — INVENTORY
      ══════════════════════════════════════════════ */}
      <Section>
        <SectionHeader
          icon="🏪"
          title="Inventory Status"
          subtitle="Stock levels, low stock alerts & category breakdown"
          accent={C_RED}
        />

        <div className="analytics-grid">
          <MiniStat
            label="Total Units"
            value={(
              analytics.inventory.summary?.totalUnits || 0
            ).toLocaleString()}
            accent={C_GREEN}
          />
          <MiniStat
            label="Inventory Value"
            value={currency.format(
              analytics.inventory.summary?.totalValue || 0,
            )}
            accent={C_GREEN}
          />
          <MiniStat
            label="Low Stock Items"
            value={(
              analytics.inventory.lowStockProducts?.length || 0
            ).toLocaleString()}
            accent={C_ORANGE}
          />
          <MiniStat
            label="Out of Stock"
            value={(
              analytics.inventory.outOfStockProducts?.length || 0
            ).toLocaleString()}
            accent={C_RED}
          />
        </div>

        <div className="analytics-columns">
          <ChartCard
            title="Stock by Category"
            subtitle="Total units per category"
            accent={C_GREEN}
          >
            {loading ? (
              <Skeleton />
            ) : (
              (() => {
                const data = (analytics.inventory.stockByCategory || []).map(
                  (c) => ({
                    name:
                      c.categoryName?.length > 14
                        ? c.categoryName.slice(0, 14) + "…"
                        : c.categoryName || "?",
                    stock: c.totalStock || 0,
                  }),
                );
                return (
                  <div className="chart-wrapper">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={data.length ? data : [{ name: "—", stock: 0 }]}
                        margin={{ top: 4, right: 8, left: -8, bottom: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#f0f0f0"
                        />
                        <XAxis
                          dataKey="name"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#9ca3af", fontSize: 11 }}
                          dy={6}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          width={40}
                          tick={{ fill: "#9ca3af", fontSize: 11 }}
                          tickFormatter={yFmtNum}
                        />
                        <Tooltip content={<ChartTooltip prefix="" />} />
                        <Bar
                          dataKey="stock"
                          fill={C_GREEN}
                          radius={[5, 5, 0, 0]}
                          maxBarSize={32}
                          animationDuration={800}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                );
              })()
            )}
          </ChartCard>

          <div className="analytics-card">
            <h3>
              Low Stock Products
              <span className="low-stock-badge">{"< 10 units"}</span>
            </h3>
            <DataTable
              headers={["Product", "Stock", "Price"]}
              rows={(analytics.inventory.lowStockProducts || []).map((item) => [
                item.name || "Unknown",
                <span
                  style={{
                    color: item.stockQuantity <= 3 ? C_RED : C_ORANGE,
                    fontWeight: 700,
                  }}
                >
                  {item.stockQuantity || 0}
                </span>,
                currency.format(item.price || 0),
              ])}
              emptyMsg="All products are well stocked."
            />
          </div>
        </div>
      </Section>

      {/* ══════════════════════════════════════════════
          SECTION 6 — PROMOTIONS
      ══════════════════════════════════════════════ */}
      <Section>
        <SectionHeader
          icon="🎁"
          title="Promotions"
          subtitle="Coupon usage and discount impact"
          accent={C_PURPLE}
        />

        <div
          className="analytics-grid"
          style={{
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          }}
        >
          <MiniStat
            label="Total Promos"
            value={analytics.promotions.totalPromos || 0}
            accent={C_PURPLE}
          />
          <MiniStat
            label="Active"
            value={analytics.promotions.activePromos || 0}
            accent={C_GREEN}
          />
          <MiniStat
            label="Inactive"
            value={analytics.promotions.inactivePromos || 0}
            accent="#9ca3af"
          />
        </div>

        <div className="analytics-columns">
          <ChartCard
            title="Promo Usage"
            subtitle="Times each code was applied"
            accent={C_PURPLE}
          >
            {loading ? (
              <Skeleton />
            ) : (
              (() => {
                const data = (analytics.promotions.performanceData || []).map(
                  (p) => ({
                    name: p.promoName || p.promoCode || "Unknown",
                    usage: p.usageCount || 0,
                  }),
                );
                return (
                  <div className="chart-wrapper">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={data.length ? data : [{ name: "—", usage: 0 }]}
                        margin={{ top: 4, right: 8, left: -8, bottom: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#f0f0f0"
                        />
                        <XAxis
                          dataKey="name"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#9ca3af", fontSize: 11 }}
                          dy={6}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          width={36}
                          tick={{ fill: "#9ca3af", fontSize: 11 }}
                          tickFormatter={yFmtNum}
                        />
                        <Tooltip content={<ChartTooltip prefix="" />} />
                        <Bar
                          dataKey="usage"
                          fill={C_PURPLE}
                          radius={[5, 5, 0, 0]}
                          maxBarSize={32}
                          animationDuration={800}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                );
              })()
            )}
          </ChartCard>

          <div className="analytics-card">
            <h3>Promotion Performance</h3>
            <DataTable
              headers={["Promo", "Usage", "Total Discount"]}
              rows={(analytics.promotions.performanceData || []).map((item) => [
                <span className="promo-code">
                  {item.promoName || item.promoCode || "—"}
                </span>,
                (item.usageCount || 0).toLocaleString(),
                currency.format(item.totalDiscountGiven || 0),
              ])}
              emptyMsg="No promotion data available."
            />
          </div>
        </div>
      </Section>
    </div>
  );
}

export default AnalyticsPage;
