const User = require("../models/userModel");

function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay(); // Sunday = 0
  d.setDate(d.getDate() - day); // move back to Sunday
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfWeek(date) {
  const start = startOfWeek(date);
  start.setDate(start.getDate() + 6); // Saturday
  start.setHours(23, 59, 59, 999);
  return start;
}

exports.logBNPC_discountUsage = async (orderData) => {
  if (
    !["pwd", "senior"].includes(orderData.customerType) &&
    !orderData?.user &&
    !orderData?.appUser &&
    !orderData?.groceryEligibleSubtotal > 0 && // only apply if > 0
    !orderData?.bnpcDiscount?.autoCalculated > 0 &&
    !orderData?.seniorPwdDiscountAmount > 0
    // orderData?.bookletUpdated
  )
    return orderData;
  const MAX_DISCOUNT = 125;
  const MAX_PURCHASE = 2500;

  const user = await User.findById(orderData.user);
  const now = new Date();
  console.log("user:", user.eligibiltyDiscountUsage);

  let usage = user?.eligibiltyDiscountUsage?.discountUsed
    ? user.eligibiltyDiscountUsage
    : {
        discountUsed: 0,
        purchasedUsed: 0,
        weekStart: startOfWeek(now),
        weekEnd: endOfWeek(now),
      };

  if (now < usage?.weekStart || now > usage?.weekEnd) {
    usage.discountUsed = 0;
    usage.purchasedUsed = 0;
    usage.weekStart = startOfWeek(now);
    usage.weekEnd = endOfWeek(now);
  }

  const remainingPurchaseAllowance = MAX_PURCHASE - usage.purchasedUsed;
  const eligiblePurchase = Math.min(
    orderData.groceryEligibleSubtotal,
    remainingPurchaseAllowance,
  );

  const calculatedDiscount = eligiblePurchase * 0.05;
  const remainingDiscountAllowance = MAX_DISCOUNT - usage.discountUsed;
  const finalDiscount = Math.min(
    calculatedDiscount,
    remainingDiscountAllowance,
  );
  if (finalDiscount > 0) {
    usage.discountUsed += finalDiscount;
    usage.purchasedUsed += eligiblePurchase;

    await User.findByIdAndUpdate(
      orderData.user,
      { eligibiltyDiscountUsage: usage },
      { new: true },
    );
    console.log("usage snapshot:", usage);
    orderData.bnpcDiscount.autoCalculated = finalDiscount;
    orderData.bnpcDiscount.total = finalDiscount;
  }
  return orderData;
};
