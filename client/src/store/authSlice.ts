import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

export type AuthUser = {
    _id?: string
    name: string
    email: string
    photo?: string
}

const emptyUser: AuthUser = {
    name: "",
    email: "",
    photo: "",
}

const initialState: {
    userInfo: AuthUser
    isLoggedIn: boolean
    isHospitalConfigured: boolean
} = {
    userInfo: emptyUser,
    isLoggedIn: false,
    isHospitalConfigured: false,
}

const toUserInfo = (details: Record<string, unknown> | undefined): AuthUser => ({
    _id: typeof details?._id === "string" ? details._id : undefined,
    name: typeof details?.name === "string" ? details.name : "",
    email:
        typeof details?.email === "string"
            ? details.email
            : typeof details?.mobileNumber === "string"
                ? details.mobileNumber
                : "",
    photo:
        typeof details?.photo === "string"
            ? details.photo
            : typeof details?.image === "string"
                ? details.image
                : "",
})

export const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        signInStore: (state, action) => {
            state.userInfo = toUserInfo(action.payload?.userDetails)
            state.isLoggedIn = true
        },
        updateUserStore: (state, action: PayloadAction<Partial<AuthUser>>) => {
            state.userInfo = { ...state.userInfo, ...action.payload }
        },
        signOutStore: () => initialState,
    },
})

export const { signInStore, updateUserStore, signOutStore } = authSlice.actions

export default authSlice.reducer
