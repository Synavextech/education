import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { MoveRight, Loader2, Sparkles, Laptop, Tablet, Calendar, Award, Globe, CheckCircle2, Play, Users, ArrowUpRight } from "lucide-react";
import HeroSection from "@/components/HeroSection";
import HeroShortcuts from "@/components/HeroShortcuts";
import EventCard from "@/components/EventCard";
import Testimonials from "@/components/Testimonials";
import JoinUs from "@/components/JoinUs";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

const featureData = [
  {
    title: "Digitized Learning Environments",
    subtitle: "Modern Computer Labs & Smart Classrooms",
    description: "Transforming traditional education into immersive digital hubs equipped with modern PCs, interactive displays, and cloud connectivity.",
    image: "/images/IMG-20260618-WA0008.jpg",
    badge: "Core Mission"
  },
  {
    title: "U-Tab Smart Mobile Education",
    subtitle: "Custom Ruggedized Educational Tablets",
    description: "Empowering every student with specialized learning tablets loaded with digital curriculums, offline libraries, and interactive exercises.",
    image: "/images/Utab1.png",
    badge: "Hardware Innovation"
  },
  {
    title: "Hands-on Coding & STEM Skills",
    subtitle: "Practical Future-Ready Competencies",
    description: "Students learn foundational and advanced programming, computational thinking, and technology problem-solving shaping the digital economy.",
    image: "/images/IMG-20260618-WA0006.jpg",
    badge: "Skill Development"
  },
  {
    title: "Seasonal Global Summits & Labs",
    subtitle: "Structured Year-Round Innovation Programs",
    description: "Year-round seasonal bootcamps running across Spring, Summer, Autumn, and Winter to continually elevate educators and students alike.",
    image: "/images/IMG-20260618-WA0009.jpg",
    badge: "Seasonal Framework"
  }
];

const hardwareHighlights = [
  {
    name: "U-Tab Pro Series",
    category: "Student Learning Tablet",
    desc: "Reinforced drop-resistant tablets with pre-calibrated digital learning suites and long-life battery.",
    image: "/images/utab2.png"
  },
  {
    name: "VisuPro Interactive Station",
    category: "Teacher & Classroom Hub",
    desc: "15.6-inch fanless industrial panel PC engineered for reliable classroom computing and lab control.",
    image: "/images/15.6-INCH-Fanless-Industrial-Panel-PC-3.webp"
  },
  {
    name: "Smart Keyboard Slide Tablet",
    category: "Coding & Typing Station",
    desc: "Hybrid tactile keyboard protection casing for intensive coding, typing, and document creation.",
    image: "/images/Tablet - protection, slide with keybord.jpg"
  },
  {
    name: "U-Tab Digital Classroom Edition",
    category: "Multi-Student Suite",
    desc: "Seamless synchronization with central school servers for real-time lesson assessments and collaborative work.",
    image: "/images/utab3.png"
  }
];

const seasonalStructure = [
  {
    season: "Spring Season",
    months: "March – May",
    theme: "Digital Literacy & Smart Lab Foundations",
    desc: "Kicking off the academic year with foundational computer literacy, typing clubs, and deployment of digitized classroom tools."
  },
  {
    season: "Summer Season",
    months: "June – August",
    theme: "STEM, Robotics & Full-Stack Coding",
    desc: "Intensive summer bootcamps where students build interactive web applications, explore robotics, and solve real-world problems."
  },
  {
    season: "Autumn Season",
    months: "September – November",
    theme: "Educator Empowerment & EdTech Forums",
    desc: "Focus on training educators, curriculum digitization, and regional technology forums bridging the educational divide."
  },
  {
    season: "Winter Season",
    months: "December – February",
    theme: "Global Education Summit & Innovation Showcase",
    desc: "Annual flagship international summit bringing together learners, leaders, and global partners to celebrate digital achievements."
  }
];

const galleryImages = [
  { src: "/images/IMG-20260618-WA0008.jpg", title: "Interactive Digital Lab Session" },
  { src: "/images/IMG-20260618-WA0005.jpg", title: "Students in Computer Classroom" },
  { src: "/images/IMG-20260618-WA0006.jpg", title: "Hands-on Practical Computing" },
  { src: "/images/IMG-20260618-WA0007.jpg", title: "Empowered Young Innovators" },
  { src: "/images/IMG-20260618-WA0009.jpg", title: "Collaborative Workshop Training" },
  { src: "/images/IMG-20260618-WA0010.jpg", title: "Digital Classroom Engagement" },
  { src: "/images/all.jpeg", title: "Community Education Gathering" },
  { src: "/images/mariasoti.jpg", title: "Maria Soti Educational Centre" },
  { src: "/images/singore.jpeg", title: "Singore Girls Digital Hub" }
];

export default function Landing() {
  const { data: upcomingEvents, isLoading: loadingUpcoming } = useQuery({
    queryKey: ["upcoming-events"],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('Event')
        .select('*')
        .gte('date', now)
        .order('date', { ascending: true })
        .limit(3);
      if (error) throw error;
      return data;
    }
  });

  const { data: pastEvents, isLoading: loadingPast } = useQuery({
    queryKey: ["past-events-landing"],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('Event')
        .select('*')
        .lt('date', now)
        .order('date', { ascending: false })
        .limit(3);
      if (error) throw error;
      return data;
    }
  });

  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % featureData.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden bg-slate-950 text-white">
        {/* Dynamic Background Image with subtle zoom */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-10000 scale-105"
          style={{ backgroundImage: `url('/images/hero0.gif')` }}
        >
          {/* Centered dark gradient overlay for balanced high readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/90 via-slate-950/80 to-slate-950/95 backdrop-blur-[2px]" />
        </div>

        <div className="container mx-auto px-4 sm:px-6 relative z-10 py-20 flex flex-col items-center">
          <div className="max-w-4xl mx-auto text-center flex flex-col items-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 backdrop-blur-md border border-primary/40 text-primary-foreground text-xs sm:text-sm font-bold uppercase tracking-wider animate-in fade-in slide-in-from-top-4 duration-500">
              <Sparkles className="h-4 w-4 text-emerald-400" />
              <span>worlducationHub • Global Initiative</span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] animate-in fade-in slide-in-from-bottom-4 duration-700">
              We Help Deliver <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">
                Knowledge & Skill
              </span> <br />
              Shaping the Future
            </h1>

            <p className="text-lg sm:text-2xl text-slate-300 font-light leading-relaxed animate-in fade-in slide-in-from-bottom-6 duration-1000 max-w-2xl mx-auto">
              Our mission is to ensure the complete digitization of the learning environment. Empowering students with modern computer labs, smart learning tablets, and structured seasonal summits across all times of the year.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-center items-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
              <Button asChild size="lg" className="bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-700 h-14 px-8 text-base sm:text-lg font-bold shadow-xl shadow-primary/25 rounded-2xl">
                <Link href="/upcoming-events">
                  Explore Seasonal Events <MoveRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                onClick={() => {
                  const el = document.getElementById("participate-showcase");
                  if (el) {
                    el.scrollIntoView({ behavior: "smooth", block: "start" });
                  }
                }}
                className="bg-gradient-to-r from-cyan-500/25 to-teal-500/20 hover:from-cyan-500/40 hover:to-teal-500/30 border border-cyan-400/60 text-cyan-200 hover:text-white h-14 px-7 text-base sm:text-lg font-bold rounded-2xl shadow-xl shadow-cyan-950/50 backdrop-blur-md transition-all duration-300 hover:scale-105 cursor-pointer"
              >
                <Sparkles className="mr-2 h-5 w-5 text-cyan-400 animate-pulse" />
                Participate & Showcase
              </Button>
              <Button asChild size="lg" variant="outline" className="bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/20 h-14 px-8 text-base sm:text-lg font-bold rounded-2xl">
                <Link href="/about">Our Digital Mission</Link>
              </Button>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-3 gap-6 pt-10 border-t border-white/10 max-w-lg w-full mx-auto">
              <div>
                <p className="text-2xl sm:text-3xl font-black text-cyan-400">100%</p>
                <p className="text-xs sm:text-sm text-slate-400 font-medium">Digital Focus</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-black text-emerald-400">4 Seasons</p>
                <p className="text-xs sm:text-sm text-slate-400 font-medium">Year-Round Events</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-black text-indigo-400">50k+</p>
                <p className="text-xs sm:text-sm text-slate-400 font-medium">Learners Reached</p>
              </div>
            </div>
          </div>

          {/* Participate, Showcase & Connect With Our Global Team */}
          <div id="participate-showcase" className="w-full max-w-6xl mx-auto mt-12 pt-8 border-t border-white/10 scroll-mt-24">
            <HeroShortcuts />
          </div>
        </div>
      </section>

      {/* Feature Slider: Digitization in Action */}
      <section id="features" className="py-24 bg-background">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <span className="text-primary font-bold text-xs uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full">
              Pillars of Transformation
            </span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-foreground mt-3 mb-4">
              Digitizing the Learning Environment
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground">
              Modern infrastructure, interactive educational hardware, and seasonal training designed to future-proof education worldwide.
            </p>
          </div>

          <div className="relative mx-auto h-[540px] overflow-hidden rounded-3xl shadow-2xl group border border-border">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.7 }}
                className="absolute inset-0"
              >
                <div className="relative w-full h-full bg-slate-900">
                  <img
                    src={featureData[currentSlide].image}
                    alt={featureData[currentSlide].title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />

                  <div className="absolute bottom-12 left-6 right-6 sm:left-12 sm:right-12 text-white max-w-3xl">
                    <span className="inline-block bg-primary text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-3 shadow-md">
                      {featureData[currentSlide].badge}
                    </span>
                    <h3 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold mb-2 tracking-tight">
                      {featureData[currentSlide].title}
                    </h3>
                    <p className="text-primary-foreground/90 font-medium text-sm sm:text-lg mb-3">
                      {featureData[currentSlide].subtitle}
                    </p>
                    <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
                      {featureData[currentSlide].description}
                    </p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Carousel navigation pills */}
            <div className="absolute bottom-6 right-6 sm:right-12 flex items-center gap-2 z-20">
              {featureData.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  aria-label={`Go to slide ${idx + 1}`}
                  className={cn(
                    "h-2.5 rounded-full transition-all duration-300 focus:outline-none",
                    currentSlide === idx ? "bg-cyan-400 w-10 shadow-lg" : "bg-white/40 hover:bg-white/70 w-2.5"
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Seasonal Architecture Section: Structured Across All Seasons */}
      <section className="py-24 bg-slate-50 dark:bg-slate-900/60 border-y border-border">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-6">
            <div className="max-w-2xl">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full">
                Seasonal Calendar
              </span>
              <h2 className="text-3xl sm:text-5xl font-black text-foreground tracking-tight mt-3 mb-4">
                Structured for Every Season of the Year
              </h2>
              <p className="text-muted-foreground text-base sm:text-lg">
                The worlducationHub system operates on a synchronized seasonal schedule, guaranteeing continuous learning, practical bootcamps, and global forums.
              </p>
            </div>
            <Button asChild size="lg" className="rounded-2xl shrink-0">
              <Link href="/upcoming-events">
                View Seasonal Schedule <Calendar className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {seasonalStructure.map((season, index) => (
              <div
                key={index}
                className="bg-card hover:bg-card/80 p-6 rounded-3xl border border-border hover:border-primary/40 shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-semibold px-2.5 py-1 bg-muted rounded-full text-muted-foreground">
                      {season.months}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
                    {season.season}
                  </h3>
                  <p className="text-xs font-semibold text-primary mb-3">
                    {season.theme}
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {season.desc}
                  </p>
                </div>
                <div className="pt-6 mt-6 border-t border-border/60 flex items-center justify-between text-xs font-bold text-primary group-hover:translate-x-1 transition-transform">
                  <span>Explore Season</span>
                  <MoveRight className="h-4 w-4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Hardware & Tablet Innovation Showcase */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <span className="text-xs font-bold text-primary uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full">
              Digital Hardware Ecosystem
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-foreground tracking-tight mt-3 mb-4">
              U-Tab & Smart Classroom Technology
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg">
              Digitization requires robust, reliable hardware. We deploy student tablets and smart lab panels built for high performance in modern educational institutions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {hardwareHighlights.map((hw, i) => (
              <div key={i} className="group bg-card rounded-3xl border border-border overflow-hidden hover:shadow-2xl transition-all duration-500 flex flex-col">
                <div className="h-56 bg-slate-100 dark:bg-slate-800/50 p-6 flex items-center justify-center relative overflow-hidden">
                  <img
                    src={hw.image}
                    alt={hw.name}
                    className="max-h-44 max-w-full object-contain group-hover:scale-110 transition-transform duration-500 drop-shadow-md"
                  />
                  <div className="absolute top-3 left-3 bg-background/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold text-primary border border-border">
                    {hw.category}
                  </div>
                </div>
                <div className="p-6 flex-grow flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                      {hw.name}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {hw.desc}
                    </p>
                  </div>
                  <div className="pt-4 mt-4 border-t border-border flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Digitization Certified</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Deep-Dive: Delivering Knowledge & Shaping the Future */}
      <section className="py-24 bg-slate-950 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 via-transparent to-indigo-500/10 pointer-events-none" />
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest bg-cyan-950/80 border border-cyan-800/60 px-3.5 py-1.5 rounded-full">
                Our Foundational Purpose
              </span>
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
                Empowering Minds Through <br />
                <span className="bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
                  Complete Digitization
                </span>
              </h2>
              <p className="text-lg text-slate-300 leading-relaxed font-light">
                Knowledge is the catalyst of human progress, and digital literacy is its modern currency. At worlducationHub, we dismantle geographical and infrastructural barriers, equipping schools with computer labs, smart tablets, and innovative teachers.
              </p>
              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                    <Laptop className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-white">Full Classroom Infrastructure</h4>
                    <p className="text-sm text-slate-400">From fiber-backed computer labs to solar-ready digital devices.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Award className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-white">Future-Proof Skill Sets</h4>
                    <p className="text-sm text-slate-400">Coding, algorithmic thinking, digital arts, and data science for kids and youth.</p>
                  </div>
                </div>
              </div>
              <div className="pt-4">
                <Button asChild size="lg" className="bg-gradient-to-r from-cyan-500 to-indigo-600 hover:opacity-90 font-bold rounded-2xl h-14 px-8 text-white">
                  <Link href="/about">Read Our Full Story</Link>
                </Button>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 rounded-3xl blur-3xl" />
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/10 group">
                <img
                  src="/images/all.jpeg"
                  alt="worlducationHub Community in Action"
                  className="w-full h-[480px] object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-8">
                  <div>
                    <p className="text-xl font-bold text-white mb-1">Empowering Educators & Students</p>
                    <p className="text-sm text-slate-300">Active deployments across high schools and community centres.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modern Students in Computer Lab Video Showcase */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <span className="text-xs font-bold text-primary uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full">
              Video Documentaries
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-foreground tracking-tight mt-3 mb-4">
              Modern Students in the Computer Lab
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg">
              Witness the power of digital learning in action. Explore how digital labs and smart devices ignite curiosity, coding skills, and academic excellence.
            </p>
          </div>

          {/* Primary Featured Video */}
          <div className="max-w-5xl mx-auto mb-16">
            <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-2xl">
              <div className="aspect-video w-full bg-slate-950">
                <iframe
                  src="https://www.youtube.com/embed/7RDIzrmzjuQ?rel=0"
                  title="Modern Students in Computer Lab & Digital Skills"
                  className="w-full h-full border-none"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <div className="p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-foreground">
                    Hands-On Computer Lab & Digital Skills Immersion
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Equipping students with modern computer stations, keyboarding skills, and early coding literacy.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-primary bg-primary/10 px-4 py-2 rounded-xl shrink-0">
                  <Play className="h-4 w-4 fill-primary" />
                  <span>Featured Case Study</span>
                </div>
              </div>
            </div>
          </div>

          {/* Secondary Video Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Video 2 */}
            <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-lg flex flex-col">
              <div className="aspect-video w-full bg-slate-950">
                <iframe
                  src="https://www.youtube.com/embed/5s8f5ZjpIKo?rel=0"
                  title="Smart Mobile Learning Tablets & Digitized Classrooms"
                  className="w-full h-full border-none"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <div className="p-6">
                <h4 className="text-lg font-bold text-foreground mb-2">
                  Smart Mobile Learning Tablets in the Classroom
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  How mobile tablets and interactive learning modules empower learners in rural and urban classrooms alike.
                </p>
              </div>
            </div>

            {/* Video 3 */}
            <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-lg flex flex-col">
              <div className="aspect-video w-full bg-slate-950">
                <iframe
                  src="https://www.youtube.com/embed/wER3tksGv94?rel=0"
                  title="Students in Modern Computer Lab Coding & Hands-on Learning"
                  className="w-full h-full border-none"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <div className="p-6">
                <h4 className="text-lg font-bold text-foreground mb-2">
                  Coding, Creativity & Collaboration in Computer Labs
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Students applying algorithmic logic and creating software projects in high-tech educational labs.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Upcoming Seasonal Events */}
      <section className="py-24 bg-slate-50 dark:bg-slate-900/50 border-t border-border">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-6">
            <div className="max-w-2xl">
              <span className="text-xs font-bold text-primary uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full">
                Register Today
              </span>
              <h2 className="text-3xl sm:text-5xl font-black text-foreground tracking-tight mt-3 mb-4">
                Upcoming Seasonal Summits & Workshops
              </h2>
              <p className="text-muted-foreground text-base sm:text-lg">
                Secure your spot in our upcoming hands-on tech labs and leadership gatherings.
              </p>
            </div>
            <Button asChild variant="outline" size="lg" className="rounded-2xl border-border hover:bg-card">
              <Link href="/upcoming-events">View Full Schedule <MoveRight className="ml-2 h-5 w-5" /></Link>
            </Button>
          </div>

          {loadingUpcoming ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          ) : !upcomingEvents || upcomingEvents.length === 0 ? (
            <div className="text-center py-20 bg-card rounded-3xl border border-dashed border-border p-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground font-semibold">Seasonal event announcements are currently being synchronized.</p>
              <Button asChild size="sm" className="mt-4 rounded-xl">
                <Link href="/upcoming-events">Check Full Seasonal Calendar</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {upcomingEvents.map((event: any) => <EventCard key={event.id} event={event} />)}
            </div>
          )}
        </div>
      </section>

      {/* Real Past Events Gallery (Current images in public/images) */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <span className="text-xs font-bold text-primary uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full">
              Field Deployments
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-foreground tracking-tight mt-3 mb-4">
              Real Impact in Schools & Labs
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg">
              Explore authentic glimpses from our smart lab installations, classroom workshops, and partner school programs.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {galleryImages.map((item, index) => (
              <div key={index} className="group relative overflow-hidden rounded-3xl shadow-md h-80 bg-slate-900 border border-border">
                <img
                  src={item.src}
                  alt={item.title}
                  className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                <div className="absolute bottom-6 left-6 right-6 text-white">
                  <h4 className="text-lg font-bold tracking-tight mb-1">{item.title}</h4>
                  <p className="text-xs text-cyan-300 font-medium">worlducationHub Deployment</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button asChild variant="outline" size="lg" className="rounded-2xl border-border px-8">
              <Link href="/past-events">
                Explore Complete Event Archive <MoveRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <JoinUs />
      <Testimonials />
    </div>
  );
}