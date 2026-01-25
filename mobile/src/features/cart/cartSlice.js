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
        existingItem.qty += addedItem.qty;
      } else {
        state.cart.push({ ...addedItem });
      }

      recalcTotal(state);
    },

    adjustQuantity: (state, action) => {
      const adjustProductQty = state.cart.find(
        (i) => i._id === action.payload._id,
      );
      if (adjustProductQty) {
        adjustProductQty.qty = action.payload.qty;
        recalcTotal(state);
      }
    },
    removeToCart: (state, action) => {
      const itemToRemove = action.payload;
      const newCart = state.cart.filter((i) => i._id !== itemToRemove);

      state.cart = [...newCart];
      recalcTotal(state);
    },
  },
});

const recalcTotal = (state) => {
  const newCart = state.cart
  state.totalPrice = newCart.reduce(
    (acc, curr) => acc + curr.price * curr.qty,
    0,
  );
  state.itemCount = newCart.reduce((acc, curr) => acc + curr.qty, 0);
};

export const { addToCart } = cartSlice.actions;
export default cartSlice.reducer;
