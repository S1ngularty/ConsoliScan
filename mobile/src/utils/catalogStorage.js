import AsyncStorage from "@react-native-async-storage/async-storage";

const CATALOG_KEY = "catalog";
const CATALOG_VERSION_KEY = "catalogVersion";

const safeParse = (value, fallback) => {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch (error) {
    return fallback;
  }
};

export const readCatalog = async () => {
  const [[, catalogRaw], [, versionRaw]] = await AsyncStorage.multiGet([
    CATALOG_KEY,
    CATALOG_VERSION_KEY,
  ]);

  const products = safeParse(catalogRaw, []);
  const version = Number(versionRaw || 0);

  return { products, version };
};

export const writeCatalog = async ({ products = [], version = 0 }) => {
    // console.log("Writing catalog to storage:", { products, version });
  await AsyncStorage.multiSet([
    [CATALOG_KEY, JSON.stringify(products)],
    [CATALOG_VERSION_KEY, String(version)],
  ]);
  return true;
};
