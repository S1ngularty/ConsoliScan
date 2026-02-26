import { createSlice } from "@reduxjs/toolkit";
import { loadLocalCart, saveLocally } from "./cartThunks";

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
      console.log("🎬 [CART SLICE] Session started:", sessionId);
    },

    endSession: (state) => {
      console.log("🛑 [CART SLICE] Session ended:", state.sessionId);
      state.sessionActive = false;
      state.sessionId = null;
      state.sessionStartTime = null;
      state.cart = [];
      state.promo = [];
      state.totalPrice = 0;
      state.itemCount = 0;
    },
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
    },

    clearCart: (state) => {
      console.log(
        "🗑️ [CART SLICE] clearCart - clearing",
        state.cart.length,
        "items",
      );
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
          console.log(
            "📂 [CART SLICE] loadLocalCart fulfilled:",
            action.payload.itemCount,
            "items",
          );
          state.cart = normalizeQuantities(action.payload.items);
          state.sessionActive = action.payload.sessionActive || false;
          state.sessionId = action.payload.sessionId || null;
          state.sessionStartTime = action.payload.sessionStartTime || null;
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
  startSession,
  endSession,
  setCart,
  addToCart,
  adjustQuantity,
  removeFromCart,
  clearCart,
} = cartSlice.actions;

export default cartSlice.reducer;
