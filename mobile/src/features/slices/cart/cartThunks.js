import { createAsyncThunk } from "@reduxjs/toolkit";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { clearCart, getCart, syncCartApi } from "../../../api/cart.api";

export const saveLocally = createAsyncThunk(
  "cart/saveLocally",
  async (_, { getState, dispatch }) => {
    const { cart, auth } = getState();

    if (cart.cart.length <= 0) return;
    await AsyncStorage.setItem("cart", JSON.stringify(cart.cart));
  },
);

export const syncCartToServer = createAsyncThunk(
  "cart/syncCartToServer",
  async (_, { getState }) => {
    const { cart, auth } = getState();
    if (auth.isLoggedIn === false || cart.cart.length <= 0) return;
    const { itemCount, totalPrice } = cart;
    const formattedData = cart.cart.map((item) => ({
      product: item._id,
      qty: item.qty,
      dateAdded: item.dateAdded,
    }));
    const data = {
      items: formattedData,
      itemCount,
      totalPrice,
    };
    const syncRequest = await syncCartApi(data);
  },
);

export const getCartFromServer = createAsyncThunk(
  "cart/getCartFromServer",
  async (_, { getState }) => {
    const { auth } = getState();
    if (!auth.isLoggedIn) return;

    const getCartRequest = await getCart();

    return getCartRequest;
  },
);

export const clearCartToServer = createAsyncThunk(
  "cart/clearCartToServer",
  async (_, { getState }) => {
    const { auth } = getState();
    if (!auth.isLoggedIn) return;
    clearCart();
  },
);
