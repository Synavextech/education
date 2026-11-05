import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, Upload, FileCheck, Sparkles, Laptop, Mic, Calendar, Send } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface EngagementModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    eventId?: string | null;
    eventTitle?: string;
    onSuccess?: () => void;
}

// Helper to upload document to Supabase storage
async function uploadDocument(userId: string, file: File, folder: string) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        throw new Error("Please log in to upload documents.");
    }
    const fileExt = file.name.split('.').pop();
    const filePath = `${folder}/${userId}/${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from('documents').getPublicUrl(filePath);
    return data.publicUrl;
}

// 1. SUBMIT PROPOSAL MODAL (FOR REVIEW)
export function SubmitProposalModal({ open, onOpenChange, eventId, eventTitle, onSuccess }: EngagementModalProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [submitting, setSubmitting] = useState(false);
    const [title, setTitle] = useState("");
    const [category, setCategory] = useState("GENERAL");
    const [description, setDescription] = useState("");
    const [selectedEventId, setSelectedEventId] = useState(eventId || "");
    const [file, setFile] = useState<File | null>(null);

    const { data: events } = useQuery({
        queryKey: ["events-for-proposal"],
        queryFn: async () => {
            const { data } = await supabase.from('Event').select('id, title, date').order('date', { ascending: true });
            return data || [];
        },
        enabled: open && !eventId,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            toast({ title: "Authentication Required", description: "Please log in to submit your proposal for review.", variant: "destructive" });
            return;
        }
        if (!title.trim() || !description.trim()) {
            toast({ title: "Incomplete Form", description: "Please provide a title and detailed proposal summary.", variant: "destructive" });
            return;
        }

        setSubmitting(true);
        try {
            let docUrl = null;
            if (file) {
                docUrl = await uploadDocument(user.id, file, "proposals");
            }

            const { error } = await supabase
                .from('Proposals')
                .insert({
                    userId: user.id,
                    eventId: selectedEventId || eventId || null,
                    title: title.trim(),
                    category,
                    description: description.trim(),
                    documentUrl: docUrl,
                    status: 'PENDING'
                });

            if (error) throw error;

            toast({
                title: "Proposal Submitted for Review",
                description: "Our academic committee will review your proposal. You will receive an update in your dashboard.",
            });
            setTitle("");
            setDescription("");
            setFile(null);
            onOpenChange(false);
            if (onSuccess) onSuccess();
        } catch (err: any) {
            console.error("Proposal error:", err);
            toast({ title: "Submission Failed", description: err.message || "Failed to submit proposal", variant: "destructive" });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-1">
                        <Sparkles className="h-4 w-4" /> Academic & Community Track
                    </div>
                    <DialogTitle className="text-2xl font-black">Submit Proposal for Review</DialogTitle>
                    <DialogDescription>
                        {eventTitle ? `Submit your project, curriculum, or paper proposal for ${eventTitle}.` : "Submit research papers, educational initiatives, or project proposals for committee evaluation."}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                    {!eventId && events && events.length > 0 && (
                        <div className="space-y-1.5">
                            <Label htmlFor="prop-event">Target Event (Optional)</Label>
                            <select
                                id="prop-event"
                                value={selectedEventId}
                                onChange={(e) => setSelectedEventId(e.target.value)}
                                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                            >
                                <option value="">General Proposal (Across All Summits)</option>
                                {events.map((ev: any) => (
                                    <option key={ev.id} value={ev.id}>{ev.title}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="prop-title">Proposal Title *</Label>
                            <Input
                                id="prop-title"
                                placeholder="e.g. AI-Assisted Smart Classrooms"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="prop-cat">Category *</Label>
                            <select
                                id="prop-cat"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                            >
                                <option value="GENERAL">General Innovation</option>
                                <option value="RESEARCH">Academic Research</option>
                                <option value="CURRICULUM">Curriculum Digitization</option>
                                <option value="GRANT">Grant & Funding Request</option>
                                <option value="COMMUNITY">Community Lab Initiative</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="prop-desc">Proposal Summary & Expected Outcomes *</Label>
                        <Textarea
                            id="prop-desc"
                            rows={4}
                            placeholder="Outline objectives, methodology, target beneficiaries, and expected outcomes..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label>Attach Proposal Document / PDF (Optional)</Label>
                        <div className="flex items-center gap-3">
                            <Input
                                type="file"
                                id="prop-file"
                                accept=".pdf,.doc,.docx,.ppt,.pptx"
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                                className="hidden"
                            />
                            <Label
                                htmlFor="prop-file"
                                className="flex items-center justify-center gap-2 px-4 py-2.5 border rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 w-full text-sm font-medium border-dashed"
                            >
                                <Upload className="h-4 w-4 text-primary" />
                                {file ? file.name : "Upload PDF or Presentation Document"}
                            </Label>
                        </div>
                    </div>

                    <Button type="submit" disabled={submitting} className="w-full font-bold h-11">
                        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Submit Proposal for Committee Review
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// 2. SELL A TECHNOLOGY DURING EVENT MODAL
export function SellTechnologyModal({ open, onOpenChange, eventId, eventTitle, onSuccess }: EngagementModalProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [submitting, setSubmitting] = useState(false);
    const [companyName, setCompanyName] = useState("");
    const [productName, setProductName] = useState("");
    const [category, setCategory] = useState("EDTECH_HARDWARE");
    const [boothType, setBoothType] = useState("STANDARD");
    const [productUrl, setProductUrl] = useState("");
    const [description, setDescription] = useState("");
    const [demoRequirements, setDemoRequirements] = useState("");
    const [contactEmail, setContactEmail] = useState(user?.email || "");
    const [contactPhone, setContactPhone] = useState("");
    const [file, setFile] = useState<File | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            toast({ title: "Authentication Required", description: "Please log in to register your technology showcase.", variant: "destructive" });
            return;
        }
        if (!companyName.trim() || !productName.trim() || !description.trim()) {
            toast({ title: "Missing Information", description: "Please fill out all required fields.", variant: "destructive" });
            return;
        }

        setSubmitting(true);
        try {
            let brochureUrl = null;
            if (file) {
                brochureUrl = await uploadDocument(user.id, file, "tech-exhibitions");
            }

            const { error } = await supabase
                .from('TechExhibitions')
                .insert({
                    userId: user.id,
                    eventId: eventId || null,
                    companyName: companyName.trim(),
                    productName: productName.trim(),
                    category,
                    boothType,
                    productUrl: productUrl.trim() || null,
                    description: description.trim(),
                    demoRequirements: demoRequirements.trim() || null,
                    brochureUrl,
                    contactEmail: contactEmail.trim() || user.email,
                    contactPhone: contactPhone.trim() || null,
                    status: 'PENDING'
                });

            if (error) throw error;

            toast({
                title: "Exhibition Application Received",
                description: "Your technology exhibition application has been submitted. Our event team will contact you regarding booth allocations.",
            });
            onOpenChange(false);
            if (onSuccess) onSuccess();
        } catch (err: any) {
            console.error("Tech exhibition error:", err);
            toast({ title: "Submission Failed", description: err.message || "Failed to submit technology exhibition", variant: "destructive" });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center gap-2 text-cyan-500 font-bold text-xs uppercase tracking-wider mb-1">
                        <Laptop className="h-4 w-4" /> Innovation & Exhibition Showcase
                    </div>
                    <DialogTitle className="text-2xl font-black">Sell Technology During Event</DialogTitle>
                    <DialogDescription>
                        {eventTitle ? `Exhibit, demo, and market your solution at ${eventTitle}.` : "Showcase your educational hardware, software, AI models, or robotics to global educators and buyers."}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="tech-comp">Company / Team Name *</Label>
                            <Input
                                id="tech-comp"
                                placeholder="e.g. EdVenture Robotics Ltd"
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="tech-prod">Product / Technology Name *</Label>
                            <Input
                                id="tech-prod"
                                placeholder="e.g. RoboSense STEM Kit"
                                value={productName}
                                onChange={(e) => setProductName(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="tech-cat">Technology Category *</Label>
                            <select
                                id="tech-cat"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                            >
                                <option value="EDTECH_HARDWARE">EdTech Hardware (Tablets, PCs)</option>
                                <option value="CLASSROOM_SOFTWARE">Classroom Software / LMS</option>
                                <option value="AI_TOOL">AI Educational Tool</option>
                                <option value="STEM_KIT">STEM & Science Kit</option>
                                <option value="ROBOTICS">Robotics & Coding Kits</option>
                                <option value="CLOUD_INFRA">Cloud Infrastructure / Networking</option>
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="tech-booth">Exhibition Preference *</Label>
                            <select
                                id="tech-booth"
                                value={boothType}
                                onChange={(e) => setBoothType(e.target.value)}
                                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                            >
                                <option value="STANDARD">Standard Expo Table & Booth</option>
                                <option value="PREMIUM_DEMO_STAGE">Premium Live Stage Demo + Booth</option>
                                <option value="VIRTUAL_BOOTH">Virtual Digital Expo Booth</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="tech-desc">Product Overview & Commercial Offer *</Label>
                        <Textarea
                            id="tech-desc"
                            rows={3}
                            placeholder="Describe what your technology does, pricing models, and how schools can acquire it..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="tech-demo">Demonstration / Electrical / Network Requirements</Label>
                        <Input
                            id="tech-demo"
                            placeholder="e.g. High-speed Wi-Fi, 2x power outlets, projector screen"
                            value={demoRequirements}
                            onChange={(e) => setDemoRequirements(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="tech-url">Website / Demo Link</Label>
                            <Input
                                id="tech-url"
                                placeholder="https://mytechproduct.com"
                                value={productUrl}
                                onChange={(e) => setProductUrl(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="tech-phone">Contact Phone</Label>
                            <Input
                                id="tech-phone"
                                placeholder="+254 700 000000"
                                value={contactPhone}
                                onChange={(e) => setContactPhone(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label>Attach Spec Sheet or Product Brochure (Optional)</Label>
                        <div className="flex items-center gap-3">
                            <Input
                                type="file"
                                id="tech-file"
                                accept=".pdf,.doc,.docx,.png,.jpg"
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                                className="hidden"
                            />
                            <Label
                                htmlFor="tech-file"
                                className="flex items-center justify-center gap-2 px-4 py-2.5 border rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 w-full text-sm font-medium border-dashed"
                            >
                                <Upload className="h-4 w-4 text-cyan-500" />
                                {file ? file.name : "Upload Product Brochure or Spec Sheet"}
                            </Label>
                        </div>
                    </div>

                    <Button type="submit" disabled={submitting} className="w-full font-bold h-11 bg-cyan-600 hover:bg-cyan-700 text-white">
                        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Submit Technology Exhibition Application
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// 3. MAKE PRESENTATIONS MODAL
export function MakePresentationsModal({ open, onOpenChange, eventId, eventTitle, onSuccess }: EngagementModalProps) {
    const { user, profile } = useAuth();
    const { toast } = useToast();
    const [submitting, setSubmitting] = useState(false);
    const [presenterName, setPresenterName] = useState(profile?.name || "");
    const [title, setTitle] = useState("");
    const [topic, setTopic] = useState("");
    const [sessionType, setSessionType] = useState<any>("KEYNOTE");
    const [durationMinutes, setDurationMinutes] = useState(30);
    const [abstract, setAbstract] = useState("");
    const [bio, setBio] = useState("");
    const [equipmentRequirements, setEquipmentRequirements] = useState("");
    const [file, setFile] = useState<File | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            toast({ title: "Authentication Required", description: "Please log in to apply to present.", variant: "destructive" });
            return;
        }
        if (!presenterName.trim() || !title.trim() || !topic.trim() || !abstract.trim() || !bio.trim()) {
            toast({ title: "Missing Information", description: "Please fill out all required presentation fields.", variant: "destructive" });
            return;
        }

        setSubmitting(true);
        try {
            let slidesUrl = null;
            if (file) {
                slidesUrl = await uploadDocument(user.id, file, "presentations");
            }

            const { error } = await supabase
                .from('EventPresentations')
                .insert({
                    userId: user.id,
                    eventId: eventId || null,
                    presenterName: presenterName.trim(),
                    title: title.trim(),
                    topic: topic.trim(),
                    sessionType,
                    durationMinutes: Number(durationMinutes),
                    abstract: abstract.trim(),
                    bio: bio.trim(),
                    slidesUrl,
                    equipmentRequirements: equipmentRequirements.trim() || null,
                    status: 'PENDING'
                });

            if (error) throw error;

            toast({
                title: "Presentation Pitch Received",
                description: "Your session proposal has been submitted to the summit committee. We will notify you upon schedule confirmation.",
            });
            onOpenChange(false);
            if (onSuccess) onSuccess();
        } catch (err: any) {
            console.error("Presentation error:", err);
            toast({ title: "Submission Failed", description: err.message || "Failed to submit presentation pitch", variant: "destructive" });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center gap-2 text-indigo-500 font-bold text-xs uppercase tracking-wider mb-1">
                        <Mic className="h-4 w-4" /> Speaker & Workshop Pitch
                    </div>
                    <DialogTitle className="text-2xl font-black">Make Presentations</DialogTitle>
                    <DialogDescription>
                        {eventTitle ? `Propose a presentation or workshop session for ${eventTitle}.` : "Deliver a keynote, lead an interactive workshop, or present academic insights at our summits."}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="pres-name">Presenter / Speaker Name *</Label>
                            <Input
                                id="pres-name"
                                placeholder="Your full name"
                                value={presenterName}
                                onChange={(e) => setPresenterName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="pres-topic">Focus Field / Domain *</Label>
                            <Input
                                id="pres-topic"
                                placeholder="e.g. STEM Pedagogies, Cloud Labs"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="pres-title">Presentation Title *</Label>
                        <Input
                            id="pres-title"
                            placeholder="e.g. Scaling Digital Classrooms Across Rural Districts"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="pres-type">Session Format *</Label>
                            <select
                                id="pres-type"
                                value={sessionType}
                                onChange={(e) => setSessionType(e.target.value)}
                                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                            >
                                <option value="KEYNOTE">Keynote Address (30-45 mins)</option>
                                <option value="WORKSHOP">Interactive Workshop (45-60 mins)</option>
                                <option value="PANEL">Panel Discussion Session</option>
                                <option value="LIGHTNING_TALK">Lightning Talk (15 mins)</option>
                                <option value="PAPER_PRESENTATION">Academic Paper Presentation</option>
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="pres-dur">Duration (Minutes)</Label>
                            <Input
                                type="number"
                                id="pres-dur"
                                min={15}
                                max={120}
                                step={15}
                                value={durationMinutes}
                                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="pres-abstract">Session Abstract & Objectives *</Label>
                        <Textarea
                            id="pres-abstract"
                            rows={3}
                            placeholder="Summarize the core concepts, target takeaways, and audience value..."
                            value={abstract}
                            onChange={(e) => setAbstract(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="pres-bio">Speaker Short Bio & Credentials *</Label>
                        <Textarea
                            id="pres-bio"
                            rows={2}
                            placeholder="Brief professional background, current institution or role..."
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label>Attach Slides Deck or Abstract Outline (Optional)</Label>
                        <div className="flex items-center gap-3">
                            <Input
                                type="file"
                                id="pres-file"
                                accept=".pdf,.ppt,.pptx,.doc,.docx"
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                                className="hidden"
                            />
                            <Label
                                htmlFor="pres-file"
                                className="flex items-center justify-center gap-2 px-4 py-2.5 border rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 w-full text-sm font-medium border-dashed"
                            >
                                <Upload className="h-4 w-4 text-indigo-500" />
                                {file ? file.name : "Upload Presentation Deck or Outline"}
                            </Label>
                        </div>
                    </div>

                    <Button type="submit" disabled={submitting} className="w-full font-bold h-11 bg-indigo-600 hover:bg-indigo-700 text-white">
                        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Submit Presentation Pitch
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// 4. BOOK AN INTERVIEW WITH US MODAL
export function BookInterviewModal({ open, onOpenChange, eventId, eventTitle, onSuccess }: EngagementModalProps) {
    const { user, profile } = useAuth();
    const { toast } = useToast();
    const [submitting, setSubmitting] = useState(false);
    const [applicantName, setApplicantName] = useState(profile?.name || "");
    const [email, setEmail] = useState(user?.email || "");
    const [phone, setPhone] = useState(profile?.phone || "");
    const [organization, setOrganization] = useState(profile?.institutionName || "");
    const [track, setTrack] = useState<any>("PARTNERSHIP");
    const [preferredDate, setPreferredDate] = useState("");
    const [preferredTime, setPreferredTime] = useState("10:00 AM - 11:00 AM EAT");
    const [formatPref, setFormatPref] = useState<any>("VIRTUAL");
    const [agenda, setAgenda] = useState("");
    const [file, setFile] = useState<File | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            toast({ title: "Authentication Required", description: "Please log in to schedule an interview.", variant: "destructive" });
            return;
        }
        if (!applicantName.trim() || !email.trim() || !preferredDate || !agenda.trim()) {
            toast({ title: "Missing Information", description: "Please provide your name, email, preferred date, and discussion agenda.", variant: "destructive" });
            return;
        }

        setSubmitting(true);
        try {
            let docUrl = null;
            if (file) {
                docUrl = await uploadDocument(user.id, file, "interviews");
            }

            const { error } = await supabase
                .from('InterviewBookings')
                .insert({
                    userId: user.id,
                    eventId: eventId || null,
                    applicantName: applicantName.trim(),
                    email: email.trim(),
                    phone: phone.trim() || null,
                    organization: organization.trim() || null,
                    track,
                    preferredDate,
                    preferredTime,
                    format: formatPref,
                    agenda: agenda.trim(),
                    documentUrl: docUrl,
                    status: 'PENDING'
                });

            if (error) throw error;

            toast({
                title: "Interview Request Received",
                description: "Our leadership team has logged your interview request. You will receive a calendar invite and confirmation shortly.",
            });
            onOpenChange(false);
            if (onSuccess) onSuccess();
        } catch (err: any) {
            console.error("Interview error:", err);
            toast({ title: "Submission Failed", description: err.message || "Failed to book interview", variant: "destructive" });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center gap-2 text-emerald-500 font-bold text-xs uppercase tracking-wider mb-1">
                        <Calendar className="h-4 w-4" /> 1-on-1 Executive Consultation
                    </div>
                    <DialogTitle className="text-2xl font-black">Book an Interview with Us</DialogTitle>
                    <DialogDescription>
                        {eventTitle ? `Schedule a dedicated session during ${eventTitle}.` : "Meet 1-on-1 with worlducationHub directors, academic coordinators, and institutional partners."}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="int-name">Your Full Name *</Label>
                            <Input
                                id="int-name"
                                placeholder="Full Name"
                                value={applicantName}
                                onChange={(e) => setApplicantName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="int-email">Email Address *</Label>
                            <Input
                                id="int-email"
                                type="email"
                                placeholder="name@organization.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="int-org">Organization / Affiliation</Label>
                            <Input
                                id="int-org"
                                placeholder="e.g. University, Ministry, NGO, Tech Firm"
                                value={organization}
                                onChange={(e) => setOrganization(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="int-track">Interview Intent / Track *</Label>
                            <select
                                id="int-track"
                                value={track}
                                onChange={(e) => setTrack(e.target.value)}
                                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                            >
                                <option value="PARTNERSHIP">Institutional Partnership</option>
                                <option value="MEDIA_PRESS">Media & Press Interview</option>
                                <option value="CAREER_MENTORSHIP">Career & Fellowship Mentorship</option>
                                <option value="RESEARCH_COLLABORATION">Research Collaboration</option>
                                <option value="FOUNDER_SPOTLIGHT">Founder / Innovator Spotlight</option>
                                <option value="GENERAL">General Consultation</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="int-date">Preferred Date *</Label>
                            <Input
                                id="int-date"
                                type="date"
                                min={new Date().toISOString().split('T')[0]}
                                value={preferredDate}
                                onChange={(e) => setPreferredDate(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="int-time">Preferred Slot *</Label>
                            <select
                                id="int-time"
                                value={preferredTime}
                                onChange={(e) => setPreferredTime(e.target.value)}
                                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                            >
                                <option value="09:00 AM - 10:00 AM EAT">09:00 AM – 10:00 AM EAT</option>
                                <option value="10:00 AM - 11:00 AM EAT">10:00 AM – 11:00 AM EAT</option>
                                <option value="02:00 PM - 03:00 PM EAT">02:00 PM – 03:00 PM EAT</option>
                                <option value="04:00 PM - 05:00 PM EAT">04:00 PM – 05:00 PM EAT</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="int-fmt">Format *</Label>
                            <select
                                id="int-fmt"
                                value={formatPref}
                                onChange={(e) => setFormatPref(e.target.value)}
                                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                            >
                                <option value="VIRTUAL">Virtual (Google Meet / Zoom)</option>
                                <option value="PHYSICAL">In-Person (At Event Summit)</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="int-agenda">Discussion Agenda & Key Questions *</Label>
                        <Textarea
                            id="int-agenda"
                            rows={3}
                            placeholder="What would you like to discuss with our executive team?"
                            value={agenda}
                            onChange={(e) => setAgenda(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label>Attach Press Kit / Resume / Portfolio (Optional)</Label>
                        <div className="flex items-center gap-3">
                            <Input
                                type="file"
                                id="int-file"
                                accept=".pdf,.doc,.docx"
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                                className="hidden"
                            />
                            <Label
                                htmlFor="int-file"
                                className="flex items-center justify-center gap-2 px-4 py-2.5 border rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 w-full text-sm font-medium border-dashed"
                            >
                                <Upload className="h-4 w-4 text-emerald-500" />
                                {file ? file.name : "Upload Press Kit, Portfolio, or Deck"}
                            </Label>
                        </div>
                    </div>

                    <Button type="submit" disabled={submitting} className="w-full font-bold h-11 bg-emerald-600 hover:bg-emerald-700 text-white">
                        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirm Interview Booking
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
