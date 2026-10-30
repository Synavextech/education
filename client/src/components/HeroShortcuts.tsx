import React, { useState } from "react";
import { 
    FileText, 
    Laptop, 
    Mic, 
    CalendarCheck, 
    MessageSquare, 
    ArrowUpRight, 
    Sparkles, 
    CheckCircle2 
} from "lucide-react";
import { openLiveSupportChat } from "@/lib/support";
import { 
    SubmitProposalModal, 
    SellTechnologyModal, 
    MakePresentationsModal, 
    BookInterviewModal 
} from "@/components/EngagementModals";
import { cn } from "@/lib/utils";

interface HeroShortcutsProps {
    className?: string;
    targetEventId?: string;
    targetEventTitle?: string;
}

export default function HeroShortcuts({ className, targetEventId, targetEventTitle }: HeroShortcutsProps) {
    const [activeModal, setActiveModal] = useState<string | null>(null);

    const shortcuts = [
        {
            id: "proposal",
            title: "Submit My Proposal",
            badge: "For Review",
            preview: "Submit academic papers, curriculum digitization, or project proposals for committee evaluation & funding.",
            icon: FileText,
            color: "from-blue-500/20 to-indigo-500/10 border-blue-500/30 text-blue-400 group-hover:border-blue-400",
            badgeColor: "bg-blue-500/20 text-blue-300 border-blue-500/40",
            buttonText: "Submit Proposal",
            action: () => setActiveModal("proposal")
        },
        {
            id: "technology",
            title: "Sell a Technology",
            badge: "Expo & Demo",
            preview: "Exhibit & market educational tablets, smart lab PCs, robotics, and software solutions during summits.",
            icon: Laptop,
            color: "from-cyan-500/20 to-teal-500/10 border-cyan-500/30 text-cyan-400 group-hover:border-cyan-400",
            badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
            buttonText: "Register Tech",
            action: () => setActiveModal("technology")
        },
        {
            id: "presentation",
            title: "Make Presentations",
            badge: "Keynotes & Talks",
            preview: "Deliver keynote addresses, lead hands-on STEM workshops, or present academic findings to attendees.",
            icon: Mic,
            color: "from-violet-500/20 to-purple-500/10 border-violet-500/30 text-violet-400 group-hover:border-violet-400",
            badgeColor: "bg-violet-500/20 text-violet-300 border-violet-500/40",
            buttonText: "Pitch Session",
            action: () => setActiveModal("presentation")
        },
        {
            id: "interview",
            title: "Book an Interview",
            badge: "1-on-1 Consultation",
            preview: "Schedule executive consultations, media press sessions, or institutional partnerships with WDC directors.",
            icon: CalendarCheck,
            color: "from-emerald-500/20 to-green-500/10 border-emerald-500/30 text-emerald-400 group-hover:border-emerald-400",
            badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
            buttonText: "Schedule Call",
            action: () => setActiveModal("interview")
        },
        {
            id: "inquiries",
            title: "Make Inquiries",
            badge: "Live Support 24/7",
            preview: "Instant direct connection to our live support team for sponsorship, delegate inquiries, and assistance.",
            icon: MessageSquare,
            color: "from-amber-500/20 to-orange-500/10 border-amber-500/30 text-amber-400 group-hover:border-amber-400",
            badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/40",
            buttonText: "Chat Now",
            action: () => {
                openLiveSupportChat("Hello! I would like to make an inquiry regarding WorldDucationCentre events and proposals.");
            }
        }
    ];

    return (
        <>
            <div className={cn("w-full max-w-6xl mx-auto mt-8", className)}>
                <div className="text-center mb-6">
                    <span className="text-[11px] sm:text-xs font-black uppercase tracking-widest text-cyan-400/90 bg-cyan-950/60 border border-cyan-500/30 px-3.5 py-1.5 rounded-full inline-flex items-center gap-1.5 shadow-sm">
                        <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                        Engagement Tracks & Shortcuts
                    </span>
                    <h3 className="text-lg sm:text-xl font-bold text-white mt-2">
                        Participate, Showcase & Connect With Our Global Team
                    </h3>
                </div>

                {/* 5-Card Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4 text-left">
                    {shortcuts.map((item) => {
                        const Icon = item.icon;
                        return (
                            <div
                                key={item.id}
                                onClick={item.action}
                                className={cn(
                                    "group relative flex flex-col justify-between p-4 sm:p-4.5 rounded-2xl border transition-all duration-300 cursor-pointer",
                                    "bg-slate-900/80 hover:bg-slate-800/90 backdrop-blur-md hover:scale-[1.02] hover:shadow-xl hover:shadow-cyan-950/40",
                                    item.color
                                )}
                            >
                                <div>
                                    <div className="flex items-center justify-between gap-2 mb-3">
                                        <div className="h-9 w-9 rounded-xl flex items-center justify-center bg-white/10 group-hover:bg-white/20 transition-colors">
                                            <Icon className="h-4.5 w-4.5 text-white" />
                                        </div>
                                        <span className={cn(
                                            "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border",
                                            item.badgeColor
                                        )}>
                                            {item.badge}
                                        </span>
                                    </div>

                                    <h4 className="text-base font-bold text-white tracking-tight group-hover:text-cyan-300 transition-colors">
                                        {item.title}
                                    </h4>

                                    <p className="text-xs text-slate-300/80 leading-relaxed mt-1.5 line-clamp-3">
                                        {item.preview}
                                    </p>
                                </div>

                                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-bold text-cyan-400 group-hover:text-cyan-300">
                                    <span>{item.buttonText}</span>
                                    <ArrowUpRight className="h-3.5 w-3.5 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Engagement Modals */}
            <SubmitProposalModal
                open={activeModal === "proposal"}
                onOpenChange={(isOpen) => !isOpen && setActiveModal(null)}
                eventId={targetEventId}
                eventTitle={targetEventTitle}
            />

            <SellTechnologyModal
                open={activeModal === "technology"}
                onOpenChange={(isOpen) => !isOpen && setActiveModal(null)}
                eventId={targetEventId}
                eventTitle={targetEventTitle}
            />

            <MakePresentationsModal
                open={activeModal === "presentation"}
                onOpenChange={(isOpen) => !isOpen && setActiveModal(null)}
                eventId={targetEventId}
                eventTitle={targetEventTitle}
            />

            <BookInterviewModal
                open={activeModal === "interview"}
                onOpenChange={(isOpen) => !isOpen && setActiveModal(null)}
                eventId={targetEventId}
                eventTitle={targetEventTitle}
            />
        </>
    );
}
