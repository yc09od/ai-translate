import { createSlice } from '@reduxjs/toolkit';

interface SidebarState {
  expanded: boolean;
}

const initialState: SidebarState = {
  expanded: true,
};

const sidebarSlice = createSlice({
  name: 'sidebar',
  initialState,
  reducers: {
    toggleSidebar(state) {
      state.expanded = !state.expanded;
    },
    setSidebarExpanded(state, action: { payload: boolean }) {
      state.expanded = action.payload;
    },
  },
});

export const { toggleSidebar, setSidebarExpanded } = sidebarSlice.actions;
export default sidebarSlice.reducer;
