import { createAsyncThunk } from "@reduxjs/toolkit";
import { getCatalog, getCatalogVersion } from "../../../api/product.api";
import { readCatalog, writeCatalog } from "../../../utils/catalogStorage";

export const fetchCatalogFromServer = createAsyncThunk(
  "product/fetchCatalogFromServer",
  async (_, { getState, rejectWithValue }) => {
    try {
      const { product } = getState();
      const localVersion = await readCatalog().then((data) => Number(data.version || 0));

      const remoteVersion = await getCatalogVersion();
        // console.log("Remote catalog version:", remoteVersion, "Local catalog version:", localVersion);
      // If versions match, no need to fetch full catalog
      if (
        remoteVersion &&
        remoteVersion === localVersion &&
        product?.products?.length > 0
      ) {
        return {
          products: product.products,
          version: localVersion,
          updated: false,
        };
      }

      // Versions differ or first fetch - get full catalog
      const products = await getCatalog();
      await writeCatalog({ products, version: remoteVersion || 1 });
      return { products, version: remoteVersion || 1, updated: true };
    } catch (error) {
      return rejectWithValue(
        error?.message || "Failed to fetch catalog from server",
      );
    }
  },
);

export const loadCatalogFromStorage = createAsyncThunk(
  "product/loadCatalogFromStorage",
  async (_, { rejectWithValue }) => {
    try {
      return await readCatalog();
    } catch (error) {
      return rejectWithValue(error?.message || "Failed to load catalog");
    }
  },
);

export const refreshCatalogIfNeeded = createAsyncThunk(
  "product/refreshCatalogIfNeeded",
  async (_, { getState, rejectWithValue }) => {
    try {
      const { product } = getState();
      const localVersion = await readCatalog().then((data) => Number(data.version || 0));

      const remoteVersion = await getCatalogVersion();
      if (remoteVersion && remoteVersion === localVersion) {
        return {
          products: product.products || [],
          version: localVersion,
          updated: false,
        };
      }

      const products = await getCatalog();
      await writeCatalog({ products, version: remoteVersion || 1 });

      return { products, version: remoteVersion || 1, updated: true };
    } catch (error) {
      return rejectWithValue(error?.message || "Failed to refresh catalog");
    }
  },
);

export default {
  fetchCatalogFromServer,
  loadCatalogFromStorage,
  refreshCatalogIfNeeded,
};
