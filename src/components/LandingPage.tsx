import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, Calculator, Globe } from "lucide-react";
import Footer from "./Footer";

// Logos
import dinoLogo from "@/assets/image.png";
import genai from "@/assets/aiWhite.png";

export default function LandingPage() {
    const navigate = useNavigate();

    const features = [
        {
            title: "Centralized Subjects",
            desc: "Access all your organized course materials, PYQs, and notes in one place.",
            icon: BookOpen,
        },
        {
            title: "Study with AI",
            desc: "Get personalized help, concept breakdowns, and generate practice exams.",
            icon: ({ className }) => <img src={genai} alt="AI" className={`opacity-90 ${className}`} />,
        },
        {
            title: "Smart Tracking",
            desc: "Built-in calculators for your SGPA and Attendance to stay on track.",
            icon: Calculator,
        },
        {
            title: "FolioFYX Portfolios",
            desc: "Create a professional portfolio website for free using your student email.",
            icon: Globe,
        },
    ];

    return (
        <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans selection:bg-indigo-500/30 flex flex-col relative overflow-hidden">

            {/* Background Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none z-0" />

            {/* Header (FIXED) */}
            <header className="bg-[#09090b]/60 backdrop-blur-xl sticky top-2 z-20">
                <div className="container mx-auto px-4 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 flex items-center justify-center shrink-0">
                            <img src={dinoLogo} alt="Team Dino" className="w-10 h-10 opacity-90 rounded-xl" />
                        </div>

                        <div className="hidden sm:flex flex-col justify-center leading-tight">

                            {/* TITLE */}
                            <h1 className="text-base font-semibold text-zinc-100">
                                Team Dino
                            </h1>

                            {/* TAGLINE WITH AI ICON (SUBTLE) */}
                            <div className="flex items-center gap-1.5 mt-[2px]">
                                <img src={genai} alt="AI" className="w-3 h-3 opacity-70" />
                                <span className="text-[10px] text-zinc-400 font-medium">
                                    Personalized for you
                                </span>
                            </div>

                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-2 sm:gap-3">
                        <Button
                            variant="ghost"
                            className="text-zinc-400 hover:text-white hover:bg-white/5 rounded-full text-sm px-3 sm:px-4"
                            onClick={() => navigate("/auth")}
                        >
                            Log in
                        </Button>
                        <Button
                            className="bg-white text-black hover:bg-zinc-200 rounded-full font-bold text-sm px-4 sm:px-6"
                            onClick={() => navigate("/auth")}
                        >
                            Get Started
                        </Button>
                    </div>
                </div>
            </header>

            {/* MAIN */}
            <main className="container mx-auto px-4 py-10 sm:py-16 md:py-20 max-w-6xl flex-1 relative z-10">

                {/* HERO */}
                <div className="text-center space-y-6 sm:space-y-8 mb-20 sm:mb-24 animate-in slide-in-from-bottom-4 fade-in duration-1000">

                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2 rounded-full bg-white/5 border border-white/10 text-zinc-300 text-xs font-semibold uppercase">
                        <img src={genai} alt="AI" className="w-4 h-4 sm:w-5 sm:h-5 opacity-90" />
                        <span>AI Personalized Learning</span>
                    </div>

                    {/* 🔥 UPDATED QUOTE */}
                    <h2 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white leading-[1.15]">
                        Stop struggling. Start topping. <br />
                        <span className="text-zinc-400">
                            Turn effort into results.
                        </span>
                    </h2>

                    {/* Description */}
                    <p className="text-base sm:text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed px-2">
                        One place for notes, AI help, and academic tracking. No chaos. Just results.
                    </p>

                    {/* CTA */}
                    <div className="pt-6 flex justify-center">
                        <Button
                            onClick={() => navigate("/auth")}
                            className="h-12 px-6 text-sm sm:text-base bg-white text-black hover:bg-zinc-200 hover:scale-105 transition-all rounded-full font-bold"
                        >
                            Start Studying Now <ArrowRight className="w-4 h-4 ml-2" />            </Button>
                    </div>
                </div>

                {/* FEATURES */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    {features.map((feature, idx) => (
                        <div
                            key={idx}
                            className="bg-[#121214]/80 border border-white/5 rounded-3xl p-6 sm:p-8 hover:bg-[#18181b] transition-all duration-300 text-center sm:text-left"
                        >
                            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-5 border border-white/10">
                                <feature.icon className="w-5 h-5 text-zinc-300" />
                            </div>
                            <h3 className="text-lg sm:text-xl font-semibold text-zinc-100 mb-2">
                                {feature.title}
                            </h3>
                            <p className="text-zinc-400 text-sm sm:text-base">
                                {feature.desc}
                            </p>
                        </div>
                    ))}
                </div>

            </main>

            <Footer />
        </div>
    );
}