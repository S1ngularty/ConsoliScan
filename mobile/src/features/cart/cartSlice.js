import { createSlice } from "@reduxjs/toolkit";

const cartSlice = createSlice({
  name: "cart",
  initialState: {
    cart: [],
    itemCount: 0,
    totalPrice: 0,
    loading: false,
    error: null,
  },

  reducers: {
    addToCart: (state, action) => {
      const addedItem = action.payload;
      const existingItem = state.cart.find((i) => i._id === addedItem._id);

      if (existingItem) {
        existingItem.qty += addedItem.selectedQuantity;
      } else {
        // Ensure the item has qty property
        state.cart.push({ 
          ...addedItem,
          qty: addedItem.selectedQuantity || 1 
        });
      }

      recalcTotal(state);
    },

    adjustQuantity: (state, action) => {
      const { _id, selectedQuantity } = action.payload;
      const adjustProductQty = state.cart.find((i) => i._id === _id);
      if (adjustProductQty) {
        adjustProductQty.qty = selectedQuantity;
        recalcTotal(state);
      }
    },
    
    removeFromCart: (state, action) => {
      const itemId = action.payload;
      state.cart = state.cart.filter((i) => i._id !== itemId);
      recalcTotal(state);
    },
    
    clearCart: (state) => {
      state.cart = [];
      state.totalPrice = 0;
      state.itemCount = 0;
    },
  },
});

const recalcTotal = (state) => {
  const newCart = state.cart;
  state.totalPrice = newCart.reduce(
    (acc, curr) => acc + (curr.price || 0) * (curr.qty || 0),
    0,
  );
  state.itemCount = newCart.reduce((acc, curr) => acc + (curr.qty || 0), 0);
};

export const { addToCart, adjustQuantity, removeFromCart, clearCart } = cartSlice.actions;
export default cartSlice.reducer;