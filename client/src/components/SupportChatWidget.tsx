import React, { useState, useEffect, useRef } from "react";
import { MessageCircle, Send, X, ExternalLink, Bot, User as UserIcon, Shield, Sparkles, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import { SupportMessage } from "@shared/schema";

interface SupportChatWidgetProps {
    whatsappNumber?: string;
}

export default function SupportChatWidget({ whatsappNumber }: SupportChatWidgetProps) {
    const rawNumber = whatsappNumber || import.meta.env.VITE_WHATSAPP_NUMBER || "+17209948847";
    const cleanNumber = rawNumber.replace(/[^\d]/g, "");
    const { user, profile } = useAuth();

    const [isOpen, setIsOpen] = useState(false);
    const [activeChannel, setActiveChannel] = useState<'live' | 'whatsapp'>('live');
    const [messages, setMessages] = useState<SupportMessage[]>([]);
    const [inputMessage, setInputMessage] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [guestName, setGuestName] = useState("");
    const [isGuestNameSet, setIsGuestNameSet] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Get or create guest session ID
    const getGuestSessionId = () => {
        let sid = localStorage.getItem("wdc_guest_chat_session");
        if (!sid) {
            sid = "guest_" + Math.random().toString(36).substring(2, 12) + "_" + Date.now();
            localStorage.setItem("wdc_guest_chat_session", sid);
        }
        return sid;
    };

    // Initialize or fetch existing conversation
    useEffect(() => {
        let isMounted = true;

        const initConversation = async () => {
            try {
                let conv: any = null;

                if (user) {
                    // Look for open conversation for authenticated user
                    const { data, error } = await supabase
                        .from("SupportConversation")
                        .select("*")
                        .eq("userId", user.id)
                        .order("createdAt", { ascending: false })
                        .limit(1)
                        .maybeSingle();

                    if (!error && data) {
                        conv = data;
                    } else {
                        // Create conversation
                        const { data: newConv } = await supabase
                            .from("SupportConversation")
                            .insert({
                                userId: user.id,
                                status: "OPEN",
                                guestName: profile?.name || user.email?.split("@")[0] || "User",
                                guestEmail: user.email,
                            })
                            .select()
                            .single();
                        conv = newConv;
                    }
                } else {
                    const guestSid = getGuestSessionId();
                    const savedGuestName = localStorage.getItem("wdc_guest_name") || "";
                    if (savedGuestName) {
                        setGuestName(savedGuestName);
                        setIsGuestNameSet(true);
                    }

                    const { data, error } = await supabase
                        .from("SupportConversation")
                        .select("*")
                        .eq("guestSessionId", guestSid)
                        .order("createdAt", { ascending: false })
                        .limit(1)
                        .maybeSingle();

                    if (!error && data) {
                        conv = data;
                    } else if (savedGuestName) {
                        const { data: newConv } = await supabase
                            .from("SupportConversation")
                            .insert({
                                guestSessionId: guestSid,
                                guestName: savedGuestName,
                                status: "OPEN"
                            })
                            .select()
                            .single();
                        conv = newConv;
                    }
                }

                if (isMounted && conv) {
                    setConversationId(conv.id);
                    // Fetch existing messages
                    const { data: msgs } = await supabase
                        .from("SupportMessage")
                        .select("*")
                        .eq("conversationId", conv.id)
                        .order("createdAt", { ascending: true });

                    if (isMounted) {
                        setMessages(msgs || []);
                    }
                }
            } catch (err) {
                console.error("Error loading chat conversation:", err);
            }
        };

        initConversation();

        return () => {
            isMounted = false;
        };
    }, [user, profile]);

    // Supabase Realtime Subscription for incoming messages
    useEffect(() => {
        if (!conversationId) return;

        const channel = supabase
            .channel(`chat_${conversationId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'SupportMessage',
                    filter: `conversationId=eq.${conversationId}`
                },
                (payload) => {
                    const newMsg = payload.new as SupportMessage;
                    setMessages((prev) => {
                        // Prevent duplicates
                        if (prev.some((m) => m.id === newMsg.id)) return prev;
                        return [...prev, newMsg];
                    });
                    if (!isOpen && newMsg.senderRole === 'ADMIN') {
                        setUnreadCount((c) => c + 1);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [conversationId, isOpen]);

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
            setUnreadCount(0);
        }
    }, [messages, isOpen]);

    // Listen for global open-support-chat event from shortcuts & buttons
    useEffect(() => {
        const handleOpenSupport = (e: any) => {
            setIsOpen(true);
            setActiveChannel('live');
            if (e.detail?.message) {
                setInputMessage(e.detail.message);
            }
        };

        window.addEventListener('open-support-chat', handleOpenSupport);
        return () => window.removeEventListener('open-support-chat', handleOpenSupport);
    }, []);

    const handleStartGuestChat = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!guestName.trim()) return;

        localStorage.setItem("wdc_guest_name", guestName.trim());
        setIsGuestNameSet(true);

        const guestSid = getGuestSessionId();
        try {
            const { data: newConv } = await supabase
                .from("SupportConversation")
                .insert({
                    guestSessionId: guestSid,
                    guestName: guestName.trim(),
                    status: "OPEN"
                })
                .select()
                .single();

            if (newConv) {
                setConversationId(newConv.id);
            }
        } catch (err) {
            console.error("Error creating guest conversation:", err);
        }
    };

    const handleSendMessage = async (textToSend?: string) => {
        const text = (textToSend || inputMessage).trim();
        if (!text || isSending) return;

        setIsSending(true);
        const currentConvId = conversationId;

        try {
            let activeConvId = currentConvId;

            // Create conversation if not yet created
            if (!activeConvId) {
                const guestSid = getGuestSessionId();
                const senderName = user ? (profile?.name || user.email) : (guestName || "Guest User");
                const { data: newConv } = await supabase
                    .from("SupportConversation")
                    .insert({
                        userId: user?.id || null,
                        guestSessionId: user ? null : guestSid,
                        guestName: senderName,
                        guestEmail: user?.email || null,
                        status: "OPEN"
                    })
                    .select()
                    .single();

                if (newConv) {
                    activeConvId = newConv.id;
                    setConversationId(newConv.id);
                }
            }

            if (!activeConvId) throw new Error("Could not initialize chat session");

            const senderName = user ? (profile?.name || user.email?.split("@")[0] || "User") : (guestName || "Guest");
            const senderRole = user?.role === 'ADMIN' ? 'ADMIN' : (user ? 'USER' : 'GUEST');

            const { data: sentMsg, error } = await supabase
                .from("SupportMessage")
                .insert({
                    conversationId: activeConvId,
                    senderId: user?.id || null,
                    senderRole: senderRole,
                    senderName: senderName,
                    message: text,
                    isRead: false
                })
                .select()
                .single();

            if (error) throw error;

            if (sentMsg) {
                setMessages((prev) => {
                    if (prev.some((m) => m.id === sentMsg.id)) return prev;
                    return [...prev, sentMsg];
                });
            }

            // Update conversation lastMessageAt
            await supabase
                .from("SupportConversation")
                .update({ lastMessageAt: new Date().toISOString(), status: "OPEN" })
                .eq("id", activeConvId);

            setInputMessage("");

            // If it's the first message and no admin has replied yet, provide automated guidance
            if (messages.length === 0) {
                setTimeout(async () => {
                    const reply = "Thank you for contacting WorldDucationCentre Support! An educational consultant will be right with you. You can also switch to WhatsApp if you prefer real-time mobile messaging.";
                    await supabase.from("SupportMessage").insert({
                        conversationId: activeConvId,
                        senderRole: "ADMIN",
                        senderName: "WDC Assistant",
                        message: reply,
                        isRead: false
                    });
                }, 1200);
            }
        } catch (err) {
            console.error("Failed to send support message:", err);
        } finally {
            setIsSending(false);
        }
    };

    const handleQuickPrompt = (prompt: string) => {
        handleSendMessage(prompt);
    };

    const defaultWhatsAppMessage = encodeURIComponent(
        "Hello! I am contacting you from WorldDucationCentre and would like assistance with upcoming educational programs and event registrations."
    );
    const whatsappUrl = `https://wa.me/${cleanNumber}?text=${defaultWhatsAppMessage}`;

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end select-none">
            {/* Expanded Chat Box */}
            {isOpen && (
                <div className="mb-4 w-[92vw] sm:w-[390px] h-[540px] max-h-[80vh] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-400 to-indigo-500 flex items-center justify-center font-bold text-white shadow-md">
                                    <Bot className="w-5 h-5" />
                                </div>
                                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-slate-900 rounded-full" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold flex items-center gap-1.5">
                                    WorldDucationCentre Support
                                </h3>
                                <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    Online • Immediate Response
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-slate-400 hover:text-white hover:bg-white/10 rounded-full h-8 w-8"
                            onClick={() => setIsOpen(false)}
                            aria-label="Close Support Window"
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>

                    {/* Mode Switcher Tabs */}
                    <div className="bg-slate-100 dark:bg-slate-800/80 p-1.5 flex gap-1 border-b border-slate-200 dark:border-slate-700/60">
                        <button
                            type="button"
                            onClick={() => setActiveChannel('live')}
                            className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                                activeChannel === 'live'
                                    ? 'bg-white dark:bg-slate-900 text-primary shadow-sm'
                                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                            }`}
                        >
                            <MessageCircle className="w-3.5 h-3.5" />
                            Live Chat
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveChannel('whatsapp')}
                            className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                                activeChannel === 'whatsapp'
                                    ? 'bg-[#25D366] text-white shadow-sm'
                                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                            }`}
                        >
                            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                                <path d="M12.004 2C6.48 2 2.004 6.476 2.004 12c0 1.99.582 3.844 1.589 5.408L2.08 22l4.757-1.488A9.948 9.948 0 0012.004 22c5.524 0 10-4.476 10-10s-4.476-10-10-10zm5.83 14.283c-.244.685-1.22 1.258-1.706 1.306-.454.045-1.037.064-3.32-.88-2.73-1.127-4.48-3.908-4.618-4.092-.134-.184-1.1-1.465-1.1-2.793 0-1.328.694-1.982.94-2.247.247-.265.54-.33.72-.33.18 0 .36.002.518.01.168.008.394-.064.616.47.244.588.828 2.02.9 2.168.073.147.122.32.025.515-.098.196-.147.318-.293.493-.146.176-.308.393-.44.527-.147.147-.3.308-.13.6.17.293.754 1.242 1.62 2.012 1.115.992 2.056 1.3 2.348 1.447.293.147.464.122.636-.073.17-.196.733-.855.93-1.149.196-.293.39-.245.66-.147.27.098 1.71.807 2.004.954.293.147.49.22.563.342.073.123.073.71-.17 1.395z" />
                            </svg>
                            WhatsApp Support
                        </button>
                    </div>

                    {/* Content View */}
                    {activeChannel === 'whatsapp' ? (
                        <div className="flex-1 p-6 flex flex-col justify-between items-center text-center bg-slate-50/50 dark:bg-slate-900/50">
                            <div className="space-y-4 my-auto max-w-xs">
                                <div className="w-16 h-16 bg-[#25D366]/10 text-[#25D366] rounded-3xl flex items-center justify-center mx-auto shadow-inner">
                                    <svg className="w-9 h-9 fill-current" viewBox="0 0 24 24">
                                        <path d="M12.004 2C6.48 2 2.004 6.476 2.004 12c0 1.99.582 3.844 1.589 5.408L2.08 22l4.757-1.488A9.948 9.948 0 0012.004 22c5.524 0 10-4.476 10-10s-4.476-10-10-10zm5.83 14.283c-.244.685-1.22 1.258-1.706 1.306-.454.045-1.037.064-3.32-.88-2.73-1.127-4.48-3.908-4.618-4.092-.134-.184-1.1-1.465-1.1-2.793 0-1.328.694-1.982.94-2.247.247-.265.54-.33.72-.33.18 0 .36.002.518.01.168.008.394-.064.616.47.244.588.828 2.02.9 2.168.073.147.122.32.025.515-.098.196-.147.318-.293.493-.146.176-.308.393-.44.527-.147.147-.3.308-.13.6.17.293.754 1.242 1.62 2.012 1.115.992 2.056 1.3 2.348 1.447.293.147.464.122.636-.073.17-.196.733-.855.93-1.149.196-.293.39-.245.66-.147.27.098 1.71.807 2.004.954.293.147.49.22.563.342.073.123.073.71-.17 1.395z" />
                                    </svg>
                                </div>
                                <div>
                                    <h4 className="font-bold text-base text-slate-900 dark:text-white">
                                        Chat Directly on WhatsApp
                                    </h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                                        Connect directly with our admissions officer and support team on WhatsApp for mobile notifications and rapid verification.
                                    </p>
                                </div>
                                <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-2xl p-3 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-center gap-2">
                                    <Shield className="w-4 h-4 flex-shrink-0" />
                                    <span>Official Verified Support Line</span>
                                </div>
                            </div>

                            <a
                                href={whatsappUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/20 hover:shadow-xl transition-all active:scale-95 text-sm"
                            >
                                <span>Open WhatsApp Chat</span>
                                <ExternalLink className="w-4 h-4" />
                            </a>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col justify-between overflow-hidden">
                            {/* If guest and name not set, ask for guest name */}
                            {!user && !isGuestNameSet ? (
                                <div className="p-6 my-auto text-center space-y-4">
                                    <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto">
                                        <Sparkles className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                                            Welcome to Live Support
                                        </h4>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                            Please enter your name or alias to connect to an available representative.
                                        </p>
                                    </div>
                                    <form onSubmit={handleStartGuestChat} className="space-y-3">
                                        <Input
                                            type="text"
                                            placeholder="Your Name (e.g. Alex, Student)"
                                            value={guestName}
                                            onChange={(e) => setGuestName(e.target.value)}
                                            required
                                            className="rounded-xl text-center text-sm"
                                        />
                                        <Button type="submit" className="w-full rounded-xl font-semibold text-xs h-10">
                                            Start Conversation
                                        </Button>
                                    </form>
                                </div>
                            ) : (
                                <>
                                    {/* Messages list */}
                                    <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
                                        {/* Welcome bubble */}
                                        <div className="flex gap-2 items-start">
                                            <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <Bot className="w-3.5 h-3.5" />
                                            </div>
                                            <div className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-2xl rounded-tl-sm p-3 max-w-[82%] shadow-sm leading-relaxed">
                                                <p className="font-semibold text-slate-900 dark:text-white mb-0.5">
                                                    WorldDucation Support
                                                </p>
                                                Hello! How can we help you today with events, admissions, school declaration, or tickets?
                                            </div>
                                        </div>

                                        {messages.map((m) => {
                                            const isMe = m.senderRole !== 'ADMIN';
                                            return (
                                                <div
                                                    key={m.id}
                                                    className={`flex gap-2 items-end ${
                                                        isMe ? 'justify-end' : 'justify-start'
                                                    }`}
                                                >
                                                    {!isMe && (
                                                        <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mb-1">
                                                            <Bot className="w-3.5 h-3.5" />
                                                        </div>
                                                    )}
                                                    <div
                                                        className={`p-3 rounded-2xl max-w-[82%] leading-relaxed ${
                                                            isMe
                                                                ? 'bg-primary text-primary-foreground rounded-br-sm'
                                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-sm'
                                                        }`}
                                                    >
                                                        {!isMe && (
                                                            <p className="text-[10px] font-semibold text-sky-500 mb-0.5">
                                                                {m.senderName}
                                                            </p>
                                                        )}
                                                        <p className="break-words">{m.message}</p>
                                                        <div
                                                            className={`text-[9px] mt-1 flex items-center justify-end gap-1 ${
                                                                isMe
                                                                    ? 'text-primary-foreground/70'
                                                                    : 'text-slate-400'
                                                            }`}
                                                        >
                                                            <span>
                                                                {m.createdAt
                                                                    ? format(new Date(m.createdAt), 'p')
                                                                    : ''}
                                                            </span>
                                                            {isMe && <CheckCheck className="w-3 h-3" />}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        <div ref={messagesEndRef} />
                                    </div>

                                    {/* Quick Suggestions */}
                                    {messages.length < 3 && (
                                        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800/80 flex gap-1.5 overflow-x-auto no-scrollbar">
                                            <button
                                                type="button"
                                                onClick={() => handleQuickPrompt("How do I pay via M-PESA STK Push?")}
                                                className="text-[11px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-primary text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-full whitespace-nowrap transition-colors"
                                            >
                                                📱 Pay via M-PESA
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleQuickPrompt("How do I declare my school or institution?")}
                                                className="text-[11px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-primary text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-full whitespace-nowrap transition-colors"
                                            >
                                                🏫 School Declaration
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleQuickPrompt("How can I get an official Visa Invitation Letter?")}
                                                className="text-[11px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-primary text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-full whitespace-nowrap transition-colors"
                                            >
                                                ✈️ Visa Letter
                                            </button>
                                        </div>
                                    )}

                                    {/* Message Input */}
                                    <form
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            handleSendMessage();
                                        }}
                                        className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2"
                                    >
                                        <Input
                                            type="text"
                                            placeholder="Type your message..."
                                            value={inputMessage}
                                            onChange={(e) => setInputMessage(e.target.value)}
                                            className="rounded-xl text-xs h-10 bg-slate-50 dark:bg-slate-800 border-none focus-visible:ring-1"
                                            disabled={isSending}
                                        />
                                        <Button
                                            type="submit"
                                            size="icon"
                                            disabled={!inputMessage.trim() || isSending}
                                            className="h-10 w-10 rounded-xl flex-shrink-0"
                                        >
                                            <Send className="w-4 h-4" />
                                        </Button>
                                    </form>
                                </>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Floating Trigger Button */}
            <div className="flex items-center gap-3">
                {/* Tooltip / Label */}
                {!isOpen && (
                    <div className="hidden sm:flex items-center bg-slate-900/95 backdrop-blur-md text-white text-xs font-semibold px-3.5 py-2 rounded-2xl shadow-xl border border-slate-700/50">
                        <span>Live Support & WhatsApp</span>
                        <div className="w-2 h-2 bg-slate-900/95 rotate-45 absolute -right-1 border-r border-t border-slate-700/50" />
                    </div>
                )}

                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    aria-label="Open Live Support & WhatsApp Chat"
                    className="relative group flex items-center justify-center w-14 h-14 bg-gradient-to-tr from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-500 text-white rounded-full shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/50 transition-all duration-300 hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-primary/40"
                >
                    {/* Ping/Pulse Ring Animation */}
                    <span className="absolute -inset-1 rounded-full bg-primary opacity-25 animate-ping duration-1000 group-hover:opacity-0" />

                    {isOpen ? (
                        <X className="w-6 h-6 relative z-10" />
                    ) : (
                        <div className="relative z-10 flex items-center justify-center">
                            <MessageCircle className="w-7 h-7 drop-shadow-sm" />
                            {unreadCount > 0 && (
                                <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                                    {unreadCount}
                                </span>
                            )}
                        </div>
                    )}

                    {/* Active Indicator Badge */}
                    {!isOpen && (
                        <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-emerald-400 border-2 border-white dark:border-slate-900 rounded-full" />
                    )}
                </button>
            </div>
        </div>
    );
}
