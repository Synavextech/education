import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Menu, X, LayoutDashboard, Home, Calendar, Sun, Moon, Laptop, GraduationCap, ChevronDown, Sparkles, LogOut } from "lucide-react";
import { useState, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { supabase } from "@/lib/supabase";
import NotificationBell from "./NotificationBell";

export default function NavBar() {
    const { user, profile, logout } = useAuth();
    const { theme, setTheme, cycleTheme } = useTheme();
    const [location, setLocation] = useLocation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
    const [pastEvents, setPastEvents] = useState<any[]>([]);
    const [isUpcomingOpen, setIsUpcomingOpen] = useState(false);
    const [isPastOpen, setIsPastOpen] = useState(false);

    useEffect(() => {
        const fetchEvents = async () => {
            const now = new Date().toISOString();

            // Fetch Upcoming
            const { data: upcoming } = await supabase
                .from('Event')
                .select('id, title')
                .gte('date', now)
                .order('date', { ascending: true })
                .limit(6);
            if (upcoming) setUpcomingEvents(upcoming);

            // Fetch Past
            const { data: past } = await supabase
                .from('Event')
                .select('id, title')
                .lt('date', now)
                .order('date', { ascending: false })
                .limit(6);
            if (past) setPastEvents(past);
        };
        fetchEvents();
    }, []);

    const navLinks = [
        { href: "/", label: "Home" },
        { href: "/about", label: "About Us" },
        { href: "/upcoming-events", label: "Seasonal Events", dropdown: "upcoming" },
        { href: "/past-events", label: "Event Archive", dropdown: "past" },
        { href: "/blog", label: "Digital Insights" },
    ];

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70 shadow-sm">
            <div className="container mx-auto flex h-20 items-center justify-between px-4 sm:px-6">
                {/* Brand Logo */}
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="relative w-11 h-11 bg-gradient-to-tr from-primary to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-md shadow-primary/25 group-hover:scale-105 group-hover:rotate-3 transition-all duration-300">
                        <GraduationCap className="h-6 w-6" />
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                        </span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xl sm:text-2xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-primary to-indigo-700 dark:from-white dark:via-cyan-400 dark:to-indigo-300 bg-clip-text text-transparent">
                            WorldDucationCentre
                        </span>
                        <span className="text-[10px] font-semibold tracking-wider uppercase text-muted-foreground hidden sm:block">
                            Shaping The Future • Digitizing Learning
                        </span>
                    </div>
                </Link>

                {/* Desktop Nav - Text Based */}
                <nav className="hidden lg:flex items-center gap-7">
                    {navLinks.map((link) => (
                        <div key={link.href} className="relative group/item">
                            {link.dropdown ? (
                                <div className="flex items-center gap-1.5 cursor-pointer py-2">
                                    <Link
                                        href={link.href}
                                        className={cn(
                                            "text-sm font-semibold transition-all duration-200 hover:text-primary relative",
                                            (link.href === "/" ? location === "/" : location.startsWith(link.href)) ? "text-primary" : "text-muted-foreground"
                                        )}
                                    >
                                        {link.label}
                                    </Link>
                                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground group-hover/item:text-primary transition-transform group-hover/item:rotate-180 duration-200" />

                                    {/* Dropdown Menu */}
                                    <div className="absolute top-full left-0 mt-2 w-72 bg-card border rounded-2xl shadow-2xl opacity-0 invisible group-hover/item:opacity-100 group-hover/item:visible transition-all duration-300 py-3 z-50 backdrop-blur-lg">
                                        <div className="px-4 py-1 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                            {link.dropdown === 'upcoming' ? 'Scheduled Seasonal Gatherings' : 'Past Digital Summits'}
                                        </div>
                                        <div className="h-px bg-border my-2" />
                                        {(link.dropdown === 'upcoming' ? upcomingEvents : pastEvents).length > 0 ? (
                                            (link.dropdown === 'upcoming' ? upcomingEvents : pastEvents).map(event => (
                                                <Link
                                                    key={event.id}
                                                    href={`${link.href}?id=${event.id}`}
                                                    className="block px-4 py-2 text-sm text-foreground/80 hover:text-primary hover:bg-primary/5 transition-colors line-clamp-1"
                                                >
                                                    {event.title}
                                                </Link>
                                            ))
                                        ) : (
                                            <div className="px-4 py-2 text-sm text-muted-foreground">No events recorded yet</div>
                                        )}
                                        <div className="h-px bg-border my-2" />
                                        <Link
                                            href={link.href}
                                            className="block px-4 py-1 text-xs font-bold text-primary hover:underline"
                                        >
                                            View all {link.label.toLowerCase()} →
                                        </Link>
                                    </div>
                                </div>
                            ) : (
                                <Link
                                    href={link.href}
                                    className={cn(
                                        "text-sm font-semibold transition-all duration-200 hover:text-primary relative py-2",
                                        location === link.href ? "text-primary" : "text-muted-foreground"
                                    )}
                                >
                                    {link.label}
                                    {location === link.href && (
                                        <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-full transition-all duration-300" />
                                    )}
                                </Link>
                            )}
                        </div>
                    ))}
                </nav>

                {/* Right side controls */}
                <div className="hidden lg:flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={cycleTheme}
                        className="rounded-full w-10 h-10 hover:bg-muted relative transition-transform active:scale-95"
                        title={`Theme: ${theme === 'system' ? 'System (Auto)' : theme === 'dark' ? 'Dark' : 'Light'}`}
                        aria-label="Toggle theme mode"
                    >
                        {theme === "system" ? (
                            <Laptop className="h-5 w-5 text-primary" />
                        ) : theme === "dark" ? (
                            <Moon className="h-5 w-5 text-cyan-400" />
                        ) : (
                            <Sun className="h-5 w-5 text-amber-500" />
                        )}
                        <span className="sr-only">Theme: {theme}</span>
                    </Button>

                    {user && <NotificationBell />}

                    {user ? (
                        <div className="flex items-center gap-2">
                            <Link href="/my-requests">
                                <Button variant="ghost" className="rounded-full px-4 text-sm font-semibold hover:text-primary transition-all duration-300">
                                    My Dashboard
                                </Button>
                            </Link>
                            {profile?.role === 'ADMIN' && (
                                <Link href={location === '/admin' ? '/' : '/admin'}>
                                    <Button variant={location === '/admin' ? "default" : "ghost"} size="icon" className="rounded-full w-10 h-10 shadow-sm">
                                        {location === '/admin' ? <Home className="h-5 w-5" /> : <LayoutDashboard className="h-5 w-5" />}
                                    </Button>
                                </Link>
                            )}
                            <Button variant="outline" size="sm" onClick={() => logout()} className="rounded-full px-4 border hover:bg-destructive hover:text-white transition-colors duration-300">
                                <LogOut className="h-4 w-4 mr-2" /> Logout
                            </Button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Link href="/auth">
                                <Button size="sm" className="rounded-full px-6 font-semibold bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-700 shadow-md shadow-primary/20 hover:shadow-lg transition-all duration-300 active:scale-95 text-white">
                                    Portal Sign In
                                </Button>
                            </Link>
                        </div>
                    )}
                </div>

                {/* Mobile Actions */}
                <div className="lg:hidden flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={cycleTheme}
                        className="rounded-full w-9 h-9"
                        title={`Theme: ${theme === 'system' ? 'System (Auto)' : theme}`}
                        aria-label="Toggle theme mode"
                    >
                        {theme === "system" ? (
                            <Laptop className="h-4 w-4 text-primary" />
                        ) : theme === "dark" ? (
                            <Moon className="h-4 w-4 text-cyan-400" />
                        ) : (
                            <Sun className="h-4 w-4 text-amber-500" />
                        )}
                    </Button>
                    {user && <NotificationBell />}
                    <button
                        className="p-2 rounded-xl text-foreground hover:bg-muted focus:outline-none"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        aria-label="Toggle Navigation Menu"
                    >
                        {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="lg:hidden border-t bg-background/95 backdrop-blur-xl p-5 animate-in fade-in slide-in-from-top-2 shadow-2xl">
                    <div className="flex flex-col gap-4">
                        {navLinks.map((link) => (
                            <div key={link.href} className="flex flex-col gap-2">
                                <Link
                                    href={link.href}
                                    onClick={(e) => {
                                        if (link.dropdown) {
                                            e.preventDefault();
                                            if (link.dropdown === 'upcoming') setIsUpcomingOpen(!isUpcomingOpen);
                                            else setIsPastOpen(!isPastOpen);
                                        } else {
                                            setIsMenuOpen(false);
                                        }
                                    }}
                                    className={cn(
                                        "text-lg font-semibold flex items-center justify-between py-1",
                                        (link.href === "/" ? location === "/" : location.startsWith(link.href)) ? "text-primary" : "text-muted-foreground"
                                    )}
                                >
                                    {link.label}
                                    {link.dropdown && (
                                        <ChevronDown className={cn(
                                            "h-5 w-5 transition-transform",
                                            (link.dropdown === 'upcoming' ? isUpcomingOpen : isPastOpen) && "rotate-180"
                                        )} />
                                    )}
                                </Link>

                                {link.dropdown && (link.dropdown === 'upcoming' ? isUpcomingOpen : isPastOpen) && (
                                    <div className="pl-4 flex flex-col gap-2.5 border-l-2 border-primary/20 ml-1 py-1">
                                        {(link.dropdown === 'upcoming' ? upcomingEvents : pastEvents).length > 0 ? (
                                            (link.dropdown === 'upcoming' ? upcomingEvents : pastEvents).map(event => (
                                                <Link
                                                    key={event.id}
                                                    href={`${link.href}?id=${event.id}`}
                                                    onClick={() => setIsMenuOpen(false)}
                                                    className="text-sm text-muted-foreground hover:text-primary line-clamp-1"
                                                >
                                                    {event.title}
                                                </Link>
                                            ))
                                        ) : (
                                            <span className="text-sm text-muted-foreground">No events scheduled</span>
                                        )}
                                        <Link
                                            href={link.href}
                                            onClick={() => setIsMenuOpen(false)}
                                            className="text-xs font-bold text-primary mt-1"
                                        >
                                            View all →
                                        </Link>
                                    </div>
                                )}
                            </div>
                        ))}
                        <hr className="border-border my-2" />
                        {user ? (
                            <>
                                {profile?.role === 'ADMIN' && (
                                    <Link href="/admin" onClick={() => setIsMenuOpen(false)} className="text-base font-semibold text-primary">
                                        Admin Management Panel
                                    </Link>
                                )}
                                <Link href="/my-requests" onClick={() => setIsMenuOpen(false)} className="text-base font-semibold">
                                    My Dashboard & Applications
                                </Link>
                                <button
                                    onClick={() => { logout(); setIsMenuOpen(false); }}
                                    className="text-left text-base font-semibold text-red-500"
                                >
                                    Logout
                                </button>
                            </>
                        ) : (
                            <Link href="/auth" onClick={() => setIsMenuOpen(false)}>
                                <Button className="w-full bg-gradient-to-r from-primary to-indigo-600 text-white font-semibold h-12 rounded-xl">
                                    Sign In / Register
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
}
