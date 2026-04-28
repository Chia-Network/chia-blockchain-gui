/* eslint-disable no-param-reassign -- This file uses Immer via createSlice */
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

const STORAGE_KEY = 'chia-gui-walletRpcPreferences';

export type WalletRpcPreferencesState = {
  allowUnsynced: boolean;
  usePeakHeightForHeightInfo: boolean;
};

const defaultState: WalletRpcPreferencesState = {
  allowUnsynced: false,
  usePeakHeightForHeightInfo: false,
};

function loadFromStorage(): WalletRpcPreferencesState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { ...defaultState };
    }
    const parsed = JSON.parse(raw) as Partial<WalletRpcPreferencesState>;
    return {
      allowUnsynced: !!parsed.allowUnsynced,
      usePeakHeightForHeightInfo: !!parsed.usePeakHeightForHeightInfo,
    };
  } catch {
    return { ...defaultState };
  }
}

function persist(state: WalletRpcPreferencesState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore quota / private mode
  }
}

const walletRpcPreferencesSlice = createSlice({
  name: 'walletRpcPreferences',
  initialState: loadFromStorage(),
  reducers: {
    setAllowUnsynced(draft, action: PayloadAction<boolean>) {
      draft.allowUnsynced = action.payload;
      persist(draft);
    },
    setUsePeakHeightForHeightInfo(draft, action: PayloadAction<boolean>) {
      draft.usePeakHeightForHeightInfo = action.payload;
      persist(draft);
    },
  },
});

export const { setAllowUnsynced, setUsePeakHeightForHeightInfo } = walletRpcPreferencesSlice.actions;

export const selectWalletRpcPreferences = (state: { walletRpcPreferences: WalletRpcPreferencesState }) =>
  state.walletRpcPreferences;

export default walletRpcPreferencesSlice.reducer;
