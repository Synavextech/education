import { Link } from "wouter";
import { GraduationCap, Mail, Phone, MapPin, Globe, Sparkles } from "lucide-react";

export default function Footer() {
    return (
        <footer className="border-t bg-slate-950 text-slate-300 pt-16 pb-12">
            <div className="container mx-auto px-4 sm:px-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
                    {/* Brand column */}
                    <div className="lg:col-span-2 space-y-5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-tr from-primary to-indigo-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
                                <GraduationCap className="h-6 w-6" />
                            </div>
                            <span className="text-2xl font-black text-white tracking-tight">worlducationHub</span>
                        </div>
                        <p className="text-sm leading-relaxed text-slate-400 max-w-sm">
                            We help deliver knowledge and skill shaping the future. Our mission is to ensure complete digitization of the learning environment through modern school computer labs, smart learning tablets, and seasonal innovation events.
                        </p>
                        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-3 py-1.5 rounded-full w-fit">
                            <Sparkles className="h-3.5 w-3.5" />
                            <span>Structured for Year-Round Seasonal Programs</span>
                        </div>
                    </div>

                    {/* Navigation */}
                    <div>
                        <h4 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">Explore</h4>
                        <ul className="space-y-2.5 text-sm">
                            <li><Link href="/" className="hover:text-primary transition-colors">Home Page</Link></li>
                            <li><Link href="/about" className="hover:text-primary transition-colors">Our Mission & Vision</Link></li>
                            <li><Link href="/upcoming-events" className="hover:text-primary transition-colors">Seasonal Summits & Labs</Link></li>
                            <li><Link href="/past-events" className="hover:text-primary transition-colors">Past Event Archive</Link></li>
                            <li><Link href="/blog" className="hover:text-primary transition-colors">Digital Insights Blog</Link></li>
                        </ul>
                    </div>

                    {/* Educational Programs */}
                    <div>
                        <h4 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">Seasonal Focus</h4>
                        <ul className="space-y-2.5 text-sm text-slate-400">
                            <li>Spring: Digital Literacy</li>
                            <li>Summer: STEM & Coding</li>
                            <li>Autumn: Educator Forums</li>
                            <li>Winter: Global Education</li>
                            <li>Smart U-Tab Ecosystem</li>
                        </ul>
                    </div>

                    {/* Contact & Support */}
                    <div>
                        <h4 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">Get in Touch</h4>
                        <ul className="space-y-3 text-sm">
                            <li className="flex items-center gap-2.5">
                                <Mail className="h-4 w-4 text-primary shrink-0" />
                                <a href="mailto:support@worlducationhub.org" className="hover:text-white transition-colors">
                                    support@worlducationhub.org
                                </a>
                            </li>
                            <li className="flex items-center gap-2.5">
                                <Phone className="h-4 w-4 text-primary shrink-0" />
                                <span>+254713022910</span>
                            </li>
                            <li className="flex items-start gap-2.5">
                                <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                <span>worlducationHub Head Office Nairobi</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom legal & copyright */}
                <div className="border-t border-slate-800/80 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
                    <p>© {new Date().getFullYear()} worlducationHub. All rights reserved.</p>
                    <div className="flex items-center gap-6">
                        <Link href="/terms" className="hover:text-slate-300 transition-colors">Terms of Service</Link>
                        <Link href="/privacy" className="hover:text-slate-300 transition-colors">Privacy Policy</Link>
                        <Link href="/compliance" className="hover:text-slate-300 transition-colors">Compliance Policy</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
