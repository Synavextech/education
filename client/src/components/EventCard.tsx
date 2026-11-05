import { format } from "date-fns";
import { Calendar, MapPin, MoveRight, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { formatKES, resolvePriceInKES } from "@/lib/currency";

export function getSeason(dateStr: string): { name: string; icon: string; color: string } {
    try {
        const d = new Date(dateStr);
        const m = d.getMonth(); // 0-indexed: 0=Jan, 11=Dec
        if (m >= 2 && m <= 4) {
            return { name: "Spring Program", icon: "", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" };
        } else if (m >= 5 && m <= 7) {
            return { name: "Summer Bootcamp", icon: "", color: "bg-amber-500/10 text-amber-600 border-amber-500/20" };
        } else if (m >= 8 && m <= 10) {
            return { name: "Autumn Summit", icon: "", color: "bg-orange-500/10 text-orange-600 border-orange-500/20" };
        } else {
            return { name: "Winter Global Forum", icon: "", color: "bg-sky-500/10 text-sky-600 border-sky-500/20" };
        }
    } catch {
        return { name: "Seasonal Event", icon: "", color: "bg-primary/10 text-primary border-primary/20" };
    }
}

export default function EventCard({ event }: { event: any }) {
    const season = getSeason(event.date);

    return (
        <Card className="group overflow-hidden border-border bg-card hover:shadow-2xl transition-all duration-500 hover:-translate-y-1.5 flex flex-col justify-between rounded-3xl">
            <div className="aspect-video relative overflow-hidden bg-slate-900">
                <img
                    src={event.heroImageUrl || event.imageUrls?.[0] || "/images/IMG-20260618-WA0008.jpg"}
                    alt={event.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    onError={(e) => {
                        (e.target as HTMLImageElement).src = "/images/IMG-20260618-WA0008.jpg";
                    }}
                />

                {/* Seasonal Badge */}
                <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-background/95 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold shadow-md border border-border">
                    <span>{season.icon}</span>
                    <span className="text-foreground">{season.name}</span>
                </div>

                {/* Price Pill */}
                <div className="absolute top-4 right-4 bg-primary text-white px-3 py-1 rounded-full text-xs font-black shadow-lg">
                    {formatKES(resolvePriceInKES(event.price))}
                </div>

                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent p-4">
                    <div className="flex items-center gap-2 text-white text-xs font-medium">
                        <Calendar className="h-3.5 w-3.5 text-cyan-400" />
                        <span>{format(new Date(event.date), "MMMM dd, yyyy")}</span>
                    </div>
                </div>
            </div>

            <CardHeader className="p-6 pb-2">
                <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors line-clamp-1">
                    {event.title}
                </CardTitle>
                <div className="flex items-center gap-1.5 text-muted-foreground text-xs mt-1 flex-wrap">
                    <div className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span className="line-clamp-1">{event.location}</span>
                    </div>
                    {event.locations && event.locations.length > 1 && (
                        <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {event.locations.length} Venues
                        </span>
                    )}
                    {event.is_child_focused ? (
                        <span className="bg-amber-500/15 text-amber-700 dark:text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-500/20">
                            👶 Child-Focused (7–15 yrs)
                        </span>
                    ) : (event.min_age !== null && event.min_age !== undefined) ? (
                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                            Age: {event.min_age}{event.max_age ? `–${event.max_age}` : '+'} yrs
                        </span>
                    ) : null}
                </div>
            </CardHeader>

            <CardContent className="px-6 py-2 flex-grow">
                <p className="text-xs sm:text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                    {event.description}
                </p>
            </CardContent>

            <CardFooter className="p-6 pt-4 border-t border-border/80 bg-muted/20">
                <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-semibold text-muted-foreground">Registration Open</span>
                    <Link href={`${new Date(event.date) >= new Date() ? '/upcoming-events' : '/past-events'}?id=${event.id}`}>
                        <Button size="sm" className="rounded-xl group/btn font-bold">
                            View Details <MoveRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-1" />
                        </Button>
                    </Link>
                </div>
            </CardFooter>
        </Card>
    );
}
