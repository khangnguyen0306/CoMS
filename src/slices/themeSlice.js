import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    isDarkMode: localStorage.getItem('theme') === 'dark' || false,
};

const themeSlice = createSlice({
    name: 'theme',
    initialState,
    reducers: {
        toggleTheme: (state) => {
            state.isDarkMode = !state.isDarkMode;
            localStorage.setItem('theme', state.isDarkMode ? 'dark' : 'light');
            // Cập nhật class cho document
            if (state.isDarkMode) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        },
        setTheme: (state, action) => {
            state.isDarkMode = action.payload;
            localStorage.setItem('theme', action.payload ? 'dark' : 'light');
            if (action.payload) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        },
    },
});

export const { toggleTheme, setTheme } = themeSlice.actions;
export default themeSlice.reducer;