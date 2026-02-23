/**
 * Validation Service
 * Determines validation method based on cart item sensitivity
 */

/**
 * Assess cart items and determine if rescan is needed
 * @param {Array} cartItems - Array of cart items
 * @returns {Object} - { needsRescan, reason, riskLevel }
 */
function assessCartSensitivity(cartItems) {
  if (!cartItems || cartItems.length === 0) {
    return {
      needsRescan: false,
      reason: "Empty cart",
      riskLevel: "LOW",
      validationMethod: "COUNTING_ONLY",
    };
  }

  let hasSensitiveItems = false;
  let sensitivityReasons = [];

  // Check each item for sensitivity factors
  for (const item of cartItems) {
    // Check if BNPC eligible (protected items)
    if (item.isBNPCEligible || item.isBNPCProduct) {
      hasSensitiveItems = true;
      sensitivityReasons.push(`BNPC item: ${item.name}`);
      continue;
    }

    // Check if high-value item (>500 pesos)
    if (item.unitPrice > 500) {
      hasSensitiveItems = true;
      sensitivityReasons.push(
        `High-value item: ${item.name} (₱${item.unitPrice})`,
      );
      continue;
    }

    // Check if on promo/sale (needs verification)
    if (item.saleActive) {
      hasSensitiveItems = true;
      sensitivityReasons.push(`Promo item: ${item.name}`);
      continue;
    }
  }

  // Determine validation method
  if (hasSensitiveItems) {
    return {
      needsRescan: true,
      reason: "Cart contains sensitive items that require manual verification",
      riskLevel: "HIGH",
      validationMethod: "FULL_RESCAN",
      sensitiveItems: sensitivityReasons,
    };
  }

  // Normal items - counting only
  return {
    needsRescan: false,
    reason: "All items are regular products",
    riskLevel: "LOW",
    validationMethod: "COUNTING_ONLY",
  };
}

module.exports = {
  assessCartSensitivity,
};
