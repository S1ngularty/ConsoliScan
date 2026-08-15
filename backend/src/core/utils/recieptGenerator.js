const Order = require("../models/orderModel");
const User = require("../models/userModel");
const PDFDocument = require("pdfkit");

// ─────────────────────────────────────────────
//  Constants
// ─────────────────────────────────────────────
const PAGE_MARGIN = 56;
const PAGE_WIDTH = 595.28; // A4
const CONTENT_W = PAGE_WIDTH - PAGE_MARGIN * 2; // 483.28
const RIGHT_EDGE = PAGE_WIDTH - PAGE_MARGIN; // 539.28

const C = {
  black: "#0A0A0A",
  dark: "#1A1A2E",
  green: "#1A7A4A",
  grayLight: "#F4F6F8",
  gray: "#6B7280",
  border: "#E5E7EB",
  white: "#FFFFFF",
  gold: "#B45309",
  blue: "#1D4ED8",
  purple: "#6D28D9",
  red: "#B91C1C",
  orange: "#C2410C",
};

// ─────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────
const fmt = (n) => `PHP ${(n || 0).toFixed(2)}`;

// Short, non-wrapping date: "Feb 15, 2026, 02:30 PM"
const fmtDate = (d) =>
  new Date(d).toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

// Full-width hairline rule
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

// Stacked label (gray, small) + value (bold, larger) — width-capped to prevent overflow
function labelValue(doc, x, y, label, value, w = 200) {
  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor(C.gray)
    .text(label, x, y, { width: w, lineBreak: false });

  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .fillColor(C.black)
    .text(value, x, y + 13, { width: w, lineBreak: false });
}

// Right-aligned summary row (label left, value right), returns next y
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
  const size = bold ? 10 : 9.5;
  const valW = 110;
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

  return y + (bold ? 18 : 16);
}

// ─────────────────────────────────────────────
//  Controller
// ─────────────────────────────────────────────
exports.generateReceipt = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId)
      .populate("user", "name email loyaltyPoints")
      .populate("cashier", "name");

    if (!order) return res.status(404).json({ message: "Order not found" });

    // ── PDF setup ──────────────────────────────
    const doc = new PDFDocument({
      margin: PAGE_MARGIN,
      size: "A4",
      info: {
        Title: `Receipt-${order.checkoutCode}`,
        Author: "Consoli Scan",
        Subject: "Official Receipt",
        CreationDate: new Date(),
      },
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=receipt-${order.checkoutCode}.pdf`,
    );
    res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
    doc.pipe(res);

    // ── HEADER ─────────────────────────────────
    let y = PAGE_MARGIN;

    doc
      .font("Helvetica-Bold")
      .fontSize(22)
      .fillColor(C.green)
      .text("CONSOLI SCAN", PAGE_MARGIN, y, {
        width: CONTENT_W,
        align: "center",
      });

    y += 30;

    doc
      .font("Helvetica")
      .fontSize(8.5)
      .fillColor(C.gray)
      .text("Official Receipt", PAGE_MARGIN, y, {
        width: CONTENT_W,
        align: "center",
      });

    y += 22;
    rule(doc, y, C.green, 1.5);
    y += 20;

    // ── RECEIPT META (2-row, 2-column grid) ─────
    //  Left col: 240px wide   |   Right col: remainder
    const META_LEFT = PAGE_MARGIN;
    const META_RIGHT = PAGE_MARGIN + 248;
    const META_LEFT_W = 230;
    const META_RIGHT_W = CONTENT_W - 248;

    // Row 1: Receipt No.  |  Date
    labelValue(
      doc,
      META_LEFT,
      y,
      "RECEIPT NO.",
      order.checkoutCode,
      META_LEFT_W,
    );
    labelValue(
      doc,
      META_RIGHT,
      y,
      "DATE",
      fmtDate(order.confirmedAt),
      META_RIGHT_W,
    );
    y += 40;

    // Row 2: Cashier  |  Customer
    labelValue(
      doc,
      META_LEFT,
      y,
      "CASHIER",
      order.cashier?.name || "N/A",
      META_LEFT_W,
    );
    labelValue(
      doc,
      META_RIGHT,
      y,
      "CUSTOMER",
      order.user?.name || "Guest Customer",
      META_RIGHT_W,
    );
    y += 40;

    // Customer type badge (senior / pwd) — under customer name
    if (order.customerType !== "regular") {
      const tagColor = order.customerType === "senior" ? C.blue : C.purple;
      const tagLabel = `${order.customerType.toUpperCase()} ${order.verificationSource === "system" ? "(App)" : "(Manual)"}`;
      const tagW = 110;

      doc
        .save()
        .rect(META_RIGHT, y, tagW, 16)
        .fillColor(tagColor)
        .fill()
        .restore();

      doc
        .font("Helvetica-Bold")
        .fontSize(7)
        .fillColor(C.white)
        .text(tagLabel, META_RIGHT, y + 4, {
          width: tagW,
          align: "center",
          lineBreak: false,
        });

      y += 24;
    }

    y += 4;
    rule(doc, y);
    y += 20;

    // ── ITEMS TABLE ─────────────────────────────
    //  Column x positions (all within PAGE_MARGIN … RIGHT_EDGE)
    //  ITEM:       56  … 56+240 = 296
    //  QTY:        right-aligned in 302…350
    //  UNIT PRICE: right-aligned in 352…440
    //  AMOUNT:     right-aligned in 442…539.28  (valW = 97)
    const COL_ITEM = PAGE_MARGIN;
    const COL_QTY_X = 302;
    const COL_QTY_W = 48;
    const COL_UP_X = 352;
    const COL_UP_W = 88;
    const COL_AMT_X = 442;
    const COL_AMT_W = RIGHT_EDGE - 442; // ~97

    doc
      .font("Helvetica-Bold")
      .fontSize(8)
      .fillColor(C.gray)
      .text("ITEM", COL_ITEM, y)
      .text("QTY", COL_QTY_X, y, { width: COL_QTY_W, align: "right" })
      .text("UNIT PRICE", COL_UP_X, y, { width: COL_UP_W, align: "right" })
      .text("AMOUNT", COL_AMT_X, y, { width: COL_AMT_W, align: "right" });

    y += 11;
    rule(doc, y);
    y += 10;

    const ROW_H = 22;

    order.items.forEach((item, i) => {
      // Alternating stripe
      if (i % 2 === 0) {
        doc
          .save()
          .rect(PAGE_MARGIN, y - 2, CONTENT_W, ROW_H)
          .fillColor(C.grayLight)
          .fill()
          .restore();
      }

      const nameMax = 38;
      const name =
        item.name.length > nameMax
          ? item.name.substring(0, nameMax) + "…"
          : item.name;

      // Item name — capped to 240px so it never bleeds into QTY column
      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor(C.black)
        .text(name, COL_ITEM + 2, y + 4, { width: 240, lineBreak: false });

      // BNPC badge right after name on the same line (offset by measured name width)
      if (item.isBNPCEligible) {
        const nameW = Math.min(
          doc.widthOfString(name, { fontSize: 9 }) + 8,
          228,
        );
        const bx = COL_ITEM + 2 + nameW;

        doc
          .save()
          .rect(bx, y + 4, 28, 10)
          .fillColor(C.green)
          .fill()
          .restore();
        doc
          .font("Helvetica-Bold")
          .fontSize(6)
          .fillColor(C.white)
          .text("BNPC", bx + 2, y + 6, { width: 24, lineBreak: false });
      }

      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor(C.black)
        .text(item.quantity.toString(), COL_QTY_X, y + 4, {
          width: COL_QTY_W,
          align: "right",
          lineBreak: false,
        })
        .text(fmt(item.unitPrice), COL_UP_X, y + 4, {
          width: COL_UP_W,
          align: "right",
          lineBreak: false,
        })
        .text(fmt(item.unitPrice * item.quantity), COL_AMT_X, y + 4, {
          width: COL_AMT_W,
          align: "right",
          lineBreak: false,
        });

      y += ROW_H;
    });

    y += 6;
    rule(doc, y);
    y += 20;

    // ── DISCOUNTS ──────────────────────────────
    if (order.discountBreakdown.total > 0) {
      doc
        .font("Helvetica-Bold")
        .fontSize(8)
        .fillColor(C.gray)
        .text("DISCOUNTS", PAGE_MARGIN, y);
      y += 14;

      if (order.discountBreakdown.bnpc > 0) {
        y = summaryRow(
          doc,
          y,
          "BNPC Discount (5%)",
          `-${fmt(order.discountBreakdown.bnpc)}`,
          C.black,
          C.green,
        );
      }
      if (order.discountBreakdown.promo > 0) {
        const promoLabel = `Promo${order.promoDiscount?.code ? " · " + order.promoDiscount.code : ""}`;
        y = summaryRow(
          doc,
          y,
          promoLabel,
          `-${fmt(order.discountBreakdown.promo)}`,
          C.black,
          C.orange,
        );
      }
      if (order.discountBreakdown.loyalty > 0) {
        y = summaryRow(
          doc,
          y,
          "Loyalty Points",
          `-${fmt(order.discountBreakdown.loyalty)}`,
          C.black,
          C.gold,
        );
      }

      y += 4;
      rule(doc, y);
      y += 20;
    }

    // ── TOTALS ─────────────────────────────────
    y = summaryRow(doc, y, "Subtotal", fmt(order.baseAmount));

    if (order.bnpcEligibleSubtotal > 0) {
      y = summaryRow(
        doc,
        y,
        "BNPC Eligible Subtotal",
        fmt(order.bnpcEligibleSubtotal),
        C.gray,
        C.gray,
      );
    }
    if (order.discountBreakdown.total > 0) {
      y = summaryRow(
        doc,
        y,
        "Total Discounts",
        `-${fmt(order.discountBreakdown.total)}`,
        C.black,
        C.green,
      );
    }

    y += 6;
    rule(doc, y, C.dark, 1);
    y += 12;

    // Grand total row
    doc
      .font("Helvetica-Bold")
      .fontSize(13)
      .fillColor(C.dark)
      .text("TOTAL", PAGE_MARGIN, y);

    const totValW = 120;
    const totValX = RIGHT_EDGE - totValW;
    doc
      .font("Helvetica-Bold")
      .fontSize(16)
      .fillColor(C.green)
      .text(fmt(order.finalAmountPaid), totValX, y - 2, {
        width: totValW,
        align: "right",
        lineBreak: false,
      });

    y += 30;
    rule(doc, y);
    y += 20;

    // ── PAYMENT ────────────────────────────────
    doc
      .font("Helvetica-Bold")
      .fontSize(8)
      .fillColor(C.gray)
      .text("PAYMENT", PAGE_MARGIN, y);
    y += 14;

    y = summaryRow(doc, y, "Method", "Cash");

    y += 8;
    rule(doc, y);
    y += 20;

    // ── LOYALTY POINTS ─────────────────────────
    const hasLoyalty =
      order.loyaltyDiscount.pointsEarned > 0 ||
      order.loyaltyDiscount.pointsUsed > 0;

    if (hasLoyalty) {
      doc
        .font("Helvetica-Bold")
        .fontSize(8)
        .fillColor(C.gray)
        .text("LOYALTY POINTS", PAGE_MARGIN, y);
      y += 14;

      if (order.loyaltyDiscount.pointsUsed > 0) {
        y = summaryRow(
          doc,
          y,
          `Redeemed (${order.loyaltyDiscount.pointsUsed} pts)`,
          `-${fmt(order.loyaltyDiscount.amount)}`,
          C.black,
          C.red,
        );
      }
      if (order.loyaltyDiscount.pointsEarned > 0) {
        y = summaryRow(
          doc,
          y,
          "Points Earned",
          `+${order.loyaltyDiscount.pointsEarned} pts`,
          C.black,
          C.green,
        );
      }

      y += 8;
      rule(doc, y);
      y += 20;
    }

    // ── BNPC WEEKLY TRACKING ───────────────────
    if (order.hasBNPCItems && order.bnpcCaps) {
      doc
        .font("Helvetica-Bold")
        .fontSize(8)
        .fillColor(C.gray)
        .text("BNPC WEEKLY TRACKING", PAGE_MARGIN, y);
      y += 14;

      const remDiscount = 125 - order.bnpcCaps.discountCap.usedAfter;
      const remPurchase = 2500 - order.bnpcCaps.purchaseCap.usedAfter;

      y = summaryRow(
        doc,
        y,
        "Discount Used / Cap",
        `${fmt(order.bnpcCaps.discountCap.usedAfter)} / PHP 125.00`,
        C.black,
        remDiscount > 0 ? C.green : C.red,
      );
      y = summaryRow(
        doc,
        y,
        "Remaining Discount",
        fmt(remDiscount),
        C.gray,
        remDiscount > 0 ? C.green : C.red,
      );
      y = summaryRow(
        doc,
        y,
        "Purchase Used / Cap",
        `${fmt(order.bnpcCaps.purchaseCap.usedAfter)} / PHP 2,500.00`,
        C.black,
        remPurchase > 0 ? C.green : C.red,
      );
      y = summaryRow(
        doc,
        y,
        "Remaining Purchase",
        fmt(remPurchase),
        C.gray,
        remPurchase > 0 ? C.green : C.red,
      );

      if (order.bookletUpdated) {
        y += 4;
        doc
          .font("Helvetica")
          .fontSize(8)
          .fillColor(C.green)
          .text(
            `Booklet updated: ${fmt(order.bnpcCaps.discountCap.usedBefore)} -> ${fmt(order.bnpcCaps.discountCap.usedAfter)}`,
            PAGE_MARGIN,
            y,
          );
        y += 14;
      }

      if (order.bnpcCaps.weekStart && order.bnpcCaps.weekEnd) {
        doc
          .font("Helvetica")
          .fontSize(7.5)
          .fillColor(C.gray)
          .text(
            `Week: ${new Date(order.bnpcCaps.weekStart).toLocaleDateString("en-PH")} - ${new Date(order.bnpcCaps.weekEnd).toLocaleDateString("en-PH")}`,
            PAGE_MARGIN,
            y,
          );
        y += 14;
      }

      y += 6;
      rule(doc, y);
      y += 20;
    }

    // ── VERIFICATION ───────────────────────────
    let verif = "System";
    if (order.manualOverride) verif = "Cashier (Manual)";
    else if (order.verificationSource === "system") verif = "System (App)";

    doc
      .font("Helvetica")
      .fontSize(7.5)
      .fillColor(C.gray)
      .text(`Verified by: ${verif}`, PAGE_MARGIN, y);

    if (order.customerType !== "regular") {
      doc.text(
        `Discount Type: ${order.customerType.toUpperCase()}`,
        META_RIGHT,
        y,
      );
    }

    y += 22;

    // ── FOOTER ─────────────────────────────────
    rule(doc, y, C.green, 1);
    y += 14;

    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor(C.green)
      .text("Thank you for shopping with Consoli Scan!", PAGE_MARGIN, y, {
        width: CONTENT_W,
        align: "center",
      });

    y += 16;

    doc
      .font("Helvetica")
      .fontSize(7)
      .fillColor(C.gray)
      .text(
        "System-generated receipt. No signature required.",
        PAGE_MARGIN,
        y,
        { width: CONTENT_W, align: "center" },
      );

    y += 10;

    doc
      .font("Helvetica")
      .fontSize(7)
      .fillColor(C.gray)
      .text(
        `Generated: ${new Date().toLocaleString("en-PH")}`,
        PAGE_MARGIN,
        y,
        { width: CONTENT_W, align: "center" },
      );

    doc.end();
  } catch (err) {
    console.error("Receipt generation error:", err);
    res
      .status(500)
      .json({ message: "Failed to generate receipt", error: err.message });
  }
};
