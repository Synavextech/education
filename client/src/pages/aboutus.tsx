import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Laptop, Tablet, Sparkles, GraduationCap, Calendar, CheckCircle } from "lucide-react";
import { Link } from "wouter";
import HeroSection from "@/components/HeroSection";
import Testimonials from "@/components/Testimonials";
import JoinUs from "@/components/JoinUs";
import { useState, useEffect } from "react";
import CountUp from "@/components/CountUp";

const teamMembers = [
    {
        name: "Dr. Evans Kiprop",
        role: "Executive Director & Founder",
        image: "/images/images1.jpeg",
        bio: "Pioneering the digitization of rural and urban schools with scalable digital education technologies."
    },
    {
        name: "Faith Chebet",
        role: "Director of Digital Curriculum",
        image: "/images/images2.jpeg",
        bio: "Curating future-ready STEM, programming, and digital literacy frameworks for modern learning environments."
    },
    {
        name: "Anthony Mwangi",
        role: "Hardware & Lab Infrastructure Lead",
        image: "/images/images3.jpeg",
        bio: "Managing the deployment of U-Tab ecosystems, network backbones, and smart classroom panel PCs."
    },
    {
        name: "Grace Ochieng",
        role: "Head of Seasonal Innovation Programs",
        image: "/images/simba.jpeg",
        bio: "Directing year-round seasonal bootcamps, teacher fellowships, and international student forums."
    }
];

const partners = [
    "/images/partner1.jpeg",
    "/images/partner2.jpeg",
    "/images/partner4.jpeg",
    "/images/partner5.jpeg",
    "/images/partner6.jpeg",
    "/images/partner7.jpeg",
    "/images/partner8.jpeg",
    "/images/partner9.jpeg",
    "/images/partner10.jpeg",
    "/images/partner11.jpeg"
];

const focusAreas = [
    {
        title: "Smart Computer Labs",
        image: "/images/t2.gif",
        content: "Equipping schools with energy-efficient computer labs, networked terminals, and modern digital classrooms."
    },
    {
        title: "U-Tab Tablet Ecosystem",
        image: "/images/t3.gif",
        content: "Deploying ruggedized student learning tablets preloaded with interactive curricula and offline academic resources."
    },
    {
        title: "Coding & Future Skills",
        image: "/images/t8.gif",
        content: "Teaching algorithmic logic, software creation, and STEM problem-solving to help learners shape the future."
    },
    {
        title: "Seasonal Summits & Labs",
        image: "/images/t9.gif",
        content: "Structuring seasonal events across Spring, Summer, Autumn, and Winter for continuous educator and student growth."
    }
];

const eventShuffleImages = [
    "/images/IMG-20260618-WA0008.jpg",
    "/images/IMG-20260618-WA0005.jpg",
    "/images/IMG-20260618-WA0006.jpg",
    "/images/IMG-20260618-WA0007.jpg",
    "/images/IMG-20260618-WA0009.jpg",
    "/images/IMG-20260618-WA0010.jpg",
    "/images/all.jpeg",
    "/images/mariasoti.jpg",
    "/images/singore.jpeg",
    "/images/tamb.jpg"
];

export default function About() {
    const [currentEventIdx, setCurrentEventIdx] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentEventIdx((prev) => (prev + 1) % eventShuffleImages.length);
        }, 3500);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground">
            {/* Hero Section */}
            <HeroSection
                backgroundImageUrl="/images/hero_aboutus.gif"
                title="Our Mission to Digitize Learning"
                subtitle="We help deliver knowledge and skill shaping the future. Dedicated to transforming educational environments across all seasons."
            />

            {/* About us Introduction */}
            <section className="py-24 bg-card border-b border-border">
                <div className="container mx-auto px-4 sm:px-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div className="relative group">
                            <div className="absolute -inset-4 bg-primary/20 rounded-3xl blur-2xl group-hover:bg-primary/30 transition-colors" />
                            <img
                                src="/images/IMG-20260618-WA0008.jpg"
                                alt="worlducationHub in Action"
                                className="relative rounded-3xl shadow-2xl border border-border w-full h-[450px] object-cover"
                            />
                        </div>
                        <div className="space-y-6">
                            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-wider">
                                <Sparkles className="h-3.5 w-3.5" />
                                <span>Who We Are</span>
                            </div>
                            <h2 className="text-3xl sm:text-5xl font-black text-foreground leading-tight tracking-tight">
                                Delivering Knowledge, <br />
                                <span className="text-primary">Shaping the Future</span>
                            </h2>
                            <p className="text-lg text-muted-foreground leading-relaxed">
                                worlducationHub is a global educational transformation organization committed to the total digitization of the learning environment. We bridge the technology gap by deploying smart computer labs, specialized U-Tab educational tablets, and structured seasonal innovation summits.
                            </p>
                            <p className="text-base text-muted-foreground leading-relaxed">
                                From regional centres like Maria Soti and Singore to nationwide training workshops, we provide the tools, connectivity, and mentorship young minds need to become tomorrow's innovators.
                            </p>
                            <div className="pt-2">
                                <Button asChild size="lg" className="rounded-2xl font-bold h-12 px-6">
                                    <Link href="/upcoming-events">
                                        Explore Seasonal Programs <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Our Impact Statistics */}
            <section className="py-20 bg-background container mx-auto px-4 sm:px-6 text-center">
                <div className="max-w-2xl mx-auto mb-12">
                    <span className="text-xs font-bold text-primary uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full">
                        Quantifiable Impact
                    </span>
                    <h3 className="text-3xl sm:text-4xl font-black mt-3 mb-3 text-foreground">
                        Our Reach Across Learning Hubs
                    </h3>
                    <p className="text-muted-foreground">
                        Measurable progress toward universal digitization of primary and secondary learning institutions.
                    </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
                    <div className="p-8 rounded-3xl bg-card border border-border shadow-sm">
                        <h4 className="text-4xl sm:text-5xl font-black text-primary mb-2">
                            <CountUp to={50} suffix="k+" />
                        </h4>
                        <p className="text-xs sm:text-sm text-muted-foreground uppercase font-bold tracking-widest">
                            Students Digitized
                        </p>
                    </div>
                    <div className="p-8 rounded-3xl bg-card border border-border shadow-sm">
                        <h4 className="text-4xl sm:text-5xl font-black text-primary mb-2">
                            <CountUp to={120} suffix="+" />
                        </h4>
                        <p className="text-xs sm:text-sm text-muted-foreground uppercase font-bold tracking-widest">
                            School Computer Labs
                        </p>
                    </div>
                    <div className="p-8 rounded-3xl bg-card border border-border shadow-sm">
                        <h4 className="text-4xl sm:text-5xl font-black text-primary mb-2">
                            <CountUp to={4} suffix=" Seasons" />
                        </h4>
                        <p className="text-xs sm:text-sm text-muted-foreground uppercase font-bold tracking-widest">
                            Continuous Annual Events
                        </p>
                    </div>
                </div>
            </section>

            {/* Mission & Vision Dual Cards */}
            <section className="py-24 bg-slate-50 dark:bg-slate-900/50 border-y border-border relative overflow-hidden">
                <div className="container mx-auto px-4 sm:px-6 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <Card className="p-8 sm:p-10 border border-border shadow-xl bg-card hover:shadow-2xl transition-all duration-300 rounded-3xl">
                            <CardHeader className="p-0 mb-6">
                                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-4 font-bold">
                                    <Laptop className="h-6 w-6" />
                                </div>
                                <CardTitle className="text-3xl font-extrabold text-foreground">Our Mission</CardTitle>
                            </CardHeader>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                                Our mission is to ensure the complete digitization of the learning environment, equipping schools, educators, and students with high-tech computer labs, smart tablets, and practical digital skills that shape the future.
                            </p>
                        </Card>
                        <Card className="p-8 sm:p-10 border border-border shadow-xl bg-card hover:shadow-2xl transition-all duration-300 rounded-3xl">
                            <CardHeader className="p-0 mb-6">
                                <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4 font-bold">
                                    <GraduationCap className="h-6 w-6" />
                                </div>
                                <CardTitle className="text-3xl font-extrabold text-foreground">Our Vision</CardTitle>
                            </CardHeader>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                                To establish a world where every learner has equal, unrestricted access to modern digital knowledge, cutting-edge computing tools, and year-round innovation programs regardless of geography.
                            </p>
                        </Card>
                    </div>
                </div>
            </section>

            {/* Specialized Focus Areas */}
            <section className="py-24 bg-background">
                <div className="container mx-auto px-4 sm:px-6 text-center">
                    <div className="max-w-2xl mx-auto mb-16">
                        <span className="text-xs font-bold text-primary uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full">
                            Methodology
                        </span>
                        <h2 className="text-3xl sm:text-5xl font-black text-foreground tracking-tight mt-3 mb-4">
                            Our Specialized Focus
                        </h2>
                        <p className="text-muted-foreground text-base sm:text-lg">
                            Targeted interventions combining hardware, digital curriculums, and seasonal gatherings.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {focusAreas.map((area, idx) => (
                            <div key={idx} className="flex flex-col items-center p-8 bg-card rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 border border-border group">
                                <div className="mb-6 w-20 h-20 flex items-center justify-center bg-muted rounded-2xl shadow-inner overflow-hidden p-3">
                                    <img src={area.image} alt={area.title} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500" />
                                </div>
                                <h3 className="text-xl font-bold mb-3 text-foreground">{area.title}</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed text-center">{area.content}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Event Shuffle Section */}
            <section className="py-24 bg-slate-950 text-white overflow-hidden relative">
                <div className="container mx-auto px-4 sm:px-6 relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest bg-cyan-950 px-3 py-1 rounded-full border border-cyan-800/60">
                                Archive & Impact
                            </span>
                            <h2 className="text-3xl sm:text-5xl font-black leading-tight tracking-tight mt-4 mb-6">
                                Glimpses of <br />
                                <span className="bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
                                    Our Digital Journey
                                </span>
                            </h2>
                            <p className="text-base sm:text-lg text-slate-300 font-light leading-relaxed mb-8">
                                From setting up brand-new computer labs in schools to conducting hands-on coding workshops and seasonal summits, explore how worlducationHub is transforming lives.
                            </p>
                            <div>
                                <Link href="/past-events">
                                    <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-200 font-bold rounded-2xl h-14 px-8">
                                        Browse Event Archive
                                    </Button>
                                </Link>
                            </div>
                        </div>
                        <div className="relative h-[420px] w-full max-w-lg mx-auto">
                            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
                            {eventShuffleImages.map((img, idx) => (
                                <img
                                    key={idx}
                                    src={img}
                                    alt="worlducationHub Activity"
                                    className={`absolute inset-0 w-full h-full object-cover rounded-3xl shadow-2xl transition-all duration-1000 transform ${idx === currentEventIdx ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-95 -rotate-2'
                                        }`}
                                />
                            ))}
                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                                {eventShuffleImages.map((_, idx) => (
                                    <div
                                        key={idx}
                                        className={`h-1.5 rounded-full transition-all duration-500 ${idx === currentEventIdx ? 'w-8 bg-cyan-400' : 'w-2 bg-white/30'
                                            }`}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Team Section */}
            <section className="py-24 bg-card border-b border-border">
                <div className="container mx-auto px-4 sm:px-6">
                    <div className="text-center mb-16 max-w-2xl mx-auto">
                        <span className="text-xs font-bold text-primary uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full">
                            Leadership Team
                        </span>
                        <h2 className="text-3xl sm:text-5xl font-black text-foreground tracking-tight mt-3 mb-4">
                            Meet Our Visionaries
                        </h2>
                        <p className="text-muted-foreground text-base sm:text-lg">
                            Dedicated professionals and educators driving the global digitization of learning.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {teamMembers.map((member, index) => (
                            <div key={index} className="group text-center bg-background p-6 rounded-3xl border border-border shadow-sm hover:shadow-xl transition-all duration-300">
                                <div className="relative w-44 h-44 mx-auto mb-6 rounded-2xl overflow-hidden shadow-md">
                                    <img
                                        src={member.image}
                                        alt={member.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                </div>
                                <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">{member.name}</h3>
                                <p className="text-primary font-bold uppercase tracking-wider text-xs my-2">{member.role}</p>
                                <p className="text-xs text-muted-foreground leading-relaxed px-2">{member.bio}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Partners Section */}
            <section className="py-24 bg-background">
                <div className="container mx-auto px-4 sm:px-6 text-center">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-10">
                        Trusted by Schools, Institutions & Global Partners
                    </p>
                    <div className="flex flex-wrap justify-center gap-8 md:gap-12 items-center opacity-70 hover:opacity-100 transition-opacity duration-500 max-w-5xl mx-auto">
                        {partners.map((partnerImage, index) => (
                            <div key={index} className="p-3 bg-card rounded-2xl border border-border shadow-sm flex items-center justify-center h-20 w-36">
                                <img
                                    src={partnerImage}
                                    alt="Partner"
                                    className="max-h-12 max-w-full object-contain filter grayscale hover:grayscale-0 transition-all duration-300"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <Testimonials />
            <JoinUs />
        </div>
    );
}
