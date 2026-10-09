'use client';

import { createContext, useContext, useEffect, useSyncExternalStore } from 'react';

type ThemeContextType = {
    theme: 'light' | 'dark';
    toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function subscribeTheme(onChange: () => void) {
    window.addEventListener('storage', onChange);
    window.addEventListener('theme-change', onChange);
    return () => {
        window.removeEventListener('storage', onChange);
        window.removeEventListener('theme-change', onChange);
    };
}

const getTheme = (): 'light' | 'dark' => localStorage.getItem('theme') === 'dark' ? 'dark' : 'light';
const getServerTheme = (): 'light' | 'dark' => 'light';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const theme = useSyncExternalStore(subscribeTheme, getTheme, getServerTheme);

    useEffect(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
    }, [theme]);

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', newTheme);
        window.dispatchEvent(new Event('theme-change'));
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme debe ser usado dentro de un ThemeProvider');
    }
    return context;
}
