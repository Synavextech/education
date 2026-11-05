
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Trash2, Edit2, Upload, Image as ImageIcon, CheckCircle, User2, QrCode, ShieldCheck, Search, MessageCircle, Send, GraduationCap, Banknote, CheckCheck, MapPin, Users } from "lucide-react";
import { format } from "date-fns";
import { Event, insertEventSchema, VisaInvitation, Booking, EventLocation } from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { cn } from "@/lib/utils";
import { formatKES } from "@/lib/currency";

function UserManager() {
    const [users, setUsers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const [userActivity, setUserActivity] = useState<any>({
        bookings: [],
        proposals: [],
        applications: [],
        visaRequests: []
    });
    const [isFetchingActivity, setIsFetchingActivity] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const { toast } = useToast();

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('User')
            .select('*, Stats(*)')
            .order('createdAt', { ascending: false });

        if (error) {
            toast({ title: "Error fetching users", description: error.message, variant: "destructive" });
        } else {
            setUsers(data || []);
        }
        setIsLoading(false);
    };

    const fetchUserActivity = async (userId: string) => {
        setIsFetchingActivity(true);
        try {
            const [bookingsRes, proposalsRes, applicationsRes, visaRes] = await Promise.all([
                supabase.from('Booking').select('*, Event(title)').eq('userId', userId),
                supabase.from('Proposals').select('*, Event(title)').eq('userId', userId),
                supabase.from('Applications').select('*').eq('userId', userId),
                supabase.from('VisaInvitation').select('*, Event(title)').eq('userId', userId)
            ]);

            setUserActivity({
                bookings: bookingsRes.data || [],
                proposals: proposalsRes.data || [],
                applications: applicationsRes.data || [],
                visaRequests: visaRes.data || []
            });
        } catch (error: any) {
            toast({ title: "Error fetching activity", description: error.message, variant: "destructive" });
        } finally {
            setIsFetchingActivity(false);
        }
    };

    const filteredUsers = users.filter(u =>
        u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-xl font-bold text-primary">User Management</h2>
                <Input
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="max-w-xs"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Users List */}
                <Card className="lg:col-span-1 h-[600px] flex flex-col">
                    <CardHeader className="py-4">
                        <CardTitle className="text-lg">Registered Users ({filteredUsers.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto p-2 space-y-2">
                        {filteredUsers.length === 0 ? (
                            <p className="text-center text-gray-500 py-4 italic">No users found.</p>
                        ) : (
                            filteredUsers.map(u => (
                                <button
                                    key={u.id}
                                    onClick={() => {
                                        setSelectedUser(u);
                                        fetchUserActivity(u.id);
                                    }}
                                    className={cn(
                                        "w-full text-left p-3 rounded-md transition-colors border",
                                        selectedUser?.id === u.id
                                            ? "bg-primary/10 border-primary shadow-sm"
                                            : "bg-card hover:bg-slate-50 border-transparent hover:border-border"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                            {u.name?.charAt(0)?.toUpperCase()}
                                        </div>
                                        <div className="overflow-hidden">
                                            <p className="font-semibold truncate">{u.name}</p>
                                            <p className="text-xs text-gray-500 truncate">{u.email}</p>
                                        </div>
                                    </div>
                                </button>
                            ))
                        )}
                    </CardContent>
                </Card>

                {/* User Details & Activity */}
                <Card className="lg:col-span-2 h-[600px] flex flex-col">
                    {!selectedUser ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 space-y-4">
                            <User2 className="h-16 w-16 opacity-20" />
                            <p>Select a user to view their complete activity.</p>
                        </div>
                    ) : (
                        <>
                            <CardHeader className="border-b bg-slate-50/50">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-2xl">{selectedUser.name}</CardTitle>
                                        <CardDescription>{selectedUser.email}</CardDescription>
                                        <div className="flex gap-2 mt-2 text-xs flex-wrap">
                                            <span className="bg-primary/10 text-primary px-2 py-1 rounded-md font-medium">Role: {selectedUser.role}</span>
                                            <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md">Joined: {format(new Date(selectedUser.createdAt), 'MMM yyyy')}</span>
                                        </div>
                                        {(selectedUser.phone || selectedUser.country || selectedUser.city || selectedUser.address) && (
                                            <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-slate-600">
                                                {selectedUser.phone && <p><span className="font-semibold text-slate-400">Phone:</span> {selectedUser.phone}</p>}
                                                {selectedUser.country && <p><span className="font-semibold text-slate-400">Country:</span> {selectedUser.country}</p>}
                                                {selectedUser.city && <p><span className="font-semibold text-slate-400">City:</span> {selectedUser.city}</p>}
                                                {selectedUser.address && <p><span className="font-semibold text-slate-400">Address:</span> {selectedUser.address}</p>}
                                            </div>
                                        )}
                                    </div>
                                    {selectedUser.Stats?.[0] && (
                                        <div className="text-right text-sm text-gray-500">
                                            <p>Events Attended: <strong className="text-primary">{selectedUser.Stats[0].eventsAttended || 0}</strong></p>
                                            <p>Points: <strong className="text-primary">{selectedUser.Stats[0].points || 0}</strong></p>
                                        </div>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1 overflow-y-auto p-6 space-y-8">
                                {isFetchingActivity ? (
                                    <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
                                ) : (
                                    <>
                                        {/* Bookings Overview */}
                                        <section>
                                            <h3 className="font-bold text-lg mb-3 flex items-center gap-2">Event Bookings <span className="text-sm bg-gray-100 px-2 py-0.5 rounded-full text-gray-600">{userActivity.bookings.length}</span></h3>
                                            {userActivity.bookings.length === 0 ? <p className="text-sm text-gray-500 italic">No event bookings yet.</p> : (
                                                <div className="grid gap-2">
                                                    {userActivity.bookings.map((b: any) => (
                                                        <div key={b.id} className="text-sm p-3 bg-slate-50 border rounded-md flex justify-between items-center">
                                                            <div>
                                                                <p className="font-medium text-primary">{b.Event?.title}</p>
                                                                <p className="text-xs text-gray-500">Category: {b.category}</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="font-bold">{formatKES(b.amountPaid)}</p>
                                                                <span className={cn(
                                                                    "text-[10px] px-2 py-0.5 rounded-full uppercase",
                                                                    b.status === 'CONFIRMED' ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                                                                )}>{b.status}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </section>

                                        {/* Applications Overview */}
                                        <section>
                                            <h3 className="font-bold text-lg mb-3 flex items-center gap-2">Applications <span className="text-sm bg-gray-100 px-2 py-0.5 rounded-full text-gray-600">{userActivity.applications.length}</span></h3>
                                            {userActivity.applications.length === 0 ? <p className="text-sm text-gray-500 italic">No applications submitted.</p> : (
                                                <div className="grid gap-2">
                                                    {userActivity.applications.map((a: any) => (
                                                        <div key={a.id} className="text-sm p-3 bg-slate-50 border rounded-md">
                                                            <div className="flex justify-between items-center mb-1">
                                                                <span className="font-bold text-primary">{a.type}</span>
                                                                <span className={cn(
                                                                    "text-[10px] px-2 py-0.5 rounded-full uppercase",
                                                                    a.status === 'APPROVED' ? "bg-green-100 text-green-700" :
                                                                        a.status === 'REJECTED' ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"
                                                                )}>{a.status}</span>
                                                            </div>
                                                            <p className="text-xs text-gray-600 line-clamp-2">{a.description}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </section>

                                        {/* Proposals Overview */}
                                        <section>
                                            <h3 className="font-bold text-lg mb-3 flex items-center gap-2">Proposals <span className="text-sm bg-gray-100 px-2 py-0.5 rounded-full text-gray-600">{userActivity.proposals.length}</span></h3>
                                            {userActivity.proposals.length === 0 ? <p className="text-sm text-gray-500 italic">No proposals submitted.</p> : (
                                                <div className="grid gap-2">
                                                    {userActivity.proposals.map((p: any) => (
                                                        <div key={p.id} className="text-sm p-3 bg-slate-50 border rounded-md">
                                                            <div className="flex justify-between items-center mb-1">
                                                                <span className="font-medium">{p.Event?.title}</span>
                                                                <span className={cn(
                                                                    "text-[10px] px-2 py-0.5 rounded-full uppercase",
                                                                    p.status === 'APPROVED' ? "bg-green-100 text-green-700" :
                                                                        p.status === 'REJECTED' ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"
                                                                )}>{p.status}</span>
                                                            </div>
                                                            <p className="text-xs text-gray-600 line-clamp-1">{p.description}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </section>

                                        {/* Visa Requests Overview */}
                                        <section>
                                            <h3 className="font-bold text-lg mb-3 flex items-center gap-2">Visa Requests <span className="text-sm bg-gray-100 px-2 py-0.5 rounded-full text-gray-600">{userActivity.visaRequests.length}</span></h3>
                                            {userActivity.visaRequests.length === 0 ? <p className="text-sm text-gray-500 italic">No visa requests.</p> : (
                                                <div className="grid gap-2">
                                                    {userActivity.visaRequests.map((v: any) => (
                                                        <div key={v.id} className="text-sm p-3 bg-slate-50 border rounded-md flex justify-between items-center">
                                                            <span className="font-medium text-primary">{v.Event?.title}</span>
                                                            <span className={cn(
                                                                "text-[10px] px-2 py-0.5 rounded-full uppercase font-bold",
                                                                v.status === 'APPROVED' ? "text-green-600" : "text-yellow-600"
                                                            )}>{v.status}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </section>
                                    </>
                                )}
                            </CardContent>
                        </>
                    )}
                </Card>
            </div>
        </div>
    );
}

function VisaInvitationManager() {
    const [requests, setRequests] = useState<VisaInvitation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        const { data, error } = await supabase
            .from('VisaInvitation')
            .select('*, User(*), Event(*)')
            .order('createdAt', { ascending: false });

        if (!error) setRequests(data || []);
        setIsLoading(false);
    };

    const handleUploadLetter = async (requestId: string, file: File) => {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${requestId}.${fileExt}`;
            const filePath = `visa-letters/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('visa-documents')
                .upload(filePath, file, { upsert: true });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('visa-documents')
                .getPublicUrl(filePath);

            const { error: updateError } = await supabase
                .from('VisaInvitation')
                .update({
                    letterUrl: publicUrl,
                    status: 'APPROVED'
                })
                .eq('id', requestId);

            if (updateError) throw updateError;

            toast({ title: "Letter uploaded and request approved!" });
            fetchRequests();
        } catch (error: any) {
            toast({ title: "Upload failed", description: error.message, variant: "destructive" });
        }
    };

    if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-primary mb-4">Visa Invitation Requests</h2>
            {requests.length === 0 ? (
                <p className="text-gray-500 italic">No visa requests found.</p>
            ) : (
                <div className="grid gap-4">
                    {requests.map(req => (
                        <Card key={req.id}>
                            <CardContent className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-bold">{req.user?.name}</h3>
                                        <span className={cn(
                                            "text-[10px] px-2 py-0.5 rounded-full font-bold",
                                            req.status === 'PAID' ? "bg-blue-100 text-blue-700" :
                                                req.status === 'APPROVED' ? "bg-green-100 text-green-700" :
                                                    "bg-gray-100 text-gray-700"
                                        )}>
                                            {req.status}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500">{req.user?.email}</p>
                                    {(req.user?.phone || req.user?.country || req.user?.city || req.user?.address) && (
                                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600 my-2 bg-slate-50 p-2 rounded border">
                                            {req.user?.phone && <span><strong className="text-slate-400">Phone:</strong> {req.user.phone}</span>}
                                            {req.user?.country && <span><strong className="text-slate-400">Country:</strong> {req.user.country}</span>}
                                            {req.user?.city && <span><strong className="text-slate-400">City:</strong> {req.user.city}</span>}
                                            {req.user?.address && <span><strong className="text-slate-400">Address:</strong> {req.user.address}</span>}
                                        </div>
                                    )}
                                    <div className="flex flex-wrap gap-4 text-xs mt-2 items-center">
                                        <p className="text-primary font-medium">Event: {req.event?.title}</p>
                                        <p className="bg-slate-100 px-2 py-1 rounded">Payment: <strong className={req.paymentStatus === 'PAID' ? "text-green-600" : "text-yellow-600"}>{req.paymentStatus === 'PAID' ? 'COMPLETED' : 'PENDING'}</strong></p>
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-1">Date: {format(new Date(req.createdAt), 'PPP')}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {req.letterUrl ? (
                                        <Button variant="outline" size="sm" asChild>
                                            <a href={req.letterUrl} target="_blank" rel="noreferrer">View Letter</a>
                                        </Button>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="file"
                                                className="hidden"
                                                id={`upload-visa-${req.id}`}
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) handleUploadLetter(req.id, file);
                                                }}
                                            />
                                            <Label
                                                htmlFor={`upload-visa-${req.id}`}
                                                className="h-9 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md cursor-pointer flex items-center text-sm font-medium"
                                            >
                                                <Upload className="h-4 w-4 mr-2" /> Upload Letter
                                            </Label>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

function BlogManager() {
    const [blogs, setBlogs] = useState<any[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();
    const { user } = useAuth();

    useEffect(() => {
        fetchBlogs();
    }, []);

    const fetchBlogs = async () => {
        const { data, error } = await supabase.from('BlogPost').select('*').order('createdAt', { ascending: false });
        if (!error) setBlogs(data || []);
    };

    const onSubmitBlog = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!user) {
            toast({ title: "Session Error", description: "You must be logged in to post.", variant: "destructive" });
            return;
        }
        setIsSubmitting(true);

        const formData = new FormData(e.currentTarget);
        const title = formData.get('title') as string;
        const content = formData.get('content') as string;
        const imageUrl = formData.get('imageUrl') as string;

        try {
            const { error } = await supabase.from('BlogPost').insert({
                title,
                content,
                imageUrl,
                authorId: user.id
            });
            if (error) throw error;

            toast({ title: "Blog posted!" });
            fetchBlogs();
            (e.target as HTMLFormElement).reset();
        } catch (error: any) {
            console.error("[Blog] Post failed:", error);
            toast({
                title: "Post failed",
                description: error.message || "An unexpected error occurred",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const deleteBlog = async (id: string) => {
        if (!confirm("Delete post?")) return;
        const { error } = await supabase.from('BlogPost').delete().eq('id', id);
        if (!error) {
            toast({ title: "Deleted" });
            fetchBlogs();
        }
    };

    return (
        <>
            <Card className="lg:col-span-1">
                <CardHeader><CardTitle>Create Post</CardTitle></CardHeader>
                <CardContent>
                    <form onSubmit={onSubmitBlog} className="space-y-4">
                        <Input name="title" placeholder="Title" required />
                        <Input name="imageUrl" placeholder="Image URL (e.g. from Unsplash)" />
                        <Textarea name="content" className="min-h-[200px]" placeholder="Content..." required />
                        <Button type="submit" disabled={isSubmitting} className="w-full">Post Blog</Button>
                    </form>
                </CardContent>
            </Card>
            <div className="lg:col-span-2 space-y-4">
                {blogs.map(blog => (
                    <Card key={blog.id}>
                        <CardContent className="p-4 flex justify-between items-center">
                            <div>
                                <h3 className="font-bold">{blog.title}</h3>
                                <p className="text-sm text-gray-500">{format(new Date(blog.createdAt), 'PPP')}</p>
                            </div>
                            <Button variant="ghost" className="text-red-500" onClick={() => deleteBlog(blog.id)}><Trash2 className="h-4 w-4" /></Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </>
    );
}

function ProposalManager() {
    const [proposals, setProposals] = useState<any[]>([]);
    const { toast } = useToast();

    useEffect(() => {
        fetchProposals();
    }, []);

    const fetchProposals = async () => {
        const { data, error } = await supabase
            .from('Proposals')
            .select('*, User(*), Event(*)')
            .order('createdAt', { ascending: false });

        if (error) {
            console.error("Error fetching proposals:", error);
            return;
        }

        // Lazy auto-approval check
        const now = new Date();
        const updates: any[] = [];
        const processedData = data.map(p => {
            if (p.status === 'PENDING' && p.autoApproveAt && new Date(p.autoApproveAt) < now) {
                updates.push(supabase.from('Proposals').update({ status: 'APPROVED' }).eq('id', p.id));
                return { ...p, status: 'APPROVED' };
            }
            return p;
        });

        if (updates.length > 0) {
            await Promise.all(updates);
            toast({ title: "Auto-approved proposals", description: `${updates.length} pending proposals were auto-approved due to time limit.` });
        }

        setProposals(processedData);
    };

    const updateStatus = async (id: string, status: string) => {
        const { error } = await supabase.from('Proposals').update({ status }).eq('id', id);
        if (error) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } else {
            toast({ title: "Status updated" });
            fetchProposals();
        }
    };

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-primary mb-4">Event Proposals</h2>
            <div className="grid gap-4">
                {proposals.map(p => (
                    <Card key={p.id}>
                        <CardContent className="p-4 flex flex-col md:flex-row justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-bold">{p.User?.name}</h3>
                                    <span className={cn(
                                        "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase",
                                        p.status === 'APPROVED' ? "bg-green-100 text-green-700" :
                                            p.status === 'REJECTED' ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"
                                    )}>{p.status}</span>
                                </div>
                                <p className="text-sm text-gray-500 mb-2">{p.User?.email} • Event: {p.Event?.title}</p>
                                <p className="text-sm bg-slate-50 p-2 rounded border">{p.description}</p>
                                <div className="mt-2 flex items-center">
                                    <span className="text-xs bg-slate-100 px-2 py-1 rounded text-gray-600">Payment: <strong className="text-gray-500">N/A (Free Submission)</strong></span>
                                </div>
                                {p.documentUrl && (
                                    <a href={p.documentUrl} target="_blank" rel="noreferrer" className="text-xs text-primary underline mt-2 block">View Document</a>
                                )}
                            </div>
                            {p.status === 'PENDING' && (
                                <div className="flex flex-col gap-2 justify-center min-w-[120px]">
                                    <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => updateStatus(p.id, 'APPROVED')}>Approve</Button>
                                    <Button size="sm" variant="destructive" onClick={() => updateStatus(p.id, 'REJECTED')}>Reject</Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
                {proposals.length === 0 && <p className="text-slate-500 italic">No proposals found.</p>}
            </div>
        </div>
    );
}

function BookingManager() {
    const { user } = useAuth();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [filterQuery, setFilterQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('Booking')
            .select('*, Event(*), User:userId(*)')
            .order('createdAt', { ascending: false });

        if (error) {
            toast({ title: "Error fetching bookings", description: error.message, variant: "destructive" });
        } else {
            setBookings(data || []);
        }
        setIsLoading(false);
    };

    const updateBookingStatus = async (id: string, status: string) => {
        const payload: Record<string, any> = {
            status,
            updatedAt: new Date().toISOString()
        };
        if (status === 'CONFIRMED') {
            payload.paymentStatus = 'PAID';
        } else if (status === 'CANCELLED') {
            payload.paymentStatus = 'UNPAID';
        }

        const { error } = await supabase
            .from('Booking')
            .update(payload)
            .eq('id', id);

        if (error) {
            toast({ title: "Error updating status", description: error.message, variant: "destructive" });
        } else {
            toast({ title: `Booking ${status.toLowerCase()} successfully` });
            fetchBookings();
        }
    };

    const filteredBookings = bookings.filter(b => {
        if (!filterQuery.trim()) return true;
        const q = filterQuery.toLowerCase();
        return (
            b.id.toLowerCase().includes(q) ||
            b.user?.name?.toLowerCase().includes(q) ||
            b.user?.email?.toLowerCase().includes(q) ||
            b.event?.title?.toLowerCase().includes(q) ||
            b.category?.toLowerCase().includes(q) ||
            b.institutionName?.toLowerCase().includes(q)
        );
    });

    if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <div>
                    <h2 className="text-xl font-bold text-primary">Event Bookings & Passes</h2>
                    <p className="text-xs text-muted-foreground">Manage attendee registrations, entry passes, and online payments</p>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Filter by attendee, school, ID..."
                            value={filterQuery}
                            onChange={(e) => setFilterQuery(e.target.value)}
                            className="pl-9 h-9 text-xs rounded-xl"
                        />
                    </div>
                    <Button asChild size="sm" className="gap-2 rounded-xl bg-gradient-to-r from-primary to-indigo-600 text-white font-semibold">
                        <a href="/verify-ticket" target="_blank" rel="noopener noreferrer">
                            <QrCode className="h-4 w-4" />
                            Scan / Verify Ticket
                        </a>
                    </Button>
                </div>
            </div>

            <div className="grid gap-4">
                {filteredBookings.map(booking => {
                    const isConfirmed = booking.status === 'CONFIRMED';
                    const isMpesa = booking.paymentMethod === 'MPESA';

                    return (
                        <Card key={booking.id} className="rounded-2xl">
                            <CardContent className="p-4 flex flex-col md:flex-row justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <h3 className="font-bold">{booking.user?.name}</h3>
                                        <span className={cn(
                                            "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase",
                                            isConfirmed
                                                ? "bg-green-100 text-green-700"
                                                : booking.status === 'CANCELLED'
                                                ? "bg-red-100 text-red-700"
                                                : "bg-yellow-100 text-yellow-700"
                                        )}>
                                            {booking.status}
                                        </span>
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold">
                                            {booking.mode}
                                        </span>
                                        {isMpesa && (
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                                                M-PESA {booking.mpesaReceiptNumber ? `(${booking.mpesaReceiptNumber})` : ''}
                                            </span>
                                        )}
                                        {booking.checkedIn && (
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                                                ✓ Checked-In
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-500 mb-2">{booking.user?.email} • Event: {booking.event?.title}</p>

                                    {/* Institution Info */}
                                    {(booking.institutionName || booking.user?.institutionName) && (
                                        <div className="flex items-center gap-2 text-xs text-indigo-900 bg-indigo-50/70 p-2 rounded-xl border border-indigo-100 mb-2">
                                            <GraduationCap className="h-4 w-4 text-indigo-600 flex-shrink-0" />
                                            <span>
                                                <strong>School:</strong> {booking.institutionName || booking.user?.institutionName}
                                                {(booking.headAdminName || booking.user?.headAdminName) && ` • Admin: ${booking.headAdminName || booking.user?.headAdminName}`}
                                                {(booking.institutionContact || booking.user?.institutionContact) && ` • Contact: ${booking.institutionContact || booking.user?.institutionContact}`}
                                            </span>
                                        </div>
                                    )}

                                    {/* Selected Location & Attendee Age */}
                                    {(booking.selectedLocation || booking.attendeeAge !== undefined) && (
                                        <div className="flex flex-wrap items-center gap-3 text-xs bg-slate-50 p-2 rounded-xl border border-slate-200 mb-2">
                                            {booking.selectedLocation && (
                                                <span className="flex items-center gap-1 font-semibold text-primary">
                                                    <MapPin className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                                                    Attending Venue: <strong>{booking.selectedLocation}</strong>
                                                </span>
                                            )}
                                            {booking.attendeeAge !== undefined && (
                                                <span className="flex items-center gap-1 text-slate-700">
                                                    <Users className="h-3.5 w-3.5 text-slate-500 flex-shrink-0" />
                                                    Age: <strong>{booking.attendeeAge} years</strong>
                                                    {booking.guardianName && ` (Guardian: ${booking.guardianName}${booking.guardianPhone ? ` - ${booking.guardianPhone}` : ''})`}
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    <div className="flex flex-wrap gap-4 text-xs items-center mt-2">
                                        <span className="text-gray-500">Category: <strong>{booking.category}</strong></span>
                                        <span className="text-gray-500">Amount: <strong>{formatKES(booking.amountPaid)}</strong></span>
                                        <span className="bg-slate-100 px-2 py-1 rounded text-gray-600">
                                            Method: <strong>{booking.paymentMethod || 'ONLINE'}</strong>
                                        </span>
                                        <span className="text-gray-400 text-[10px]">Date: {format(new Date(booking.createdAt), 'PPP')}</span>
                                    </div>
                                </div>

                                <div className="flex flex-row md:flex-col gap-2 justify-center min-w-[140px]">
                                    {booking.status === 'PENDING' && (
                                        <Button size="sm" variant="outline" className="text-green-600 hover:text-green-700" onClick={() => updateBookingStatus(booking.id, 'CONFIRMED')}>Confirm</Button>
                                    )}
                                    {booking.status !== 'CANCELLED' && (
                                        <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700" onClick={() => updateBookingStatus(booking.id, 'CANCELLED')}>Cancel</Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
                {bookings.length === 0 && <p className="text-slate-500 italic">No bookings found.</p>}
            </div>
        </div>
    );
}

function SupportManager() {
    const { user, profile } = useAuth();
    const { toast } = useToast();
    const [conversations, setConversations] = useState<any[]>([]);
    const [selectedConv, setSelectedConv] = useState<any | null>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [replyText, setReplyText] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [filterStatus, setFilterStatus] = useState<'ALL' | 'OPEN' | 'RESOLVED'>('ALL');

    useEffect(() => {
        fetchConversations();
    }, []);

    const fetchConversations = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('SupportConversation')
            .select('*, user:userId(*)')
            .order('lastMessageAt', { ascending: false });

        if (error) {
            toast({ title: "Error fetching support chats", description: error.message, variant: "destructive" });
        } else {
            setConversations(data || []);
            if (!selectedConv && data && data.length > 0) {
                selectConversation(data[0]);
            }
        }
        setIsLoading(false);
    };

    const selectConversation = async (conv: any) => {
        setSelectedConv(conv);
        const { data, error } = await supabase
            .from('SupportMessage')
            .select('*')
            .eq('conversationId', conv.id)
            .order('createdAt', { ascending: true });

        if (!error) {
            setMessages(data || []);
        }
    };

    useEffect(() => {
        if (!selectedConv) return;
        const channel = supabase
            .channel(`admin_chat_${selectedConv.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'SupportMessage',
                    filter: `conversationId=eq.${selectedConv.id}`
                },
                (payload) => {
                    const newMsg = payload.new;
                    setMessages((prev) => {
                        if (prev.some((m) => m.id === newMsg.id)) return prev;
                        return [...prev, newMsg];
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [selectedConv?.id]);

    const handleSendReply = async () => {
        if (!replyText.trim() || !selectedConv || isSending) return;
        setIsSending(true);

        try {
            const senderName = profile?.name || user?.email?.split('@')[0] || "Support Admin";
            const { data, error } = await supabase
                .from('SupportMessage')
                .insert({
                    conversationId: selectedConv.id,
                    senderId: user?.id,
                    senderRole: 'ADMIN',
                    senderName: senderName,
                    message: replyText.trim(),
                    isRead: false
                })
                .select()
                .single();

            if (error) throw error;

            if (data) {
                setMessages((prev) => [...prev, data]);
            }

            await supabase
                .from('SupportConversation')
                .update({ lastMessageAt: new Date().toISOString(), status: 'OPEN' })
                .eq('id', selectedConv.id);

            setReplyText("");
        } catch (err: any) {
            toast({ title: "Failed to send reply", description: err.message, variant: "destructive" });
        } finally {
            setIsSending(false);
        }
    };

    const handleToggleStatus = async (status: 'OPEN' | 'RESOLVED') => {
        if (!selectedConv) return;
        const { error } = await supabase
            .from('SupportConversation')
            .update({ status, updatedAt: new Date().toISOString() })
            .eq('id', selectedConv.id);

        if (!error) {
            setSelectedConv({ ...selectedConv, status });
            fetchConversations();
            toast({ title: `Conversation marked as ${status.toLowerCase()}` });
        }
    };

    const filteredConversations = conversations.filter(c => {
        if (filterStatus === 'ALL') return true;
        return c.status === filterStatus;
    });

    if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h2 className="text-xl font-bold text-primary">Live Support & Help Desk</h2>
                    <p className="text-xs text-muted-foreground">Respond to attendee live chat inquiries in real-time</p>
                </div>
                <div className="flex gap-2">
                    {(['ALL', 'OPEN', 'RESOLVED'] as const).map((s) => (
                        <Button
                            key={s}
                            size="sm"
                            variant={filterStatus === s ? 'default' : 'outline'}
                            onClick={() => setFilterStatus(s)}
                            className="rounded-xl text-xs"
                        >
                            {s}
                        </Button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[550px] border rounded-3xl overflow-hidden bg-card">
                <div className="border-r overflow-y-auto p-3 space-y-2">
                    {filteredConversations.map((conv) => {
                        const isSelected = selectedConv?.id === conv.id;
                        return (
                            <div
                                key={conv.id}
                                onClick={() => selectConversation(conv)}
                                className={cn(
                                    "p-3 rounded-2xl cursor-pointer transition-all border",
                                    isSelected
                                        ? "bg-primary/10 border-primary shadow-sm"
                                        : "hover:bg-muted/50 border-transparent"
                                )}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className="font-bold text-xs truncate max-w-[150px]">
                                        {conv.user?.name || conv.guestName || "Guest User"}
                                    </h4>
                                    <span className={cn(
                                        "text-[9px] px-2 py-0.5 rounded-full font-bold uppercase",
                                        conv.status === 'OPEN' ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                                    )}>
                                        {conv.status}
                                    </span>
                                </div>
                                <p className="text-[11px] text-muted-foreground truncate">
                                    {conv.user?.email || conv.guestEmail || (conv.userId ? "Registered User" : "Visitor")}
                                </p>
                                <p className="text-[10px] text-slate-400 mt-1">
                                    {conv.lastMessageAt ? format(new Date(conv.lastMessageAt), "PP p") : ""}
                                </p>
                            </div>
                        );
                    })}
                    {filteredConversations.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-10">No support chats found.</p>
                    )}
                </div>

                <div className="md:col-span-2 flex flex-col justify-between h-full bg-slate-50/50 dark:bg-slate-900/50">
                    {selectedConv ? (
                        <>
                            <div className="p-4 border-b flex justify-between items-center bg-card">
                                <div>
                                    <h3 className="font-bold text-sm">
                                        {selectedConv.user?.name || selectedConv.guestName || "Guest User"}
                                    </h3>
                                    <p className="text-xs text-muted-foreground">
                                        {selectedConv.user?.email || selectedConv.guestEmail || "Guest Session"} • Status: <strong>{selectedConv.status}</strong>
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    {selectedConv.status === 'OPEN' ? (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleToggleStatus('RESOLVED')}
                                            className="text-xs rounded-xl"
                                        >
                                            Mark Resolved
                                        </Button>
                                    ) : (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleToggleStatus('OPEN')}
                                            className="text-xs rounded-xl"
                                        >
                                            Re-open Chat
                                        </Button>
                                    )}
                                </div>
                            </div>

                            <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
                                {messages.map((m) => {
                                    const isAdmin = m.senderRole === 'ADMIN';
                                    return (
                                        <div
                                            key={m.id}
                                            className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}
                                        >
                                            <div className="text-[10px] text-muted-foreground mb-0.5">
                                                {m.senderName} ({m.senderRole})
                                            </div>
                                            <div
                                                className={`p-3 rounded-2xl max-w-[80%] leading-relaxed ${
                                                    isAdmin
                                                        ? 'bg-primary text-primary-foreground rounded-br-sm'
                                                        : 'bg-card border text-foreground rounded-bl-sm shadow-sm'
                                                }`}
                                            >
                                                <p className="break-words">{m.message}</p>
                                                <div className={`text-[9px] mt-1 text-right ${isAdmin ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                                                    {m.createdAt ? format(new Date(m.createdAt), "p") : ""}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                {messages.length === 0 && (
                                    <p className="text-xs text-muted-foreground text-center py-20">No messages yet in this session.</p>
                                )}
                            </div>

                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    handleSendReply();
                                }}
                                className="p-3 border-t bg-card flex gap-2"
                            >
                                <Input
                                    placeholder="Type official reply to attendee..."
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    className="rounded-xl text-xs h-10"
                                />
                                <Button
                                    type="submit"
                                    disabled={!replyText.trim() || isSending}
                                    className="rounded-xl h-10 px-4 text-xs font-semibold gap-1.5"
                                >
                                    <Send className="h-4 w-4" />
                                    Reply
                                </Button>
                            </form>
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
                            Select a support conversation from the sidebar to view messages.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function ApplicationManager() {
    const [applications, setApplications] = useState<any[]>([]);
    const { toast } = useToast();

    useEffect(() => {
        fetchApps();
    }, []);

    const fetchApps = async () => {
        const { data, error } = await supabase
            .from('Applications')
            .select('*, User(*)')
            .order('createdAt', { ascending: false });
        if (!error) setApplications(data || []);
    };

    const updateStatus = async (id: string, status: string) => {
        const { error } = await supabase.from('Applications').update({ status }).eq('id', id);
        if (error) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } else {
            toast({ title: "Status updated" });
            fetchApps();
        }
    };

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-primary mb-4">Speaker & Sponsor Applications</h2>
            <div className="grid gap-4">
                {applications.map(app => (
                    <Card key={app.id}>
                        <CardContent className="p-4 flex flex-col md:flex-row justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-bold">{app.User?.name}</h3>
                                    <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">{app.type}</span>
                                    <span className={cn(
                                        "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase",
                                        app.status === 'APPROVED' ? "bg-green-100 text-green-700" :
                                            app.status === 'REJECTED' ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"
                                    )}>{app.status}</span>
                                </div>
                                <p className="text-sm text-gray-500 mb-2">{app.User?.email}</p>
                                <p className="text-sm bg-slate-50 p-2 rounded border mb-2">{app.description}</p>
                                <div className="flex flex-wrap gap-4 text-xs items-center mt-2 mb-2">
                                    <span className="text-gray-500">Donation: <strong>{formatKES(app.donationAmount)}</strong></span>
                                    <span className="bg-slate-100 px-2 py-1 rounded text-gray-600">Payment: <strong className={app.paymentStatus === 'PAID' ? "text-green-600" : "text-yellow-600"}>{app.paymentStatus === 'PAID' ? 'COMPLETED' : 'PENDING'}</strong></span>
                                </div>
                                {app.documentUrl && (
                                    <a href={app.documentUrl} target="_blank" rel="noreferrer" className="text-xs text-primary underline mt-2 block">View Document</a>
                                )}
                            </div>
                            {app.status === 'PENDING' && (
                                <div className="flex flex-col gap-2 justify-center min-w-[120px]">
                                    <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => updateStatus(app.id, 'APPROVED')}>Approve</Button>
                                    <Button size="sm" variant="destructive" onClick={() => updateStatus(app.id, 'REJECTED')}>Reject</Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
                {applications.length === 0 && <p className="text-slate-500 italic">No applications found.</p>}
            </div>
        </div>
    );
}

export default function AdminDashboard() {
    const { user, profile } = useAuth();
    const { toast } = useToast();
    const [events, setEvents] = useState<Event[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [selectedImages, setSelectedImages] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [heroImageFile, setHeroImageFile] = useState<File | null>(null);
    const [heroImagePreview, setHeroImagePreview] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'events' | 'bookings' | 'blogs' | 'visa' | 'proposals' | 'applications' | 'users' | 'support'>('events');
    const [editingEvent, setEditingEvent] = useState<Event | null>(null);
    const [locations, setLocations] = useState<EventLocation[]>([]);
    const [targetAgeGroup, setTargetAgeGroup] = useState<string>("ALL");
    const [minAge, setMinAge] = useState<number | ''>('');
    const [maxAge, setMaxAge] = useState<number | ''>('');
    const [isChildFocused, setIsChildFocused] = useState<boolean>(false);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const { data, error } = await supabase
                .from('Event')
                .select('*')
                .order('createdAt', { ascending: false });

            if (error) throw error;
            setEvents(data || []);
        } catch (error: any) {
            toast({ title: "Error fetching events", description: error.message, variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            setSelectedImages(prev => [...prev, ...files]);

            const newPreviews = files.map(file => URL.createObjectURL(file));
            setImagePreviews(prev => [...prev, ...newPreviews]);
        }
    };

    const removeImage = (index: number) => {
        setSelectedImages(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const uploadSingleImage = async (file: File, folder: string = "events"): Promise<string> => {
        console.log(`[Upload] Starting upload for ${file.name} to ${folder}...`);
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${folder}/${fileName}`;

        // Add a 30s timeout to prevent infinite hangs
        const uploadPromise = supabase.storage
            .from('event-media')
            .upload(filePath, file);

        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`Upload timed out for ${file.name}`)), 30000)
        );

        const { error: uploadError } = await Promise.race([uploadPromise, timeoutPromise]) as any;

        if (uploadError) {
            console.error(`[Upload] Error uploading ${file.name}:`, uploadError);
            throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
            .from('event-media')
            .getPublicUrl(filePath);

        console.log(`[Upload] Successfully uploaded ${file.name}. URL: ${publicUrl}`);
        return publicUrl;
    };

    const uploadImages = async (): Promise<string[]> => {
        const urls: string[] = [];
        if (selectedImages.length === 0) {
            console.log("[Upload] No gallery images selected.");
            return [];
        }

        if (selectedImages.length > 10) {
            const msg = "Maximum 10 gallery images allowed.";
            console.warn(`[Upload] ${msg}`);
            toast({ title: "Upload limit", description: msg, variant: "destructive" });
            throw new Error(msg);
        }

        console.log(`[Upload] Starting parallel upload for ${selectedImages.length} gallery images...`);
        setUploading(true);
        try {
            const uploadPromises = selectedImages.map(file => uploadSingleImage(file, "events"));
            const results = await Promise.all(uploadPromises);
            urls.push(...results);
            console.log("[Upload] Parallel batch upload completed successfully.");
        } catch (error: any) {
            console.error("[Upload] Batch upload failed:", error);
            // Even if one fails, we might still have some URLs if we used Promise.allSettled, 
            // but for consistency we fail the whole batch if any single upload fails.
            toast({ title: "Upload failed", description: error.message, variant: "destructive" });
            throw error;
        } finally {
            setUploading(false);
        }
        return urls;
    };

    const [activities, setActivities] = useState<any[]>([]);
    const [speakers, setSpeakers] = useState<any[]>([]);
    const [faqs, setFaqs] = useState<any[]>([]);
    const [features, setFeatures] = useState<string[]>([]);
    const [benefits, setBenefits] = useState<any[]>([]);
    const [alignment, setAlignment] = useState({ title: "", description: "" });
    const [journey, setJourney] = useState({ arrival: "", expectations: "" });

    const handleEditClick = (event: Event) => {
        setEditingEvent(event);
        setActivities(event.activities || []);
        setSpeakers(event.speakers || []);
        setFaqs(event.faqs || []);
        setFeatures(event.features || []);
        setBenefits(event.benefits || []);
        setAlignment(event.alignment || { title: "", description: "" });
        setJourney(event.journey || { arrival: "", expectations: "" });
        setLocations(event.locations || []);
        setTargetAgeGroup(event.target_age_group || 'ALL');
        setMinAge(event.min_age !== undefined && event.min_age !== null ? event.min_age : '');
        setMaxAge(event.max_age !== undefined && event.max_age !== null ? event.max_age : '');
        setIsChildFocused(!!event.is_child_focused);
        setHeroImagePreview(event.heroImageUrl || null);
        setHeroImageFile(null);

        // Populate standard form fields
        const form = document.querySelector('form') as HTMLFormElement;
        if (form) {
            const titleInput = form.querySelector('#title') as HTMLInputElement;
            const themeInput = form.querySelector('#theme') as HTMLInputElement;
            const dateInput = form.querySelector('#date') as HTMLInputElement;
            const priceInput = form.querySelector('#price') as HTMLInputElement;
            const locationInput = form.querySelector('#location') as HTMLInputElement;
            const descriptionInput = form.querySelector('#description') as HTMLTextAreaElement;
            const selfFundedInput = form.querySelector('#self_funded_seats') as HTMLInputElement;
            const partiallyFundedInput = form.querySelector('#partially_funded_seats') as HTMLInputElement;
            const fullyFundedInput = form.querySelector('#fully_funded_seats') as HTMLInputElement;

            if (titleInput) titleInput.value = event.title;
            if (themeInput) themeInput.value = event.theme || "";
            if (dateInput) dateInput.value = event.date ? new Date(event.date).toISOString().split('T')[0] : "";
            if (priceInput) priceInput.value = event.price?.toString() || "0";
            if (locationInput) locationInput.value = event.location || "";
            if (descriptionInput) descriptionInput.value = event.description || "";
            if (selfFundedInput) selfFundedInput.value = event.self_funded_seats?.toString() || "0";
            if (partiallyFundedInput) partiallyFundedInput.value = event.partially_funded_seats?.toString() || "0";
            if (fullyFundedInput) fullyFundedInput.value = event.fully_funded_seats?.toString() || "0";

            const requiresProposalInput = form.querySelector('#requires_proposal') as HTMLInputElement;
            if (requiresProposalInput) requiresProposalInput.checked = !!event.requires_proposal;

            const typeInput = form.querySelector('#type') as HTMLSelectElement;
            if (typeInput) typeInput.value = event.type || "PHYSICAL";

            const meetingLinkInput = form.querySelector('#meeting_link') as HTMLInputElement;
            if (meetingLinkInput) meetingLinkInput.value = event.meeting_link || "";
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEdit = () => {
        setEditingEvent(null);
        setActivities([]);
        setSpeakers([]);
        setFaqs([]);
        setFeatures([]);
        setBenefits([]);
        setAlignment({ title: "", description: "" });
        setJourney({ arrival: "", expectations: "" });
        setLocations([]);
        setTargetAgeGroup('ALL');
        setMinAge('');
        setMaxAge('');
        setIsChildFocused(false);
        setSelectedImages([]);
        setImagePreviews([]);
        setHeroImageFile(null);
        setHeroImagePreview(null);
        const form = document.querySelector('form') as HTMLFormElement;
        if (form) form.reset();
    };

    const onSubmitEvent = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        console.log("[Submit] Event submission started...");
        setIsSubmitting(true);

        const formData = new FormData(e.currentTarget);
        const title = formData.get('title') as string;
        const theme = formData.get('theme') as string;
        const description = formData.get('description') as string;
        const dateStr = formData.get('date') as string;
        const locationInputVal = (formData.get('location') as string) || '';
        const primaryLocation = locations.length > 0
            ? locations.map(l => l.name).filter(Boolean).join(' | ')
            : locationInputVal;
        const priceStr = formData.get('price') as string;
        const selfFundedSeats = formData.get('self_funded_seats') as string;
        const partiallyFundedSeats = formData.get('partially_funded_seats') as string;
        const fullyFundedSeats = formData.get('fully_funded_seats') as string;
        const requiresProposal = formData.get('requires_proposal') === 'on';
        const type = formData.get('type') as string;
        const meetingLink = formData.get('meeting_link') as string;

        try {
            console.log("[Submit] Validating form data...");
            if (!dateStr) throw new Error("Please select a date for the event.");

            const eventDate = new Date(dateStr);
            if (isNaN(eventDate.getTime())) throw new Error("Invalid date selected.");

            console.log("[Submit] Processing image uploads...");
            setUploading(true);

            let finalHeroImageUrl = editingEvent?.heroImageUrl || "";
            if (heroImageFile) {
                console.log("[Submit] Uploading hero image...");
                try {
                    finalHeroImageUrl = await uploadSingleImage(heroImageFile, "events");
                } catch (err: any) {
                    console.error("[Submit] Hero image upload failed:", err);
                    throw new Error(`Hero image upload failed: ${err.message}`);
                }
            } else if (!editingEvent) {
                throw new Error("A hero image is required for new events.");
            }

            let imageUrls: string[] = [];
            try {
                imageUrls = await uploadImages();
                console.log(`[Submit] Image uploads completed. Count: ${imageUrls.length}`);
            } catch (err: any) {
                console.error("[Submit] Image upload phase failed:", err);
                throw new Error(`Media upload failed: ${err.message}`);
            }

            console.log("[Submit] Processing speaker image uploads...");
            // Upload speaker images
            const speakersWithImages = await Promise.all(speakers.map(async (s, idx) => {
                try {
                    if (s.imageFile) {
                        console.log(`[Submit] Uploading image for speaker ${idx + 1}: ${s.name}`);
                        const url = await uploadSingleImage(s.imageFile, "speakers");
                        const { imageFile, ...rest } = s;
                        return { ...rest, imageUrl: url };
                    }
                    const { imageFile, ...rest } = s;
                    return rest;
                } catch (err: any) {
                    console.error(`[Submit] Speaker ${idx + 1} image upload failed:`, err);
                    throw new Error(`Speaker image upload failed: ${err.message}`);
                }
            }));

            if (editingEvent) {
                console.log("[Submit] Updating event record in Supabase...");
                // Merge images for editing: keep existing if no new ones, or append/replace as logic dictates.
                // For now, we'll keep existing ones and ONLY add new ones if provided.
                const finalImageUrls = imageUrls.length > 0 ? [...(editingEvent.imageUrls || []), ...imageUrls] : (editingEvent.imageUrls || []);

                const { error } = await supabase
                    .from('Event')
                    .update({
                        title,
                        theme,
                        description,
                        date: eventDate.toISOString(),
                        location: primaryLocation || locationInputVal || "TBD",
                        locations,
                        target_age_group: targetAgeGroup,
                        min_age: minAge !== '' ? Number(minAge) : null,
                        max_age: maxAge !== '' ? Number(maxAge) : null,
                        is_child_focused: isChildFocused,
                        price: parseFloat(priceStr) || 0,
                        heroImageUrl: finalHeroImageUrl,
                        imageUrls: finalImageUrls,
                        activities,
                        speakers: speakersWithImages,
                        faqs,
                        features,
                        benefits,
                        alignment,
                        journey,
                        self_funded_seats: parseInt(selfFundedSeats) || 0,
                        partially_funded_seats: parseInt(partiallyFundedSeats) || 0,
                        fully_funded_seats: parseInt(fullyFundedSeats) || 0,
                        requires_proposal: requiresProposal,
                        type: type,
                        meeting_link: meetingLink
                    })
                    .eq('id', editingEvent.id);

                if (error) {
                    console.error("[Submit] Supabase Update Error:", error);
                    throw error;
                }
                toast({ title: "Event updated successfully!" });
            } else {
                console.log("[Submit] Inserting event record into Supabase...");
                const { error } = await supabase
                    .from('Event')
                    .insert({
                        title,
                        theme,
                        description,
                        date: eventDate.toISOString(),
                        location: primaryLocation || locationInputVal || "TBD",
                        locations,
                        target_age_group: targetAgeGroup,
                        min_age: minAge !== '' ? Number(minAge) : null,
                        max_age: maxAge !== '' ? Number(maxAge) : null,
                        is_child_focused: isChildFocused,
                        price: parseFloat(priceStr) || 0,
                        heroImageUrl: finalHeroImageUrl,
                        imageUrls: imageUrls,
                        activities,
                        speakers: speakersWithImages,
                        faqs,
                        features,
                        benefits,
                        alignment,
                        journey,
                        self_funded_seats: parseInt(selfFundedSeats) || 0,
                        partially_funded_seats: parseInt(partiallyFundedSeats) || 0,
                        fully_funded_seats: parseInt(fullyFundedSeats) || 0,
                        requires_proposal: requiresProposal,
                        type: type,
                        meeting_link: meetingLink
                    });

                if (error) {
                    console.error("[Submit] Supabase Insert Error:", error);
                    throw error;
                }
                toast({ title: "Event created successfully!" });
            }

            console.log("[Submit] Success! Refreshing list...");
            await fetchEvents();

            console.log("[Submit] Resetting form state...");
            (e.target as HTMLFormElement).reset();
            setEditingEvent(null);
            setSelectedImages([]);
            setImagePreviews([]);
            setHeroImageFile(null);
            setHeroImagePreview(null);
            setActivities([]);
            setSpeakers([]);
            setFaqs([]);
            setFeatures([]);
            setBenefits([]);
            setAlignment({ title: "", description: "" });
            setJourney({ arrival: "", expectations: "" });
            setLocations([]);
            setTargetAgeGroup('ALL');
            setMinAge('');
            setMaxAge('');
            setIsChildFocused(false);
            console.log("[Submit] Form submission completed successfully.");
        } catch (error: any) {
            console.error("[Submit] Error during event creation:", error);
            toast({
                title: "Error creating event",
                description: error.message || "An unexpected error occurred",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
            setUploading(false);
            console.log("[Submit] isSubmitting and uploading states reset.");
        }
    };

    const deleteEvent = async (id: string) => {
        if (!confirm("Are you sure you want to delete this event?")) return;

        try {
            const { error } = await supabase
                .from('Event')
                .delete()
                .eq('id', id);

            if (error) throw error;
            toast({ title: "Event deleted" });
            fetchEvents();
        } catch (error: any) {
            toast({ title: "Error deleting event", description: error.message, variant: "destructive" });
        }
    };

    if (isLoading) {
        return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin h-8 w-8" /></div>;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-primary">Admin Dashboard</h1>
                <div className="flex space-x-2">
                    <Button
                        variant={activeTab === 'events' ? 'default' : 'outline'}
                        onClick={() => setActiveTab('events')}
                    >
                        Events
                    </Button>
                    <Button
                        variant={activeTab === 'bookings' ? 'default' : 'outline'}
                        onClick={() => setActiveTab('bookings')}
                    >
                        Bookings
                    </Button>
                    <Button
                        variant={activeTab === 'blogs' ? 'default' : 'outline'}
                        onClick={() => setActiveTab('blogs')}
                    >
                        Blogs
                    </Button>
                    <Button
                        variant={activeTab === 'visa' ? 'default' : 'outline'}
                        onClick={() => setActiveTab('visa')}
                    >
                        Visa Requests
                    </Button>
                    <Button
                        variant={activeTab === 'proposals' ? 'default' : 'outline'}
                        onClick={() => setActiveTab('proposals')}
                    >
                        Proposals
                    </Button>
                    <Button
                        variant={activeTab === 'applications' ? 'default' : 'outline'}
                        onClick={() => setActiveTab('applications')}
                    >
                        Applications
                    </Button>
                    <Button
                        variant={activeTab === 'users' ? 'default' : 'outline'}
                        onClick={() => setActiveTab('users')}
                    >
                        Users
                    </Button>
                    <Button
                        variant={activeTab === 'support' ? 'default' : 'outline'}
                        onClick={() => setActiveTab('support')}
                        className="gap-1.5"
                    >
                        <MessageCircle className="h-4 w-4" />
                        Live Support
                    </Button>
                </div>
            </div>

            {activeTab === 'proposals' && <ProposalManager />}
            {activeTab === 'applications' && <ApplicationManager />}
            {activeTab === 'users' && <UserManager />}
            {activeTab === 'bookings' && <BookingManager />}
            {activeTab === 'support' && <SupportManager />}


            {activeTab === 'events' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Event Form */}
                    <Card className="lg:col-span-1">
                        <CardHeader>
                            <CardTitle>{editingEvent ? "Edit Event" : "Create New Event"}</CardTitle>
                            <CardDescription>
                                {editingEvent ? `Modifying: ${editingEvent.title}` : "Add a past or upcoming event to the gallery."}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={onSubmitEvent} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Event Title</Label>
                                    <Input id="title" name="title" required placeholder="Global Education & Tech Summit" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="theme">Event Theme</Label>
                                    <Input id="theme" name="theme" placeholder="Climate Action & Sustainability" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="date">Date</Label>
                                        <Input id="date" name="date" type="date" required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="price">Price ($)</Label>
                                        <Input id="price" name="price" type="number" step="0.01" placeholder="0.00" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="type">Event Type</Label>
                                        <select
                                            id="type"
                                            name="type"
                                            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            defaultValue="PHYSICAL"
                                        >
                                            <option value="PHYSICAL">Physical Only</option>
                                            <option value="VIRTUAL">Virtual Only</option>
                                            <option value="BOTH">Both Physical & Virtual</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="meeting_link">Meeting/Virtual Link</Label>
                                        <Input id="meeting_link" name="meeting_link" placeholder="Zoom/Google Meet link" />
                                    </div>
                                </div>

                                <div className="flex items-center space-x-2 py-2">
                                    <input
                                        type="checkbox"
                                        id="requires_proposal"
                                        name="requires_proposal"
                                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary"
                                    />
                                    <Label htmlFor="requires_proposal" className="cursor-pointer">Requires Proposal Submission</Label>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="self_funded_seats">Self Funded Seats</Label>
                                        <Input id="self_funded_seats" name="self_funded_seats" type="number" defaultValue="0" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="partially_funded_seats">Partially Funded Seats</Label>
                                        <Input id="partially_funded_seats" name="partially_funded_seats" type="number" defaultValue="0" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="fully_funded_seats">Fully Funded Seats</Label>
                                        <Input id="fully_funded_seats" name="fully_funded_seats" type="number" defaultValue="0" />
                                    </div>
                                </div>

                                <div className="space-y-4 border-t pt-4">
                                    <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Admission Benefits</h3>
                                    <Button type="button" variant="outline" size="sm" onClick={() => setBenefits([...benefits, { category: 'SELF_FUNDED', description: "" }])}>
                                        Add Benefit
                                    </Button>
                                    {benefits.map((b, idx) => (
                                        <Card key={idx} className="p-4 space-y-3 bg-muted/20 border-primary/10">
                                            <div className="flex justify-between items-center gap-2">
                                                <div className="space-y-1 flex-1">
                                                    <label className="text-xs font-semibold text-muted-foreground">Category</label>
                                                    <select
                                                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                        value={b.category}
                                                        onChange={e => {
                                                            const newB = [...benefits];
                                                            newB[idx].category = e.target.value;
                                                            setBenefits(newB);
                                                        }}
                                                    >
                                                        <option value="SELF_FUNDED">Self Funded (18+ yrs)</option>
                                                        <option value="PARTIALLY_FUNDED">Partially Funded (15-17+ yrs)</option>
                                                        <option value="FULLY_FUNDED">Exclusively Funded (7-15 yrs)</option>
                                                    </select>
                                                </div>
                                                <Button type="button" variant="ghost" size="sm" onClick={() => setBenefits(benefits.filter((_, i) => i !== idx))} className="text-destructive hover:bg-destructive/10 mt-6">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-muted-foreground">Description</label>
                                                <Input
                                                    placeholder="e.g. Flight + Accommodation included"
                                                    value={b.description}
                                                    className="bg-background"
                                                    onChange={e => {
                                                        const newB = [...benefits];
                                                        newB[idx].description = e.target.value;
                                                        setBenefits(newB);
                                                    }}
                                                />
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                                <div className="space-y-4 border-t pt-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Target Age & Child Streamlining</h3>
                                            <p className="text-xs text-muted-foreground">Configure age suitability to streamline registration & child-focused tracks</p>
                                        </div>
                                        {isChildFocused && (
                                            <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                                                Child-Focused Event
                                            </span>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="target_age_group">Target Age Group</Label>
                                        <select
                                            id="target_age_group"
                                            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                            value={targetAgeGroup}
                                            onChange={e => {
                                                const val = e.target.value;
                                                setTargetAgeGroup(val);
                                                if (val === 'CHILDREN_7_12') {
                                                    setMinAge(7);
                                                    setMaxAge(12);
                                                    setIsChildFocused(true);
                                                } else if (val === 'TEENS_13_17') {
                                                    setMinAge(13);
                                                    setMaxAge(17);
                                                    setIsChildFocused(false);
                                                } else if (val === 'YOUTH_18_PLUS') {
                                                    setMinAge(18);
                                                    setMaxAge(65);
                                                    setIsChildFocused(false);
                                                } else if (val === 'ALL') {
                                                    setMinAge('');
                                                    setMaxAge('');
                                                    setIsChildFocused(false);
                                                }
                                            }}
                                        >
                                            <option value="ALL">All Ages / Open to Everyone</option>
                                            <option value="CHILDREN_7_12">Children Specialized (7–12 years) • Kids Track</option>
                                            <option value="TEENS_13_17">Teens & Junior Youth (13–17 years)</option>
                                            <option value="YOUTH_18_PLUS">Youth & Adults (18+ years)</option>
                                            <option value="CUSTOM">Custom Age Range</option>
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <Label htmlFor="min_age" className="text-xs">Minimum Age (years)</Label>
                                            <Input
                                                id="min_age"
                                                type="number"
                                                min="0"
                                                max="100"
                                                placeholder="e.g. 7"
                                                value={minAge}
                                                onChange={e => setMinAge(e.target.value === '' ? '' : Number(e.target.value))}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label htmlFor="max_age" className="text-xs">Maximum Age (years)</Label>
                                            <Input
                                                id="max_age"
                                                type="number"
                                                min="0"
                                                max="100"
                                                placeholder="e.g. 15"
                                                value={maxAge}
                                                onChange={e => setMaxAge(e.target.value === '' ? '' : Number(e.target.value))}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-2 pt-1">
                                        <input
                                            type="checkbox"
                                            id="is_child_focused"
                                            checked={isChildFocused}
                                            onChange={e => setIsChildFocused(e.target.checked)}
                                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary cursor-pointer"
                                        />
                                        <Label htmlFor="is_child_focused" className="text-xs font-medium cursor-pointer">
                                            Mark as Child-Focused Event (Tailored kid curriculum, scholarship tiers & parent/guardian verification)
                                        </Label>
                                    </div>
                                </div>

                                <div className="space-y-4 border-t pt-4">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Event Locations (Same-Day / Multiple Venues)</h3>
                                            <p className="text-xs text-muted-foreground">Declare multiple venues on the event day so attendees can choose their location</p>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="gap-1.5"
                                            onClick={() => setLocations([...locations, { id: `loc_${Date.now()}`, name: "", address: "", time: "", capacity: 100 }])}
                                        >
                                            <Plus className="h-3.5 w-3.5" />
                                            Add Location
                                        </Button>
                                    </div>

                                    {locations.map((loc, idx) => (
                                        <Card key={loc.id || idx} className="p-3 bg-muted/20 border-primary/20 space-y-2.5">
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-bold text-primary flex items-center gap-1">
                                                    <MapPin className="h-3.5 w-3.5" /> Location #{idx + 1}
                                                </span>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                                                    onClick={() => setLocations(locations.filter((_, i) => i !== idx))}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                <div>
                                                    <Label className="text-[11px] font-semibold">Venue / Center Name *</Label>
                                                    <Input
                                                        placeholder="e.g. Main Auditorium - Campus A"
                                                        className="h-8 text-xs bg-background mt-0.5"
                                                        value={loc.name}
                                                        onChange={e => {
                                                            const newL = [...locations];
                                                            newL[idx].name = e.target.value;
                                                            setLocations(newL);
                                                        }}
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-[11px] font-semibold">Session Time / Schedule</Label>
                                                    <Input
                                                        placeholder="e.g. 09:00 AM - 01:00 PM"
                                                        className="h-8 text-xs bg-background mt-0.5"
                                                        value={loc.time || ""}
                                                        onChange={e => {
                                                            const newL = [...locations];
                                                            newL[idx].time = e.target.value;
                                                            setLocations(newL);
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                                <div className="sm:col-span-2">
                                                    <Label className="text-[11px] font-semibold">Street Address / Room Details</Label>
                                                    <Input
                                                        placeholder="e.g. Ngong Rd, Innovation Block B, 2nd Floor"
                                                        className="h-8 text-xs bg-background mt-0.5"
                                                        value={loc.address || ""}
                                                        onChange={e => {
                                                            const newL = [...locations];
                                                            newL[idx].address = e.target.value;
                                                            setLocations(newL);
                                                        }}
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-[11px] font-semibold">Capacity (Seats)</Label>
                                                    <Input
                                                        type="number"
                                                        placeholder="100"
                                                        className="h-8 text-xs bg-background mt-0.5"
                                                        value={loc.capacity || ""}
                                                        onChange={e => {
                                                            const newL = [...locations];
                                                            newL[idx].capacity = e.target.value ? Number(e.target.value) : undefined;
                                                            setLocations(newL);
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </Card>
                                    ))}

                                    <div className="space-y-1">
                                        <Label htmlFor="location" className="text-xs font-semibold">
                                            {locations.length > 0 ? "Primary / Summary Location (Auto-synced or City)" : "Location / City *"}
                                        </Label>
                                        <Input
                                            id="location"
                                            name="location"
                                            placeholder="e.g. Nairobi, Kenya"
                                            defaultValue=""
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description" className="text-primary font-semibold">Overview/About</Label>
                                    <Textarea
                                        id="description"
                                        name="description"
                                        required
                                        placeholder="Brief summary of the event..."
                                    />
                                </div>

                                {/* Rich Sections */}
                                <div className="space-y-4 border-t pt-4">
                                    <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Itinerary (Multi-day)</h3>
                                    <Button type="button" variant="outline" size="sm" onClick={() => setActivities([...activities, { day: activities.length + 1, date: "", items: [] }])}>
                                        Add Day
                                    </Button>
                                    {activities.map((day, dIdx) => (
                                        <Card key={dIdx} className="p-4 space-y-3 bg-muted/30 border-primary/20">
                                            <div className="flex justify-between items-center bg-primary/5 p-2 rounded-t-md -mx-4 -mt-4 mb-2">
                                                <Label className="text-primary font-bold">Day {day.day}</Label>
                                                <Button type="button" variant="ghost" size="sm" onClick={() => setActivities(activities.filter((_, i) => i !== dIdx))} className="text-destructive hover:bg-destructive/10">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <Input placeholder="Date (e.g. April 2)" value={day.date} className="bg-background" onChange={e => {
                                                const newA = [...activities];
                                                newA[dIdx].date = e.target.value;
                                                setActivities(newA);
                                            }} />
                                            <Button type="button" variant="secondary" size="sm" className="w-full" onClick={() => {
                                                const newA = [...activities];
                                                newA[dIdx].items.push({ title: "", description: "" });
                                                setActivities(newA);
                                            }}>+ Add Activity</Button>
                                            <div className="space-y-3">
                                                {day.items.map((item: any, iIdx: number) => (
                                                    <div key={iIdx} className="pl-4 border-l-2 border-primary/30 space-y-2 mt-2 py-1">
                                                        <Input placeholder="Activity Title" value={item.title} className="bg-background" onChange={e => {
                                                            const newA = [...activities];
                                                            newA[dIdx].items[iIdx].title = e.target.value;
                                                            setActivities(newA);
                                                        }} />
                                                        <Textarea placeholder="Description" className="min-h-[80px] bg-background" value={item.description} onChange={e => {
                                                            const newA = [...activities];
                                                            newA[dIdx].items[iIdx].description = e.target.value;
                                                            setActivities(newA);
                                                        }} />
                                                    </div>
                                                ))}
                                            </div>
                                        </Card>
                                    ))}
                                </div>

                                <div className="space-y-4 border-t pt-4">
                                    <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Speakers</h3>
                                    <Button type="button" variant="outline" size="sm" onClick={() => setSpeakers([...speakers, { name: "", role: "", bio: "", imageUrl: "", imageFile: null }])}>
                                        Add Speaker
                                    </Button>
                                    {speakers.map((s, idx) => (
                                        <Card key={idx} className="p-4 space-y-3 bg-muted/20 border-primary/10">
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center space-x-3">
                                                    <div className="relative h-12 w-12 ring-2 ring-primary/20 rounded-full">
                                                        {s.imageFile ? (
                                                            <img src={URL.createObjectURL(s.imageFile)} className="h-full w-full object-cover rounded-full" />
                                                        ) : (
                                                            <div className="h-full w-full bg-primary/5 rounded-full flex items-center justify-center">
                                                                <User2 className="h-6 w-6 text-primary/40" />
                                                            </div>
                                                        )}
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            className="hidden"
                                                            id={`speaker-img-${idx}`}
                                                            onChange={e => {
                                                                if (e.target.files?.[0]) {
                                                                    const newS = [...speakers];
                                                                    newS[idx].imageFile = e.target.files[0];
                                                                    setSpeakers(newS);
                                                                }
                                                            }}
                                                        />
                                                        <label htmlFor={`speaker-img-${idx}`} className="absolute -bottom-1 -right-1 bg-primary text-white p-1 rounded-full cursor-pointer shadow-sm hover:bg-primary/90 transition-colors">
                                                            <Plus className="h-3 w-3" />
                                                        </label>
                                                    </div>
                                                    <Input placeholder="Speaker Name" value={s.name} className="flex-1 bg-background" onChange={e => {
                                                        const newS = [...speakers];
                                                        newS[idx].name = e.target.value;
                                                        setSpeakers(newS);
                                                    }} />
                                                </div>
                                                <Button type="button" variant="ghost" size="sm" onClick={() => setSpeakers(speakers.filter((_, i) => i !== idx))} className="text-destructive hover:bg-destructive/10">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <Input placeholder="Professional Role" value={s.role} className="bg-background" onChange={e => {
                                                const newS = [...speakers];
                                                newS[idx].role = e.target.value;
                                                setSpeakers(newS);
                                            }} />
                                            <Textarea placeholder="Short Bio" className="min-h-[80px] bg-background" value={s.bio} onChange={e => {
                                                const newS = [...speakers];
                                                newS[idx].bio = e.target.value;
                                                setSpeakers(newS);
                                            }} />
                                        </Card>
                                    ))}
                                </div>

                                <div className="space-y-4 border-t pt-4">
                                    <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">FAQs</h3>
                                    <Button type="button" variant="outline" size="sm" onClick={() => setFaqs([...faqs, { question: "", answer: "" }])}>
                                        Add FAQ
                                    </Button>
                                    {faqs.map((f, idx) => (
                                        <Card key={idx} className="p-4 space-y-3 bg-muted/20 border-primary/10">
                                            <div className="flex justify-between items-start gap-2">
                                                <Input placeholder="Question" className="bg-background flex-1" value={f.question} onChange={e => {
                                                    const newF = [...faqs];
                                                    newF[idx].question = e.target.value;
                                                    setFaqs(newF);
                                                }} />
                                                <Button type="button" variant="ghost" size="sm" onClick={() => setFaqs(faqs.filter((_, i) => i !== idx))} className="text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></Button>
                                            </div>
                                            <Textarea placeholder="Detailed Answer" className="min-h-[80px] bg-background" value={f.answer} onChange={e => {
                                                const newF = [...faqs];
                                                newF[idx].answer = e.target.value;
                                                setFaqs(newF);
                                            }} />
                                        </Card>
                                    ))}
                                </div>
                                <div className="space-y-4 border-t pt-4">
                                    <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Alignment & Goals</h3>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-primary font-semibold">Affiliation/Vision Title</Label>
                                            <Input placeholder="Aligned with Digital Learning Vision" value={alignment.title} className="bg-background" onChange={e => setAlignment({ ...alignment, title: e.target.value })} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-primary font-semibold">Affiliation Description</Label>
                                            <Textarea placeholder="Explain how the event aligns with the vision..." className="bg-background min-h-[100px]" value={alignment.description} onChange={e => setAlignment({ ...alignment, description: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="space-y-2 pt-2">
                                        <Label className="text-primary font-semibold">Key Features/Goals (one per line)</Label>
                                        <Textarea
                                            placeholder="High-Impact Keynotes&#10;Interactive Workshops"
                                            className="min-h-[120px] bg-background"
                                            value={features.join('\n')}
                                            onChange={e => setFeatures(e.target.value.split('\n'))}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4 border-t pt-4">
                                    <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">User Journey</h3>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-primary font-semibold">Arrival & Location Guide</Label>
                                            <Textarea placeholder="How to arrive, shuttle services..." className="bg-background min-h-[100px]" value={journey.arrival} onChange={e => setJourney({ ...journey, arrival: e.target.value })} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-primary font-semibold">What to Expect</Label>
                                            <Textarea placeholder="Event guides, schedules..." className="bg-background min-h-[100px]" value={journey.expectations} onChange={e => setJourney({ ...journey, expectations: e.target.value })} />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2 border-t pt-4">
                                    <Label className="text-primary font-semibold">Hero Image (Required)</Label>
                                    <div className="flex flex-col space-y-2">
                                        {heroImagePreview ? (
                                            <div className="relative group w-full max-w-sm aspect-video">
                                                <img src={heroImagePreview} className="w-full h-full object-cover rounded-md border" />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setHeroImagePreview(null);
                                                        setHeroImageFile(null);
                                                    }}
                                                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-600"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <Input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => {
                                                        if (e.target.files?.[0]) {
                                                            const file = e.target.files[0];
                                                            setHeroImageFile(file);
                                                            setHeroImagePreview(URL.createObjectURL(file));
                                                        }
                                                    }}
                                                    className="hidden"
                                                    id="hero-image-upload"
                                                />
                                                <Label
                                                    htmlFor="hero-image-upload"
                                                    className="flex items-center justify-center w-full max-w-sm aspect-video border-2 border-dashed border-primary/50 rounded-lg cursor-pointer hover:bg-primary/5 transition-colors"
                                                >
                                                    <div className="flex flex-col items-center">
                                                        <Upload className="h-8 w-8 text-primary mb-2" />
                                                        <span className="text-sm font-medium text-primary">Upload Hero Image</span>
                                                        <span className="text-xs text-muted-foreground mt-1">Recommended: 16:9 ratio</span>
                                                    </div>
                                                </Label>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2 border-t pt-4">
                                    <Label>Event Media (Gallery)</Label>
                                    <div className="flex items-center space-x-2">
                                        <Input
                                            type="file"
                                            multiple
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            className="hidden"
                                            id="image-upload"
                                        />
                                        <Label
                                            htmlFor="image-upload"
                                            className="flex items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer hover:bg-slate-50 transition-colors"
                                        >
                                            <div className="flex flex-col items-center">
                                                <Upload className="h-6 w-6 text-gray-400" />
                                                <span className="text-sm text-gray-500">Click to upload images</span>
                                            </div>
                                        </Label>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 mt-2">
                                        {imagePreviews.map((src, i) => (
                                            <div key={i} className="relative group aspect-square">
                                                <img src={src} className="w-full h-full object-cover rounded-md" />
                                                <button
                                                    type="button"
                                                    onClick={() => removeImage(i)}
                                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button type="submit" className="flex-1" disabled={isSubmitting || uploading}>
                                        {(isSubmitting || uploading) ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                                        {editingEvent ? "Update Event" : "Create Event"}
                                    </Button>
                                    {editingEvent && (
                                        <Button type="button" variant="outline" onClick={cancelEdit}>
                                            Cancel
                                        </Button>
                                    )}
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Events List */}
                    <div className="lg:col-span-2 space-y-4">
                        <h2 className="text-xl font-bold text-primary mb-4">Existing Events</h2>
                        {events.length === 0 ? (
                            <p className="text-gray-500 italic">No events found.</p>
                        ) : (
                            events.map(event => (
                                <Card key={event.id}>
                                    <CardContent className="p-4 flex items-start space-x-4">
                                        {event.heroImageUrl || event.imageUrls?.[0] ? (
                                            <img src={event.heroImageUrl || event.imageUrls?.[0]} className="w-24 h-24 object-cover rounded-md flex-shrink-0" />
                                        ) : (
                                            <div className="w-24 h-24 bg-slate-100 flex items-center justify-center rounded-md flex-shrink-0">
                                                <ImageIcon className="h-8 w-8 text-gray-300" />
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <h3 className="font-bold text-lg">{event.title}</h3>
                                            <p className="text-sm text-gray-500 mb-1">
                                                {format(new Date(event.date), 'PPP p')} • {event.location} • ${event.price}
                                            </p>
                                            {event.locations && event.locations.length > 0 && (
                                                <div className="flex items-center gap-1.5 text-xs text-primary font-semibold mb-1">
                                                    <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                                                    <span>{event.locations.length} Same-Day Venues: {event.locations.map((l: any) => l.name).join(', ')}</span>
                                                </div>
                                            )}
                                            {(event.is_child_focused || (event.min_age !== null && event.min_age !== undefined)) && (
                                                <div className="flex items-center gap-1.5 text-xs text-amber-700 font-medium mb-1">
                                                    <Users className="h-3.5 w-3.5 flex-shrink-0" />
                                                    <span>
                                                        {event.is_child_focused ? "👶 Child-Focused Track" : "Age Target"}: {event.min_age ? `${event.min_age}` : '0'}{event.max_age ? `–${event.max_age} yrs` : '+ yrs'}
                                                    </span>
                                                </div>
                                            )}
                                            <p className="text-gray-600 line-clamp-2 text-sm">{event.description}</p>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <button
                                                onClick={() => handleEditClick(event)}
                                                className="text-primary hover:text-primary/70 p-2"
                                            >
                                                <Edit2 className="h-5 w-5" />
                                            </button>
                                            <button
                                                onClick={() => deleteEvent(event.id)}
                                                className="text-red-500 hover:text-red-700 p-2"
                                            >
                                                <Trash2 className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'blogs' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <BlogManager />
                </div>
            )}

            {activeTab === 'visa' && (
                <div className="max-w-5xl mx-auto">
                    <VisaInvitationManager />
                </div>
            )}
        </div>
    );
}

