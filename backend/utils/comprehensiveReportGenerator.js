const PDFDocument = require("pdfkit");

// ─────────────────────────────────────────────
//  Constants
// ─────────────────────────────────────────────
const PAGE_MARGIN = 50;
const PAGE_WIDTH = 595.28; // A4
const CONTENT_W = PAGE_WIDTH - PAGE_MARGIN * 2;
const RIGHT_EDGE = PAGE_WIDTH - PAGE_MARGIN;

const C = {
  black: "#0A0A0A",
  dark: "#1A1A2E",
  green: "#5C6F2B",
  orange: "#DE802B",
  teal: "#2B7F6F",
  red: "#DC4F4F",
  blue: "#3B7DD8",
  purple: "#9B6FDB",
  grayLight: "#F4F6F8",
  gray: "#6B7280",
  border: "#E5E7EB",
  white: "#FFFFFF",
};

// ─────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────
const fmt = (n) => {
  if (n === null || n === undefined) return "PHP 0.00";
  const num = typeof n === "number" ? n : parseFloat(n) || 0;
  return `PHP ${num.toFixed(2)}`;
};

const fmtNum = (n) => {
  if (n === null || n === undefined) return "0";
  const num = typeof n === "number" ? n : parseFloat(n) || 0;
  return num.toLocaleString("en-PH");
};

const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

const fmtDateTime = (d) =>
  new Date(d).toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

function rule(doc, y, color = C.border, weight = 0.5) {
  doc
    .save()
    .strokeColor(color)
    .lineWidth(weight)
    .moveTo(PAGE_MARGIN, y)
    .lineTo(RIGHT_EDGE, y)
    .stroke()
    .restore();
}

function sectionHeader(doc, y, text, color = C.green) {
  doc
    .font("Helvetica-Bold")
    .fontSize(14)
    .fillColor(color)
    .text(text, PAGE_MARGIN, y);

  y += 18;
  rule(doc, y, color, 1.5);
  return y + 12;
}

function summaryRow(doc, y, label, value, labelW = 140) {
  const valW = 100;
  const valX = RIGHT_EDGE - valW;
  const labW = labelW;

  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor(C.gray)
    .text(label, PAGE_MARGIN, y, { width: labW, lineBreak: false });

  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .fillColor(C.black)
    .text(value, valX, y, { width: valW, align: "right", lineBreak: false });

  return y + 14;
}

// ─────────────────────────────────────────────
//  Main Generator
// ─────────────────────────────────────────────
exports.generateComprehensiveReportPDF = async (req, res) => {
  try {
    const adminDashboardService = require("../services/adminDashboardService");
    const timeRange = req.query.timeRange || "30";

    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - parseInt(timeRange, 10));
    const sd = start.toISOString().split("T")[0];
    const ed = end.toISOString().split("T")[0];

    // Fetch all report data
    const [
      sales,
      products,
      categories,
      users,
      orders,
      inventory,
      promos,
      returns,
    ] = await Promise.all([
      adminDashboardService.getSalesAnalytics({
        startDate: sd,
        endDate: ed,
        groupBy: "day",
      }),
      adminDashboardService.getProductAnalytics({
        limit: 10,
        sortBy: "revenue",
        startDate: sd,
        endDate: ed,
      }),
      adminDashboardService.getCategoryAnalytics({
        startDate: sd,
        endDate: ed,
      }),
      adminDashboardService.getUserAnalytics({ startDate: sd, endDate: ed }),
      adminDashboardService.getOrderAnalytics({ startDate: sd, endDate: ed }),
      adminDashboardService.getInventoryAnalytics(),
      adminDashboardService.getPromotionAnalytics({
        startDate: sd,
        endDate: ed,
      }),
      adminDashboardService.getReturnAnalytics({ startDate: sd, endDate: ed }),
    ]);

    // ── PDF Setup ──────────────────────────────
    const doc = new PDFDocument({
      margin: PAGE_MARGIN,
      size: "A4",
      info: {
        Title: "Comprehensive Business Report",
        Author: "Consoli Scan",
        Subject: "Dashboard Report",
        CreationDate: new Date(),
      },
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=report-${new Date().getTime()}.pdf`,
    );
    res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
    doc.pipe(res);

    // ── HEADER ─────────────────────────────────
    let y = PAGE_MARGIN;

    doc
      .font("Helvetica-Bold")
      .fontSize(26)
      .fillColor(C.green)
      .text("CONSOLI SCAN", PAGE_MARGIN, y, {
        width: CONTENT_W,
        align: "center",
      });

    y += 32;

    doc
      .font("Helvetica-Bold")
      .fontSize(16)
      .fillColor(C.dark)
      .text("Comprehensive Business Report", PAGE_MARGIN, y, {
        width: CONTENT_W,
        align: "center",
      });

    y += 20;

    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor(C.gray)
      .text(
        `Period: ${fmtDate(start)} to ${fmtDate(end)} | Generated: ${fmtDateTime(new Date())}`,
        PAGE_MARGIN,
        y,
        { width: CONTENT_W, align: "center" },
      );

    y += 18;
    rule(doc, y, C.green, 2);
    y += 20;

    // ── EXECUTIVE SUMMARY ──────────────────────
    const totalRevenue = parseFloat(sales.summary?.totalSales) || 0;
    const totalOrders = sales.summary?.totalOrders || 0;
    const avgOrderValue = parseFloat(sales.summary?.averageOrderValue) || 0;

    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .fillColor(C.dark)
      .text("Executive Summary", PAGE_MARGIN, y);

    y += 14;

    const summaryW = CONTENT_W / 3 - 6;
    const summaryX = [
      PAGE_MARGIN,
      PAGE_MARGIN + summaryW + 10,
      PAGE_MARGIN + (summaryW + 10) * 2,
    ];

    [
      { label: "Total Revenue", value: fmt(totalRevenue), color: C.green },
      { label: "Total Orders", value: fmtNum(totalOrders), color: C.blue },
      { label: "Avg Order Value", value: fmt(avgOrderValue), color: C.teal },
    ].forEach((item, idx) => {
      doc
        .save()
        .rect(summaryX[idx], y, summaryW, 48)
        .strokeColor(item.color)
        .lineWidth(2)
        .stroke()
        .restore();

      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor(C.gray)
        .text(item.label, summaryX[idx] + 8, y + 6, { width: summaryW - 16 });

      doc
        .font("Helvetica-Bold")
        .fontSize(11)
        .fillColor(item.color)
        .text(item.value, summaryX[idx] + 8, y + 18, { width: summaryW - 16 });
    });

    y += 62;

    // ── SALES SECTION ──────────────────────────
    y = sectionHeader(doc, y, "Sales Performance", C.green);

    y = summaryRow(doc, y, "Total Sales", fmt(totalRevenue));
    y = summaryRow(
      doc,
      y,
      "Gross Sales",
      fmt(
        totalRevenue +
          (parseFloat(orders.statusBreakdown?.[0]?.totalRevenue) || 0),
      ),
    );
    y = summaryRow(doc, y, "Number of Orders", fmtNum(totalOrders));
    y = summaryRow(doc, y, "Avg Order Value", fmt(avgOrderValue));
    y = summaryRow(doc, y, "Active Users", fmtNum(users.activeUsersCount || 0));

    y += 12;

    // Recent sales table
    doc
      .font("Helvetica-Bold")
      .fontSize(8.5)
      .fillColor(C.dark)
      .text("Daily Sales Summary (Top 10 Days)", PAGE_MARGIN, y);

    y += 10;
    rule(doc, y, C.grayLight);
    y += 6;

    const topDays = (sales.data || [])
      .sort((a, b) => (b.totalSales || 0) - (a.totalSales || 0))
      .slice(0, 10);

    topDays.forEach((day, idx) => {
      if (idx % 2 === 0) {
        doc
          .save()
          .rect(PAGE_MARGIN, y - 2, CONTENT_W, 14)
          .fillColor(C.grayLight)
          .fill()
          .restore();
      }

      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor(C.black)
        .text(fmtDate(day._id?.date || day.date || "—"), PAGE_MARGIN + 4, y, {
          width: 100,
          lineBreak: false,
        })
        .text(fmtNum(day.orderCount || 0), PAGE_MARGIN + 110, y, {
          width: 60,
          align: "right",
          lineBreak: false,
        })
        .text(fmt(day.totalSales || 0), PAGE_MARGIN + 180, y, {
          width: 90,
          align: "right",
          lineBreak: false,
        })
        .text(
          fmt((day.totalSales || 0) / Math.max(day.orderCount || 1, 1)),
          RIGHT_EDGE - 90,
          y,
          { width: 90, align: "right", lineBreak: false },
        );

      y += 14;
    });

    y += 8;

    // ── PRODUCTS SECTION ───────────────────────
    if (y > 650) {
      doc.addPage();
      y = PAGE_MARGIN;
    }

    y = sectionHeader(doc, y, "Top Products", C.orange);

    const topProds = (products.data || []).slice(0, 8);
    topProds.forEach((prod, idx) => {
      if (idx % 2 === 0) {
        doc
          .save()
          .rect(PAGE_MARGIN, y - 2, CONTENT_W, 16)
          .fillColor(C.grayLight)
          .fill()
          .restore();
      }

      const prodName = (prod.productName || "Unknown").substring(0, 35);
      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor(C.black)
        .text(`${idx + 1}. ${prodName}`, PAGE_MARGIN + 4, y, {
          width: 180,
          lineBreak: false,
        })
        .text(fmtNum(prod.totalSold || 0), PAGE_MARGIN + 200, y, {
          width: 50,
          align: "right",
          lineBreak: false,
        })
        .text(fmt(prod.totalRevenue || 0), RIGHT_EDGE - 90, y, {
          width: 90,
          align: "right",
          lineBreak: false,
        });

      y += 16;
    });

    y += 8;

    // ── CATEGORIES SECTION ─────────────────────
    y = sectionHeader(doc, y, "Revenue by Category", C.teal);

    const topCats = (categories || []).slice(0, 6);
    topCats.forEach((cat, idx) => {
      if (idx % 2 === 0) {
        doc
          .save()
          .rect(PAGE_MARGIN, y - 2, CONTENT_W, 16)
          .fillColor(C.grayLight)
          .fill()
          .restore();
      }

      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor(C.black)
        .text(cat.categoryName || "Unknown", PAGE_MARGIN + 4, y, {
          width: 180,
          lineBreak: false,
        })
        .text(fmtNum(cat.totalQuantity || 0), PAGE_MARGIN + 200, y, {
          width: 50,
          align: "right",
          lineBreak: false,
        })
        .text(fmt(cat.totalSales || 0), RIGHT_EDGE - 90, y, {
          width: 90,
          align: "right",
          lineBreak: false,
        });

      y += 16;
    });

    y += 12;

    // ── ORDERS SECTION ─────────────────────────
    if (y > 650) {
      doc.addPage();
      y = PAGE_MARGIN;
    }

    y = sectionHeader(doc, y, "Order Analytics", C.blue);

    y = summaryRow(doc, y, "Total Orders", fmtNum(totalOrders));

    const statusBreakdown = orders.statusBreakdown || [];
    statusBreakdown.forEach((status) => {
      y = summaryRow(
        doc,
        y,
        `Orders (${status._id || "Unknown"})`,
        fmtNum(status.count || 0),
      );
    });

    y += 12;

    // ── USERS SECTION ──────────────────────────
    y = sectionHeader(doc, y, "Customer Insights", C.blue);

    y = summaryRow(doc, y, "Total Users", fmtNum(users.totalUsers || 0));
    y = summaryRow(doc, y, "New Users", fmtNum(users.newUsers || 0));
    y = summaryRow(doc, y, "Active Users", fmtNum(users.activeUsersCount || 0));

    const topSpenders = (users.topSpenders || []).slice(0, 5);
    if (topSpenders.length > 0) {
      y += 12;
      doc
        .font("Helvetica-Bold")
        .fontSize(9)
        .fillColor(C.dark)
        .text("Top Spenders", PAGE_MARGIN, y);
      y += 10;

      topSpenders.forEach((spender, idx) => {
        if (idx % 2 === 0) {
          doc
            .save()
            .rect(PAGE_MARGIN, y - 2, CONTENT_W, 14)
            .fillColor(C.grayLight)
            .fill()
            .restore();
        }

        doc
          .font("Helvetica")
          .fontSize(7.5)
          .fillColor(C.black)
          .text(spender.userName || "Unknown", PAGE_MARGIN + 4, y, {
            width: 140,
            lineBreak: false,
          })
          .text(fmtNum(spender.orderCount || 0), PAGE_MARGIN + 160, y, {
            width: 60,
            align: "right",
            lineBreak: false,
          })
          .text(fmt(spender.totalSpent || 0), RIGHT_EDGE - 90, y, {
            width: 90,
            align: "right",
            lineBreak: false,
          });

        y += 14;
      });
    }

    y += 12;

    // ── INVENTORY SECTION ──────────────────────
    if (y > 650) {
      doc.addPage();
      y = PAGE_MARGIN;
    }

    y = sectionHeader(doc, y, "Inventory Status", C.red);

    const invSummary = inventory.summary || {};
    y = summaryRow(doc, y, "Total Units", fmtNum(invSummary.totalUnits || 0));
    y = summaryRow(doc, y, "Inventory Value", fmt(invSummary.totalValue || 0));
    y = summaryRow(
      doc,
      y,
      "Low Stock Items",
      fmtNum(inventory.lowStockProducts?.length || 0),
    );
    y = summaryRow(
      doc,
      y,
      "Out of Stock",
      fmtNum(inventory.outOfStockProducts?.length || 0),
    );

    y += 12;

    // ── PROMOTIONS SECTION ─────────────────────
    y = sectionHeader(doc, y, "Promotion Performance", C.orange);

    y = summaryRow(doc, y, "Total Promos", fmtNum(promos.totalPromos || 0));
    y = summaryRow(doc, y, "Active Promos", fmtNum(promos.activePromos || 0));

    const topPromos = (promos.performanceData || []).slice(0, 5);
    if (topPromos.length > 0) {
      y += 12;
      doc
        .font("Helvetica-Bold")
        .fontSize(9)
        .fillColor(C.dark)
        .text("Most Used Promotions", PAGE_MARGIN, y);
      y += 10;

      topPromos.forEach((promo, idx) => {
        if (idx % 2 === 0) {
          doc
            .save()
            .rect(PAGE_MARGIN, y - 2, CONTENT_W, 14)
            .fillColor(C.grayLight)
            .fill()
            .restore();
        }

        const code = (promo.promoCode || "Unknown").substring(0, 20);
        doc
          .font("Helvetica")
          .fontSize(7.5)
          .fillColor(C.black)
          .text(code, PAGE_MARGIN + 4, y, { width: 80, lineBreak: false })
          .text(fmtNum(promo.usageCount || 0), PAGE_MARGIN + 100, y, {
            width: 60,
            align: "right",
            lineBreak: false,
          })
          .text(fmt(promo.totalDiscountGiven || 0), RIGHT_EDGE - 90, y, {
            width: 90,
            align: "right",
            lineBreak: false,
          });

        y += 14;
      });
    }

    y += 12;

    // ── RETURNS SECTION ────────────────────────
    if (y > 650) {
      doc.addPage();
      y = PAGE_MARGIN;
    }

    y = sectionHeader(doc, y, "Returns Analysis", C.red);

    const returnsSummary = returns.summary || {};
    y = summaryRow(
      doc,
      y,
      "Total Returns",
      fmtNum(returnsSummary.totalReturns || 0),
    );
    y = summaryRow(
      doc,
      y,
      "Completed",
      fmtNum(returnsSummary.completedReturns || 0),
    );
    y = summaryRow(
      doc,
      y,
      "Rejected",
      fmtNum(returnsSummary.rejectedReturns || 0),
    );
    y = summaryRow(
      doc,
      y,
      "Pending",
      fmtNum(returnsSummary.pendingReturns || 0),
    );
    y = summaryRow(
      doc,
      y,
      "Returned Value",
      fmt(returnsSummary.totalReturnedValue || 0),
    );

    const completionRate = returnsSummary.completionRate || 0;
    y = summaryRow(doc, y, "Completion Rate", `${completionRate.toFixed(1)}%`);

    y += 20;

    // ── FOOTER ─────────────────────────────────
    doc.addPage();
    let footerY = PAGE_MARGIN;

    rule(doc, footerY, C.green, 1.5);
    footerY += 16;

    doc
      .font("Helvetica-Bold")
      .fontSize(12)
      .fillColor(C.green)
      .text("Report Summary", PAGE_MARGIN, footerY);

    footerY += 16;

    doc
      .font("Helvetica")
      .fontSize(8.5)
      .fillColor(C.gray)
      .text(
        "This comprehensive report provides a complete overview of all business operations during the selected period. Data includes sales performance, product analytics, customer insights, inventory status, promotion effectiveness, and return metrics.",
        PAGE_MARGIN,
        footerY,
        { width: CONTENT_W, align: "left" },
      );

    footerY += 50;

    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(C.gray)
      .text(
        `Report Period: ${parseInt(timeRange, 10)} days`,
        PAGE_MARGIN,
        footerY,
      );

    footerY += 12;

    doc.text(`Generated: ${fmtDateTime(new Date())}`, PAGE_MARGIN, footerY);

    footerY += 12;

    doc.text(
      "System generated report. For detailed analysis and queries, contact your administrator.",
      PAGE_MARGIN,
      footerY,
    );

    footerY += 20;
    rule(doc, footerY, C.green, 1);
    footerY += 16;

    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .fillColor(C.green)
      .text("Consoli Scan", PAGE_MARGIN, footerY, {
        width: CONTENT_W,
        align: "center",
      });

    doc.end();
  } catch (err) {
    console.error("Comprehensive report generation error:", err);
    res.status(500).json({
      message: "Failed to generate report",
      error: err.message,
    });
  }
};
