const Promo = require("../models/promoModel");

exports.PromoEngine = async (cart, promo) => {
  let cartContext = buildCartContext(cart);
  let result = evaluatePromo(cartContext, promo);
  return result;
};

const buildCartContext = (cart) => {
  let subtotal = 0;
  let products = [];
  let categories = [];

  for (let itemObj of cart.items) {
    const item = itemObj.product;

    // Validate item and product properties exist
    if (!item || !item._id) {
      console.warn("⚠️ [PROMO ENGINE] Invalid item structure:", itemObj);
      continue;
    }

    // Calculate subtotal
    const qty = itemObj.qty || 1;
    const price = item.price || 0;
    subtotal += price * qty;

    // Add product ID
    products.push(item._id.toString());

    // Add category ID - handle both object and string formats
    if (item.category) {
      const categoryId =
        typeof item.category === "string" ? item.category : item.category._id;
      if (categoryId) {
        categories.push(categoryId.toString());
      }
    }
  }

  return {
    subtotal,
    products,
    categories,
    items: cart,
  };
};

const evaluatePromo = async (cart, promoCode) => {
  const now = new Date();

  const promo = await Promo.findOne({ code: promoCode });

  if (!promo || !promo.active)
    return { valid: false, reason: "Promo not active" };

  if (now < promo.startDate || now > promo.endDate)
    return { valid: false, reason: "Promo expired" };

  if (promo.usageLimit && promo.usedCount >= promo.usageLimit)
    return { valid: false, reason: "Promo exhausted" };

  if (promo.minPurchase && cart.subtotal < promo.minPurchase)
    return { valid: false, reason: "Minimum purchase not met" };

  const match = promoMatchesCart(cart, promo);

  if (!match) return { valid: false, reason: "Promo not applicable" };

  const discount = calculateDiscount(cart, promo);

  return {
    valid: true,
    promo,
    discount,
  };
};

const promoMatchesCart = (cart, promo) => {
  switch (promo.scope) {
    case "cart":
      return true;

    case "product":
      return cart.products.some((id) => promo.targetIds.includes(id));

    case "category":
      return cart.categories.some((id) => promo.targetIds.includes(id));

    default:
      return false;
  }
};

function calculateDiscount(cart, promo) {
  let baseAmount = cart.subtotal;

  if (promo.scope === "product") {
    baseAmount = cart.items.items
      .filter((i) => {
        if (!i?.product?._id) return false;
        return promo.targetIds.includes(i.product._id.toString());
      })
      .reduce((sum, i) => sum + (i.product.price || 0) * (i.qty || 1), 0);
  }

  if (promo.scope === "category") {
    baseAmount = cart.items.items
      .filter((i) => {
        if (!i?.product?.category) return false;
        const categoryId =
          typeof i.product.category === "string"
            ? i.product.category
            : i.product.category._id;
        return categoryId && promo.targetIds.includes(categoryId.toString());
      })
      .reduce((sum, i) => sum + (i.product.price || 0) * (i.qty || 1), 0);
  }

  if (promo.type === "percentage") return baseAmount * (promo.value / 100);

  return Math.min(promo.value, baseAmount);
}

exports.PromoSuggestion = (cart, promos) => {
  const cartContext = buildCartContext(cart);
  console.log("🔖 [PROMO SUGGESTION] Cart Context:", {
    subtotal: cartContext.subtotal,
    products: cartContext.products.length,
    categories: cartContext.categories.length,
  });

  const usablePromos = promos.filter((p) => {
    const isUsable = !p.usageLimit || p.usedCount < p.usageLimit;
    return isUsable;
  });

  const minPurchaseFiltered = usablePromos.filter((p) => {
    const meetsMinPurchase =
      !p.minPurchase || cartContext.subtotal >= p.minPurchase;
    return meetsMinPurchase;
  });

  const eligiblePromos = minPurchaseFiltered.filter((p) =>
    promoMatchesCart(cartContext, p),
  );

  console.log("🔖 [PROMO SUGGESTION] Filtered results:", {
    totalPromos: promos.length,
    usable: usablePromos.length,
    minPurchase: minPurchaseFiltered.length,
    eligible: eligiblePromos.length,
  });

  return eligiblePromos;
};
