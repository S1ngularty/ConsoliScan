import { createSlice } from "@reduxjs/toolkit";

interface InitialState {}

const initialState: InitialState = {};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {},
});

export const {} = authSlice.actions;

export default authSlice.reducer;
