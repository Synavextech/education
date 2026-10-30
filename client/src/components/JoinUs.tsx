import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Laptop, Sparkles, MoveRight } from "lucide-react";

export default function JoinUs() {
    return (
        <section className="py-24 bg-gradient-to-br from-primary via-slate-900 to-indigo-950 text-white overflow-hidden relative">
            {/* Background lighting orbs */}
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

            <div className="container mx-auto px-4 sm:px-6 text-center relative z-10 max-w-4xl">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-cyan-300 text-xs font-bold uppercase tracking-wider mb-6">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Shape The Future With Us</span>
                </div>

                <h2 className="text-3xl sm:text-5xl font-black mb-6 tracking-tight leading-tight">
                    Join the WorldDucationCentre Global Network
                </h2>

                <p className="text-base sm:text-xl text-slate-300 font-light leading-relaxed mb-10 max-w-2xl mx-auto">
                    Whether you are an educator digitizing your school, a student eager to learn coding and future skills, or an institution seeking smart lab infrastructure—there is a place for you in our seasonal programs.
                </p>

                <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <Link href="/auth">
                        <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100 font-bold px-8 h-14 text-base rounded-2xl shadow-2xl hover:scale-105 transition-all">
                            Join WorldDucationCentre Portal
                        </Button>
                    </Link>
                    <Link href="/upcoming-events">
                        <Button size="lg" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 px-8 h-14 text-base rounded-2xl backdrop-blur-md">
                            Browse Seasonal Summits <MoveRight className="ml-2 h-4 w-4" />
                        </Button>
                    </Link>
                </div>
            </div>
        </section>
    );
}
