import { Card, CardContent } from "@/components/ui/card";
import { Quote, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchAllTestimonials } from "@/services/api";

const communityFallbacks = [
    {
        name: "Mercy Jepchumba",
        role: "Head of Science & ICT, worlducationHub",
        content: "worlducationHub completely transformed our school. With the digitized computer lab and smart devices, student engagement in STEM and coding surged overnight.",
        image: "/images/singore.jpeg"
    },
    {
        name: "Kelvin Kiprotich",
        role: "Secondary Student & Coder",
        content: "Using the U-Tab learning tablet gave me access to programming lessons and interactive simulators. worlducationHub helped me see my future in tech.",
        image: "/images/IMG-20260618-WA0006.jpg"
    },
    {
        name: "Wairimu Veronica",
        role: "Administrator, worlducationHub",
        content: "The seasonal summits and educator training hosted by worlducationHub empowered our entire faculty to integrate digital tools into daily classroom lessons.",
        image: "/images/mariasoti.jpg"
    },
    {
        name: "Brian Omondi",
        role: "Summer Coding Bootcamp Delegate",
        content: "Attending the Summer STEM bootcamp allowed me to collaborate with young innovators from across the region. We built our first functional educational software project!",
        image: "/images/IMG-20260618-WA0008.jpg"
    },
    {
        name: "Paul Nyaga",
        role: "Learning Hub Event Planner",
        content: "The speed and reliability of the hardware installation and digital curriculum deployment exceeded all expectations. True pioneers in digital education.",
        image: "/images/tamb.jpg"
    },
    {
        name: "Amina Hassan",
        role: "Regional Digital Ambassador",
        content: "worlducationHub's seasonal event structure ensures that learning never halts. From Spring foundations to Winter global showcases, the impact is immense.",
        image: "/images/IMG-20260618-WA0007.jpg"
    }
];

export default function Testimonials() {
    const { data } = useQuery({
        queryKey: ["testimonials"],
        queryFn: fetchAllTestimonials,
        staleTime: 10 * 60 * 1000,
    });

    const dbTestimonials = data?.testimonials || [];
    const testimonials = dbTestimonials.length > 0
        ? dbTestimonials.map((t: any) => ({
            name: t.author?.name || t.name || "Community Member",
            role: t.role || "Learning Community Delegate",
            content: t.content,
            image: t.imageUrl || "/images/IMG-20260618-WA0008.jpg"
        }))
        : communityFallbacks;

    return (
        <section className="py-24 bg-slate-50 dark:bg-slate-900/40 border-t border-border overflow-hidden">
            <div className="container mx-auto px-4 sm:px-6">
                <div className="text-center mb-16 max-w-2xl mx-auto">
                    <span className="text-xs font-bold text-primary uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full">
                        Voices of Transformation
                    </span>
                    <h2 className="text-3xl sm:text-5xl font-black text-foreground tracking-tight mt-3 mb-4">
                        What Our Learning Community Says
                    </h2>
                    <p className="text-muted-foreground text-base sm:text-lg">
                        Authentic experiences from students, teachers, and school administrators whose learning environments have been digitized.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {testimonials.map((t, i) => (
                        <Card key={i} className="border border-border shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 overflow-hidden bg-card rounded-3xl flex flex-col justify-between">
                            <div className="h-52 overflow-hidden relative bg-slate-900">
                                <img src={t.image} alt={t.name} className="w-full h-full object-cover transition-transform duration-700 hover:scale-105" />
                                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
                            </div>
                            <CardContent className="pt-4 pb-8 px-6 flex-grow flex flex-col justify-between">
                                <div>
                                    <Quote className="h-7 w-7 text-primary/30 mb-3" />
                                    <p className="text-muted-foreground text-sm italic mb-6 leading-relaxed">
                                        "{t.content}"
                                    </p>
                                </div>
                                <div className="flex items-center gap-3 pt-4 border-t border-border">
                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black shrink-0">
                                        {t.name[0]}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-foreground text-sm">{t.name}</h4>
                                        <p className="text-xs text-primary font-medium">{t.role}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
}
