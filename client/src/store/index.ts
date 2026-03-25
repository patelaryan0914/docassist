import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import { persistStore, persistReducer } from 'redux-persist';
import storage from "./persistStorage";
import { combineReducers } from '@reduxjs/toolkit';

const persistConfig = {
    key: 'docassist',
    storage,
};
const rootReducer = combineReducers({
    auth: authReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
            },
        }),
});
export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;