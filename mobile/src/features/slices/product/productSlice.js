import { createSlice } from "@reduxjs/toolkit";
import {
  fetchCatalogFromServer,
  loadCatalogFromStorage,
  refreshCatalogIfNeeded,
} from "./productThunks";

const productSlice = createSlice({
  name: "product",
  initialState: {
    products: [],
    loading: false,
    error: null,
    version: 0,
    lastUpdated: null,
  },
  reducers: {
    setCatalog: (state, action) => {
      const payload = action.payload || {};
      state.products = Array.isArray(payload.products) ? payload.products : [];
      state.version = Number(payload.version || 0);
      state.lastUpdated = Date.now();
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCatalogFromServer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCatalogFromServer.fulfilled, (state, action) => {
        // console.log("Catalog fetched from server:", {
        //   products: action.payload?.products,
        //   version: action.payload?.version,
        // });
        state.loading = false;
        state.products = action.payload?.products || [];
        state.version = Number(action.payload?.version || 0);
        state.lastUpdated = Date.now();
      })
      .addCase(fetchCatalogFromServer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(loadCatalogFromStorage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadCatalogFromStorage.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload?.products || [];
        state.version = Number(action.payload?.version || 0);
        state.lastUpdated = Date.now();
      })
      .addCase(loadCatalogFromStorage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(refreshCatalogIfNeeded.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(refreshCatalogIfNeeded.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload?.products || [];
        state.version = Number(action.payload?.version || 0);
        state.lastUpdated = Date.now();
      })
      .addCase(refreshCatalogIfNeeded.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      });
  },
});

export const { setCatalog } = productSlice.actions;
export default productSlice.reducer;
