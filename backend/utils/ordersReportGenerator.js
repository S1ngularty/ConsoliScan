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
  green: "#1A7A4A",
  grayLight: "#F4F6F8",
  gray: "#6B7280",
  border: "#E5E7EB",
  white: "#FFFFFF",
  blue: "#1D4ED8",
  orange: "#C2410C",
  red: "#B91C1C",
  teal: "#0D9488",
};

// ─────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────
const fmt = (n) => {
  // Handle null, undefined, or non-numeric values
  if (n === null || n === undefined) return "PHP 0.00";
  const num = typeof n === "number" ? n : parseFloat(n) || 0;
  return `PHP ${num.toFixed(2)}`;
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
    hour12: true,
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

function summaryRow(
  doc,
  y,
  label,
  value,
  labelColor = C.gray,
  valueColor = C.black,
  bold = false,
) {
  const font = bold ? "Helvetica-Bold" : "Helvetica";
  const size = bold ? 10 : 9;
  const valW = 100;
  const valX = RIGHT_EDGE - valW;
  const labW = CONTENT_W - valW - 10;

  doc
    .font(font)
    .fontSize(size)
    .fillColor(labelColor)
    .text(label, PAGE_MARGIN, y, { width: labW, lineBreak: false });

  doc
    .font(font)
    .fontSize(size)
    .fillColor(valueColor)
    .text(value, valX, y, { width: valW, align: "right", lineBreak: false });

  return y + (bold ? 16 : 14);
}

// ─────────────────────────────────────────────
//  Main Generator
// ─────────────────────────────────────────────
exports.generateOrdersReportPDF = async (req, res) => {
  try {
    const orderService = require("../services/orderService");
    const { orders, stats, filter } =
      await orderService.generateOrdersReport(req);

    if (!orders || orders.length === 0) {
      return res.status(404).json({ message: "No orders found" });
    }

    // ── PDF Setup ──────────────────────────────
    const doc = new PDFDocument({
      margin: PAGE_MARGIN,
      size: "A4",
      info: {
        Title: "Orders Report",
        Author: "Consoli Scan",
        Subject: "Orders Transaction Report",
        CreationDate: new Date(),
      },
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=orders-report-${new Date().getTime()}.pdf`,
    );
    res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
    doc.pipe(res);

    // ── HEADER ─────────────────────────────────
    let y = PAGE_MARGIN;

    doc
      .font("Helvetica-Bold")
      .fontSize(24)
      .fillColor(C.green)
      .text("CONSOLI SCAN", PAGE_MARGIN, y, {
        width: CONTENT_W,
        align: "center",
      });

    y += 32;

    doc
      .font("Helvetica-Bold")
      .fontSize(14)
      .fillColor(C.dark)
      .text("Sales Transaction Report", PAGE_MARGIN, y, {
        width: CONTENT_W,
        align: "center",
      });

    y += 18;

    doc
      .font("Helvetica")
      .fontSize(8.5)
      .fillColor(C.gray)
      .text(`Generated: ${fmtDateTime(new Date())}`, PAGE_MARGIN, y, {
        width: CONTENT_W,
        align: "center",
      });

    y += 16;
    rule(doc, y, C.green, 1.5);
    y += 16;

    // ── FILTER SUMMARY ─────────────────────────
    let filterText = "All Orders";
    if (filter.status || filter.customerType || filter.confirmedAt) {
      const parts = [];
      if (filter.status) parts.push(`Status: ${filter.status}`);
      if (filter.customerType) parts.push(`Customer: ${filter.customerType}`);
      if (filter.confirmedAt?.$gte)
        parts.push(`From: ${fmtDate(filter.confirmedAt.$gte)}`);
      if (filter.confirmedAt?.$lte)
        parts.push(`To: ${fmtDate(filter.confirmedAt.$lte)}`);
      filterText = parts.join(" | ");
    }

    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(C.gray)
      .text(filterText, PAGE_MARGIN, y);

    y += 14;

    // ── STATISTICS SECTION ─────────────────────
    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor(C.dark)
      .text("Report Summary", PAGE_MARGIN, y);

    y += 16;

    // 4-column stat grid
    const statW = CONTENT_W / 4 - 6;
    const statX = [
      PAGE_MARGIN,
      PAGE_MARGIN + statW + 8,
      PAGE_MARGIN + (statW + 8) * 2,
      PAGE_MARGIN + (statW + 8) * 3,
    ];

    // Helper to draw stat card
    const drawStatCard = (x, label, value, color = C.green) => {
      doc
        .save()
        .rect(x, y, statW, 52)
        .strokeColor(color)
        .lineWidth(1)
        .stroke()
        .restore();

      doc
        .font("Helvetica")
        .fontSize(7.5)
        .fillColor(C.gray)
        .text(label, x + 8, y + 6, { width: statW - 16, lineBreak: false });

      doc
        .font("Helvetica-Bold")
        .fontSize(10)
        .fillColor(color)
        .text(value, x + 8, y + 18, { width: statW - 16, lineBreak: false });
    };

    const totalRevenue = parseFloat(stats.totalRevenue) || 0;
    const totalDiscount = parseFloat(stats.totalDiscount) || 0;
    const avgOrderValue =
      stats.totalOrders > 0 ? totalRevenue / stats.totalOrders : 0;

    drawStatCard(
      statX[0],
      "Total Orders",
      stats.totalOrders.toString(),
      C.blue,
    );
    drawStatCard(statX[1], "Total Revenue", fmt(totalRevenue), C.green);
    drawStatCard(statX[2], "Avg Order Value", fmt(avgOrderValue), C.orange);
    drawStatCard(statX[3], "Total Discount", fmt(totalDiscount), C.red);

    y += 64;

    // ── ORDER TYPE DISTRIBUTION WITH CHART ─────
    if (Object.keys(stats.byCustomerType).length > 0) {
      rule(doc, y);
      y += 12;

      doc
        .font("Helvetica-Bold")
        .fontSize(9)
        .fillColor(C.dark)
        .text("Customer Type Distribution", PAGE_MARGIN, y);

      y += 14;

      // Visual bar chart
      const chartW = CONTENT_W;
      const barH = 20;
      const barSpacing = 8;

      Object.entries(stats.byCustomerType).forEach(([type, count]) => {
        const label = type.charAt(0).toUpperCase() + type.slice(1);
        const pct =
          stats.totalOrders > 0 ? (count / stats.totalOrders) * 100 : 0;
        const barW = (chartW * pct) / 100;

        // Bar background
        doc
          .save()
          .rect(PAGE_MARGIN + 80, y, chartW - 80, barH)
          .fillColor(C.grayLight)
          .fill()
          .restore();

        // Bar fill
        doc
          .save()
          .rect(PAGE_MARGIN + 80, y, Math.max(barW - 80, 0), barH)
          .fillColor(C.teal)
          .fill()
          .restore();

        // Label
        doc
          .font("Helvetica-Bold")
          .fontSize(8)
          .fillColor(C.dark)
          .text(label, PAGE_MARGIN, y + 6, { width: 75, lineBreak: false });

        // Value inside/outside bar
        const valueText = `${count} (${pct.toFixed(1)}%)`;
        doc
          .font("Helvetica")
          .fontSize(7.5)
          .fillColor(barW > 100 ? C.white : C.dark)
          .text(valueText, PAGE_MARGIN + 85, y + 6, {
            width: chartW - 90,
            lineBreak: false,
          });

        y += barH + barSpacing;
      });

      y += 4;
    }

    // ── ORDERS TABLE ───────────────────────────
    y += 8; // Extra spacing before table
    rule(doc, y);
    y += 14;

    doc
      .font("Helvetica-Bold")
      .fontSize(9)
      .fillColor(C.dark)
      .text(`Order Details (${orders.length} orders)`, PAGE_MARGIN, y);

    y += 14;
    rule(doc, y);
    y += 8;

    // Table headers
    const TABLE_ROW_H = 18;
    const COL_CODE = PAGE_MARGIN;
    const COL_CODE_W = 80;
    const COL_CUSTOMER = PAGE_MARGIN + COL_CODE_W + 6;
    const COL_CUSTOMER_W = 90;
    const COL_AMOUNT = PAGE_MARGIN + COL_CODE_W + COL_CUSTOMER_W + 12;
    const COL_AMOUNT_W = 60;
    const COL_DISCOUNT =
      PAGE_MARGIN + COL_CODE_W + COL_CUSTOMER_W + COL_AMOUNT_W + 18;
    const COL_DISCOUNT_W = 60;
    const COL_STATUS = RIGHT_EDGE - 50;
    const COL_STATUS_W = 50;

    doc.font("Helvetica-Bold").fontSize(7.5).fillColor(C.gray);

    doc.text("Receipt #", COL_CODE, y, {
      width: COL_CODE_W,
      lineBreak: false,
    });
    doc.text("Customer", COL_CUSTOMER, y, {
      width: COL_CUSTOMER_W,
      lineBreak: false,
    });
    doc.text("Amount", COL_AMOUNT, y, {
      width: COL_AMOUNT_W,
      align: "right",
      lineBreak: false,
    });
    doc.text("Discount", COL_DISCOUNT, y, {
      width: COL_DISCOUNT_W,
      align: "right",
      lineBreak: false,
    });
    doc.text("Status", COL_STATUS, y, {
      width: COL_STATUS_W,
      align: "right",
      lineBreak: false,
    });

    y += 10;
    rule(doc, y, C.grayLight);
    y += 8;

    // Table rows - fit as many as possible per page, auto-paginate
    const MAX_ROWS_PER_PAGE = 20;
    let rowCount = 0;

    orders.forEach((order, idx) => {
      // Check if need new page
      if (rowCount >= MAX_ROWS_PER_PAGE && y > 500) {
        doc.addPage();
        y = PAGE_MARGIN;
        rowCount = 0;

        // Repeat header on new page
        doc.font("Helvetica-Bold").fontSize(7.5).fillColor(C.gray);

        doc.text("Receipt #", COL_CODE, y, {
          width: COL_CODE_W,
          lineBreak: false,
        });
        doc.text("Customer", COL_CUSTOMER, y, {
          width: COL_CUSTOMER_W,
          lineBreak: false,
        });
        doc.text("Amount", COL_AMOUNT, y, {
          width: COL_AMOUNT_W,
          align: "right",
          lineBreak: false,
        });
        doc.text("Discount", COL_DISCOUNT, y, {
          width: COL_DISCOUNT_W,
          align: "right",
          lineBreak: false,
        });
        doc.text("Status", COL_STATUS, y, {
          width: COL_STATUS_W,
          align: "right",
          lineBreak: false,
        });

        y += 10;
        rule(doc, y, C.grayLight);
        y += 8;
      }

      // Alternating row background
      if (idx % 2 === 0) {
        doc
          .save()
          .rect(PAGE_MARGIN, y - 2, CONTENT_W, TABLE_ROW_H)
          .fillColor(C.grayLight)
          .fill()
          .restore();
      }

      const statusColors = {
        CONFIRMED: C.green,
        CANCELLED: C.red,
        REFUNDED: C.orange,
      };

      // Row content
      doc.font("Helvetica").fontSize(8).fillColor(C.black);

      // Receipt code - truncate if too long
      const code = order.checkoutCode.substring(0, 14);
      doc.text(code, COL_CODE, y, {
        width: COL_CODE_W,
        lineBreak: false,
      });

      // Customer name
      const custName = (order.user?.name || "Guest").substring(0, 20);
      doc.text(custName, COL_CUSTOMER, y, {
        width: COL_CUSTOMER_W,
        lineBreak: false,
      });

      // Amount
      const orderAmount = parseFloat(order.finalAmountPaid) || 0;
      doc.text(fmt(orderAmount), COL_AMOUNT, y, {
        width: COL_AMOUNT_W,
        align: "right",
        lineBreak: false,
      });

      // Discount
      const orderDiscount = parseFloat(order.discountBreakdown?.total) || 0;
      doc.text(fmt(orderDiscount), COL_DISCOUNT, y, {
        width: COL_DISCOUNT_W,
        align: "right",
        lineBreak: false,
      });

      // Status
      doc
        .font("Helvetica-Bold")
        .fontSize(7)
        .fillColor(statusColors[order.status] || C.gray);

      doc.text(order.status || "UNKNOWN", COL_STATUS, y, {
        width: COL_STATUS_W,
        align: "right",
        lineBreak: false,
      });

      y += TABLE_ROW_H;
      rowCount++;
    });

    y += 12; // Spacing after table
    rule(doc, y);
    y += 16;

    // ── TOTAL SUMMARY ──────────────────────────
    y = summaryRow(
      doc,
      y,
      "Subtotal (Before Discounts)",
      fmt(totalRevenue + totalDiscount),
    );

    y = summaryRow(
      doc,
      y,
      "Total Discounts Applied",
      `-${fmt(totalDiscount)}`,
      C.black,
      C.red,
    );

    y += 4;
    rule(doc, y, C.dark, 1);
    y += 12;

    doc
      .font("Helvetica-Bold")
      .fontSize(12)
      .fillColor(C.green)
      .text("TOTAL REVENUE", PAGE_MARGIN, y);

    const revW = 90;
    const revX = RIGHT_EDGE - revW;
    doc
      .font("Helvetica-Bold")
      .fontSize(14)
      .fillColor(C.green)
      .text(fmt(totalRevenue), revX, y - 2, {
        width: revW,
        align: "right",
        lineBreak: false,
      });

    y += 30;

    // ── FOOTER (SAME PAGE) ─────────────────────
    // Only add new page if we're near the bottom
    if (y > 700) {
      doc.addPage();
      y = PAGE_MARGIN + 200; // Center it vertically
    }

    y += 20;
    rule(doc, y, C.green, 1);
    y += 16;

    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(C.gray)
      .text(
        "This report contains a summary of all sales transactions for the selected period. For detailed audit trails, please refer to activity logs.",
        PAGE_MARGIN,
        y,
        { width: CONTENT_W, align: "center" },
      );

    y += 24;

    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor(C.green)
      .text("Consoli Scan", PAGE_MARGIN, y, {
        width: CONTENT_W,
        align: "center",
      });

    y += 14;

    doc
      .font("Helvetica")
      .fontSize(7)
      .fillColor(C.gray)
      .text(
        "System-generated report. Valid for audit and record-keeping purposes.",
        PAGE_MARGIN,
        y,
        { width: CONTENT_W, align: "center" },
      );

    doc.end();
  } catch (err) {
    console.error("Orders report generation error:", err);
    res.status(500).json({
      message: "Failed to generate report",
      error: err.message,
    });
  }
};
