import { combineReducers } from "@reduxjs/toolkit";
import authReducer from "../slices/auth/authSlice";
import cartReducer from "../slices/cart/cartSlice";

export const appReducer = combineReducers({
  auth: authReducer,
  cart: cartReducer,
});
