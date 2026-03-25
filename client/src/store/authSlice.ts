import { createSlice } from "@reduxjs/toolkit";

const initialState: { userInfo: { name: string, email: string, image?: string }, isLoggedIn: boolean, isHospitalConfigured: boolean } = {
    userInfo: {
        name: "",
        email: "",
        image: ""
    },
    isLoggedIn: false,
    isHospitalConfigured: false
};

export const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        signInStore: (state, action) => {
            state.userInfo = { ...action.payload.userDetails }
            state.isLoggedIn = true

        },
        signOutStore: () => initialState,
    }
});

export const { signInStore, signOutStore } = authSlice.actions;

export default authSlice.reducer;