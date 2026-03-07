import { createSlice } from "@reduxjs/toolkit";
import {
  loadLocalCart,
  saveLocally,
  syncOfflineTransactions,
  syncPendingCheckouts,
} from "./cartThunks";

const normalizeQuantities = (items) =>
  (items || []).map((item) => {
    if (item?.qty != null) {
      return { ...item, selectedQuantity: item.qty };
    }
    return item;
  });

const getCartItemKey = (item) => {
  if (!item) return null;
  return (
    item._id ||
    item.id ||
    item.barcode ||
    item.sku ||
    (item.name ? `name:${String(item.name).toLowerCase()}` : null)
  );
};

const cartSlice = createSlice({
  name: "cart",
  initialState: {
    cart: [],
    promo: [],
    itemCount: 0,
    totalPrice: 0,
    sessionActive: false,
    sessionId: null,
    sessionStartTime: null,
    loading: false,
    error: null,
  },

  reducers: {
    startSession: (state) => {
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      state.sessionActive = true;
      state.sessionId = sessionId;
      state.sessionStartTime = new Date().toISOString();
    },

    endSession: (state) => {
      state.sessionActive = false;
      state.sessionId = null;
      state.sessionStartTime = null;
      state.cart = [];
      state.promo = [];
      state.totalPrice = 0;
      state.itemCount = 0;
    },
    setCart: (state, action) => {
      state.cart = normalizeQuantities(action.payload);
      recalcTotal(state);
    },

    addToCart: (state, action) => {
      const addedItem = action.payload;
      const addedQty = Number(addedItem?.selectedQuantity || 1);
      const addedKey = getCartItemKey(addedItem);

      if (!addedKey) return;

      const existingItem = state.cart.find(
        (i) => getCartItemKey(i) === addedKey,
      );

      if (existingItem) {
        existingItem.qty = Number(existingItem.qty || 0) + addedQty;
        existingItem.selectedQuantity = existingItem.qty;
      } else {
        const normalizedItem = {
          ...addedItem,
          _id: addedItem._id || addedItem.id || addedItem.barcode || addedKey,
        };

        state.cart.push({
          ...normalizedItem,
          qty: addedQty,
          selectedQuantity: addedQty,
        });
      }

      recalcTotal(state);
    },

    adjustQuantity: (state, action) => {
      const { _id, selectedQuantity } = action.payload;

      const adjustProductQty = state.cart.find((i) => i._id === _id);
      if (adjustProductQty) {
        const oldQty = adjustProductQty.qty;
        adjustProductQty.qty = selectedQuantity;
        adjustProductQty.selectedQuantity = selectedQuantity;
        recalcTotal(state);
      } else {
        console.warn("⚠️ [CART SLICE] Item not found for adjustment:", _id);
      }
    },

    removeFromCart: (state, action) => {
      const itemId = action.payload;
      const item = state.cart.find((i) => i._id === itemId);

      state.cart = state.cart.filter((i) => i._id !== itemId);
      recalcTotal(state);
    },

    clearCart: (state) => {
      state.cart = [];
      state.promo = [];
      state.totalPrice = 0;
      state.itemCount = 0;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(loadLocalCart.fulfilled, (state, action) => {
        if (action.payload) {
          state.cart = normalizeQuantities(action.payload.items);
          state.sessionActive = action.payload.sessionActive || false;
          state.sessionId = action.payload.sessionId || null;
          state.sessionStartTime = action.payload.sessionStartTime || null;
          recalcTotal(state);
        }
      })
      .addCase(saveLocally.fulfilled, (state) => {
        // Local save complete
      })
      .addCase(syncOfflineTransactions.fulfilled, (state) => {
        // Transactions synced successfully
      })
      .addCase(syncOfflineTransactions.rejected, (state, action) => {
        state.error = action.error.message;
      })
      .addCase(syncPendingCheckouts.fulfilled, (state) => {
        // Checkouts synced successfully
      })
      .addCase(syncPendingCheckouts.rejected, (state, action) => {
        state.error = action.error.message;
      });
  },
});

const recalcTotal = (state) => {
  const newCart = state.cart;
  const newTotal = newCart.reduce(
    (acc, curr) =>
      acc + (curr.saleActive ? curr.salePrice : curr.price) * (curr.qty || 0),
    0,
  );
  const newItemCount = newCart.reduce((acc, curr) => acc + (curr.qty || 0), 0);

  state.totalPrice = newTotal;
  state.itemCount = newItemCount;
};

export const {
  startSession,
  endSession,
  setCart,
  addToCart,
  adjustQuantity,
  removeFromCart,
  clearCart,
} = cartSlice.actions;

export default cartSlice.reducer;
