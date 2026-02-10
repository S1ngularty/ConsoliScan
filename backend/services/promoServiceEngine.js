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
    // console.log(itemObj)
    subtotal = item.price * itemObj.qty;
    // console.log(itemObj.price,itemObj.qty)
    products.push(item._id.toString());
    categories.push(item.category._id.toString());
  }

  return {
    subtotal,
    products,
    categories,
    items:cart
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
  console.log(cart);
  if (promo.scope === "product") {
    baseAmount = cart.items.items
      .filter((i) => promo.targetIds.includes(i.product._id))
      .reduce((sum, i) => sum + i.product.price * i.qty, 0);
  }

  if (promo.scope === "category") {
    baseAmount = cart.items.items
      .filter((i) => promo.targetIds.includes(i.product.category._id))
      .reduce((sum, i) => sum + i.product.price * i.qty, 0);
  }

  if (promo.type === "percentage") return baseAmount * (promo.value / 100);

  return Math.min(promo.value, baseAmount);
}

exports.PromoSuggestion = (cart, promos) => {
  const cartContext = buildCartContext(cart);
  const usablePromos = promos.filter((p) => {
    return !p.usageLimit || p.usedCount < p.usageLimit;
  });

  const minPurchaseFiltered = usablePromos.filter((p) => {
    return !p.minPurchase || cart.subtotal >= p.minPurchase;
  });

  const eligiblePromos = minPurchaseFiltered.filter((p) =>
    promoMatchesCart(cartContext, p),
  );

  return eligiblePromos;
};
