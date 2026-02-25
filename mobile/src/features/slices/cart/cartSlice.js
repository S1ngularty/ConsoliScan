import { createSlice } from "@reduxjs/toolkit";
import { getCartFromServer, loadLocalCart, saveLocally } from "./cartThunks";

const normalizeQuantities = (items) =>
  (items || []).map((item) => {
    if (item?.qty != null) {
      return { ...item, selectedQuantity: item.qty };
    }
    return item;
  });

const cartSlice = createSlice({
  name: "cart",
  initialState: {
    cart: [],
    promo: [],
    itemCount: 0,
    totalPrice: 0,
    fromLocal: false,
    needsSync: false,
    loading: false,
    error: null,
  },

  reducers: {
    setCart: (state, action) => {
      console.log(
        "📝 [CART SLICE] setCart called with",
        action.payload.length,
        "items",
      );
      state.cart = normalizeQuantities(action.payload);
      recalcTotal(state);
    },

    addToCart: (state, action) => {
      const addedItem = action.payload;
      console.log("➕ [CART SLICE] addToCart:", addedItem.name);

      const existingItem = state.cart.find((i) => i._id === addedItem._id);

      if (existingItem) {
        const oldQty = existingItem.qty;
        existingItem.qty += addedItem.selectedQuantity;
        console.log(
          "➕ [CART SLICE] Updated existing item qty:",
          oldQty,
          "→",
          existingItem.qty,
        );
      } else {
        state.cart.push({
          ...addedItem,
          qty: addedItem.selectedQuantity || 1,
        });
        console.log(
          "➕ [CART SLICE] Added new item with qty:",
          addedItem.selectedQuantity || 1,
        );
      }

      recalcTotal(state);
      state.needsSync = true;
    },

    adjustQuantity: (state, action) => {
      const { _id, selectedQuantity } = action.payload;
      console.log(
        "🔢 [CART SLICE] adjustQuantity:",
        _id,
        "→",
        selectedQuantity,
      );

      const adjustProductQty = state.cart.find((i) => i._id === _id);
      if (adjustProductQty) {
        const oldQty = adjustProductQty.qty;
        adjustProductQty.qty = selectedQuantity;
        adjustProductQty.selectedQuantity = selectedQuantity;
        console.log(
          "🔢 [CART SLICE] Quantity adjusted:",
          oldQty,
          "→",
          selectedQuantity,
        );
        recalcTotal(state);
        state.needsSync = true;
      } else {
        console.warn("⚠️ [CART SLICE] Item not found for adjustment:", _id);
      }
    },

    removeFromCart: (state, action) => {
      const itemId = action.payload;
      const item = state.cart.find((i) => i._id === itemId);
      console.log("➖ [CART SLICE] removeFromCart:", item?.name || itemId);

      state.cart = state.cart.filter((i) => i._id !== itemId);
      recalcTotal(state);
      state.needsSync = true;
    },

    clearCart: (state) => {
      console.log(
        "🗑️ [CART SLICE] clearCart - clearing",
        state.cart.length,
        "items",
      );
      state.cart = [];
      state.totalPrice = 0;
      state.itemCount = 0;
      state.needsSync = false;
    },

    markSyncComplete: (state) => {
      console.log("✅ [CART SLICE] Cart sync marked complete");
      state.needsSync = false;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(getCartFromServer.pending, (state) => {
        console.log("⏳ [CART SLICE] getCartFromServer pending");
        state.loading = true;
      })
      .addCase(getCartFromServer.fulfilled, (state, action) => {
        console.log("✅ [CART SLICE] getCartFromServer fulfilled");

        if (action.payload) {
          state.cart = normalizeQuantities(action.payload?.formattedItems);
          state.promo = action.payload?.promoSuggestionList || [];
          state.fromLocal = action.payload?.fromLocal || false;

          console.log(
            "✅ [CART SLICE] Cart loaded:",
            state.cart.length,
            "items",
          );
          console.log("✅ [CART SLICE] From local:", state.fromLocal);

          recalcTotal(state);
        }

        state.loading = false;
      })
      .addCase(getCartFromServer.rejected, (state, action) => {
        console.error(
          "❌ [CART SLICE] getCartFromServer rejected:",
          action.error.message,
        );
        state.loading = false;
        state.error = action.error.message;
      })

      .addCase(loadLocalCart.fulfilled, (state, action) => {
        if (action.payload) {
          console.log(
            "📂 [CART SLICE] loadLocalCart fulfilled:",
            action.payload.itemCount,
            "items",
          );
          state.cart = normalizeQuantities(action.payload.items);
          state.fromLocal = true;
          recalcTotal(state);
        }
      })

      .addCase(saveLocally.fulfilled, (state) => {
        console.log("💾 [CART SLICE] saveLocally fulfilled");
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

  console.log("🧮 [CART SLICE] Recalculating totals");
  console.log("🧮 [CART SLICE] Items:", newCart.length);
  console.log("🧮 [CART SLICE] Total quantity:", newItemCount);
  console.log("🧮 [CART SLICE] Total price:", newTotal.toFixed(2));

  state.totalPrice = newTotal;
  state.itemCount = newItemCount;
};

export const {
  setCart,
  addToCart,
  adjustQuantity,
  removeFromCart,
  clearCart,
  markSyncComplete,
} = cartSlice.actions;

export default cartSlice.reducer;
