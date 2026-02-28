import AsyncStorage from "@react-native-async-storage/async-storage";

const PROMO_KEY = "promo_catalog";

const safeParse = (value, fallback) => {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

export const readPromos = async () => {
  const promoRaw = await AsyncStorage.getItem(PROMO_KEY);
  // console.log("📦 [PROMO STORAGE] readPromos:", promoRaw);
  return safeParse(promoRaw, []);
};

export const writePromos = async (promos = []) => {
  await AsyncStorage.setItem(PROMO_KEY, JSON.stringify(promos));
};
