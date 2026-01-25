import { createAsyncThunk } from "@reduxjs/toolkit";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const saveLocally = createAsyncThunk(
  "cart/saveLocally",
  async (_, { getState, dispatch }) => {
    const { cart, user } = getState();

    if (cart.cart.length <= 0) return;
    await AsyncStorage.setItem("cart", JSON.stringify(cart.cart));
  },
);

export const syncCartToServer = createAsyncThunk(
  "cart/syncCartToServer",
  async (_, { getState }) => {
    const { cart, user } = getState();
    if (!user.isLoggedIn || !cart.cart.length <= 0) return;
    //service api
  },
);
