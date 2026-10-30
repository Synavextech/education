import React, { createContext, useContext, useEffect, useState } from "react";

export type Theme = "dark" | "light" | "system";
export type ResolvedTheme = "dark" | "light";

interface ThemeContextType {
    theme: Theme;
    resolvedTheme: ResolvedTheme;
    setTheme: (theme: Theme) => void;
    cycleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<Theme>(() => {
        if (typeof window !== "undefined") {
            const stored = localStorage.getItem("theme");
            if (stored === "dark" || stored === "light" || stored === "system") {
                return stored as Theme;
            }
        }
        return "system";
    });

    const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => {
        if (typeof window !== "undefined") {
            if (theme === "system") {
                return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
            }
            return theme;
        }
        return "light";
    });

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
        try {
            localStorage.setItem("theme", newTheme);
        } catch (e) {
            console.error("Failed to save theme in localStorage:", e);
        }
    };

    const cycleTheme = () => {
        if (theme === "system") setTheme("light");
        else if (theme === "light") setTheme("dark");
        else setTheme("system");
    };

    useEffect(() => {
        const root = window.document.documentElement;
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

        const applyTheme = (currentTheme: Theme) => {
            root.classList.remove("light", "dark");
            let effective: ResolvedTheme;

            if (currentTheme === "system") {
                effective = mediaQuery.matches ? "dark" : "light";
            } else {
                effective = currentTheme;
            }

            root.classList.add(effective);
            setResolvedTheme(effective);
        };

        applyTheme(theme);

        const handleMediaChange = () => {
            if (theme === "system") {
                applyTheme("system");
            }
        };

        // Live event listener for device/OS setting changes
        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener("change", handleMediaChange);
        } else {
            // Deprecated fallback for older browsers
            mediaQuery.addListener(handleMediaChange);
        }

        return () => {
            if (mediaQuery.removeEventListener) {
                mediaQuery.removeEventListener("change", handleMediaChange);
            } else {
                mediaQuery.removeListener(handleMediaChange);
            }
        };
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, cycleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) throw new Error("useTheme must be used within a ThemeProvider");
    return context;
}

