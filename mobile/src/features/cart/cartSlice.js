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

      state.totalPrice += addedItem.price * addedItem.qty;
      state.itemCount += addedItem.qty;
    },
  },
});

export const {addToCart} =  cartSlice.actions
export default cartSlice.reducer