import { combineReducers } from "@reduxjs/toolkit";
import authReducer from "../slices/auth/authSlice";
import cartReducer from "../slices/cart/cartSlice";
import productReducer from "../slices/product/productSlice";
import networkReducer from "../slices/network/networkSlice";

export const appReducer = combineReducers({
  auth: authReducer,
  cart: cartReducer,
  product: productReducer,
  network: networkReducer,
});
