const User = require("../models/userModel");
const LoyaltyConfig = require("../models/loyaltyConfigModel");
const { getConfig } = require("../services/loyaltyConfigService");

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
    !["pwd", "senior"].includes(orderData.customerType) ||
    !orderData?.user ||
    !orderData?.appUser ||
    orderData?.groceryEligibleSubtotal <= 0 ||
    (orderData?.bnpcDiscount?.autoCalculated <= 0 &&
      orderData?.seniorPwdDiscountAmount <= 0)
  )
    return orderData;

  // if (orderData.bookletUpdated !== true) {
  //   throw new Error("Booklet must be updated before confirming order");
  // }

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
    orderData.bnpcEligibleSubtotal,
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

exports.managePoints = async (orderData) => {
  if (!orderData?.user && !orderData?.appUser) return; 
  // console.log(orderData)
  
  const config = await getConfig();
  
  // FIX: Get pointsUsed from the correct location
  const pointsUsed = orderData.loyaltyDiscount?.pointsUsed 
  const finalAmount = orderData.finalAmountPaid || orderData.amounts?.finalTotal || 0;
  const pointsEarned = (config?.earnRate || 0.1) * finalAmount;
  
  const user = await User.findById(orderData.user);
  console.log('User current points:', user.loyaltyPoints);
  console.log('Points used:', pointsUsed);
  console.log('Points earned:', pointsEarned);
  
  // Validate points
  if (pointsUsed > 0 && user.loyaltyPoints < pointsUsed) {
    throw new Error(`Insufficient loyalty points. Available: ${user.loyaltyPoints}, Requested: ${pointsUsed}`);
  }

  // Ensure all values are numbers before calculation
  const currentPoints = Number(user.loyaltyPoints) || 0;
  const usedPoints = Number(pointsUsed) || 0;
  const earnedPoints = Number(pointsEarned) || 0;
  
  user.loyaltyPoints = ((currentPoints - usedPoints) + earnedPoints).toFixed(2);

  // Initialize and update history
  user.loyaltyHistory = user.loyaltyHistory || [];
  
  if (usedPoints > 0) {
    user.loyaltyHistory.push({ 
      event: "redeem", 
      points: usedPoints, 
      date: new Date() 
    });
  }
  
  if (earnedPoints > 0) {
    user.loyaltyHistory.push({ 
      event: "earn", 
      points: earnedPoints, 
      date: new Date() 
    });
  }

  await user.save();
  console.log('New points total:', user.loyaltyPoints);
  
  return user.loyaltyPoints;
};
