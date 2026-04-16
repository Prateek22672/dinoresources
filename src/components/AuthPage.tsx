import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Lock, Mail, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";

import dinoLogo from "@/assets/dinosaurWhite.png";
import genai from "@/assets/aiWhite.png";

export default function AuthPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/` },
    });
    setIsLoading(false);
    if (error) toast.error(error.message);
    else toast.success("Account created! Please check your email to verify.");
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setIsLoading(false);
    if (error) {
      toast.error(error.message);
    } else if (data.user) {
      const deviceToken =
        Date.now().toString(36) + Math.random().toString(36).substring(2);
      localStorage.setItem("device_token", deviceToken);
      await supabase
        .from("profiles")
        .update({ session_token: deviceToken } as any)
        .eq("id", data.user.id);
      toast.success("Welcome back!");
      navigate("/");
    }
  };

  const handleForgotPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsResettingPassword(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get("reset-email") as string;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setIsResettingPassword(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Password reset email sent! Check your inbox.");
      setIsForgotPasswordOpen(false);
    }
  };

  return (
    <div className="auth-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Outfit:wght@300;400;500;600;700;800&display=swap');

        /* ── Root ── */
        .auth-root {
          min-height: 100vh;
          min-height: 100dvh;
          background: #09090b;
          color: #e4e4e7;
          font-family: 'Outfit', system-ui, sans-serif;
          overflow: hidden;
          position: relative;
          display: flex;
          flex-direction: column;
        }

        /* ── Noise grain overlay (matches landing) ── */
        .auth-root::before {
          content: '';
          position: fixed;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E");
          opacity: 0.025;
          pointer-events: none;
          z-index: 999;
        }

        /* ── Grid background (matches landing) ── */
        .auth-grid-bg {
          position: fixed;
          inset: 0;
          background-image:
            linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 40px 40px;
          mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%);
          pointer-events: none;
          z-index: 0;
        }

        /* ── Orbs (same keyframes as landing) ── */
        .auth-orb {
          position: fixed;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
          animation: orbFloat 8s ease-in-out infinite;
        }
        .auth-orb-1 {
          width: 500px; height: 500px;
          top: -180px; left: -80px;
          background: radial-gradient(circle, rgba(34,211,238,0.055), transparent 70%);
          animation-delay: 0s;
        }
        .auth-orb-2 {
          width: 400px; height: 400px;
          bottom: -100px; right: -80px;
          background: radial-gradient(circle, rgba(167,139,250,0.04), transparent 70%);
          animation-delay: 3s;
        }
        .auth-orb-3 {
          width: 350px; height: 350px;
          top: 40%; left: 50%;
          transform: translateX(-50%);
          background: radial-gradient(circle, rgba(52,211,153,0.03), transparent 70%);
          animation-delay: 5s;
        }
        @keyframes orbFloat {
          0%, 100% { transform: translate(0,0) scale(1); }
          33%       { transform: translate(30px,-20px) scale(1.05); }
          66%       { transform: translate(-20px,15px) scale(0.97); }
        }

        /* ── Font helpers ── */
        .font-display { font-family: 'Instrument Serif', Georgia, serif; }
        .grad-cyan {
          background: linear-gradient(135deg, #67e8f9 0%, #34d399 50%, #67e8f9 100%);
          background-size: 200% 200%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: gradShift 5s ease infinite;
        }
        @keyframes gradShift {
          0%,100% { background-position: 0% 50%; }
          50%      { background-position: 100% 50%; }
        }

        /* ── Dino float ── */
        @keyframes dinoFloat {
          0%,100% { transform: translateY(0) rotate(-2deg); }
          50%      { transform: translateY(-14px) rotate(2deg); }
        }
        .dino-float { animation: dinoFloat 5s ease-in-out infinite; }

        /* ── Page entrance ── */
        @keyframes authIn {
          from { opacity: 0; transform: translateY(20px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .auth-enter { animation: authIn 0.7s cubic-bezier(0.22,1,0.36,1) both; }
        .auth-enter-2 { animation: authIn 0.7s cubic-bezier(0.22,1,0.36,1) both; animation-delay: 120ms; }
        .auth-enter-3 { animation: authIn 0.7s cubic-bezier(0.22,1,0.36,1) both; animation-delay: 220ms; }

        /* ── CTA button (matches landing .cta-btn) ── */
        .auth-cta-btn {
          position: relative;
          overflow: hidden;
          background: white;
          color: black;
          border-radius: 9999px;
          width: 100%;
          height: 3rem;
          font-weight: 700;
          font-size: 0.9rem;
          letter-spacing: -0.01em;
          transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
          box-shadow: 0 0 0 0 rgba(255,255,255,0.1);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.45rem;
          cursor: pointer;
          border: none;
          font-family: 'Outfit', sans-serif;
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
        }
        .auth-cta-btn:hover:not(:disabled) {
          transform: scale(1.025) translateY(-1px);
          box-shadow: 0 8px 40px rgba(255,255,255,0.12), 0 2px 8px rgba(0,0,0,0.4);
        }
        .auth-cta-btn:active:not(:disabled) { transform: scale(0.985); }
        .auth-cta-btn:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        /* ── Ghost button ── */
        .auth-ghost-btn {
          background: transparent;
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 9999px;
          padding: 0 1.25rem;
          height: 2.4rem;
          color: #a1a1aa;
          font-size: 0.8rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: 'Outfit', sans-serif;
          display: inline-flex;
          align-items: center;
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
        }
        .auth-ghost-btn:hover { color: #fff; border-color: rgba(255,255,255,0.18); }

        /* ── Badge (matches landing) ── */
        .auth-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 14px;
          border-radius: 9999px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.04);
          font-size: 0.68rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #a1a1aa;
        }

        /* ── Form card ── */
        .auth-card {
          background: #0f0f11;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 28px;
          position: relative;
          overflow: hidden;
        }
        /* top edge line */
        .auth-card::before {
          content: '';
          position: absolute;
          inset-x: 0; top: 0;
          height: 1px;
          background: linear-gradient(to right, transparent, rgba(34,211,238,0.3), rgba(52,211,153,0.2), transparent);
          pointer-events: none;
        }

        /* ── Tab trigger ── */
        .auth-tabs-list {
          background: #0a0a0c;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 9999px;
          padding: 4px;
          height: 44px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0;
        }
        /* Override shadcn trigger defaults */
        .auth-tabs-list [data-state="active"] {
          background: white !important;
          color: black !important;
          border-radius: 9999px;
        }
        .auth-tabs-list [data-state="inactive"] {
          background: transparent !important;
          color: #71717a !important;
        }

        /* ── Input ── */
        .auth-input {
          background: #0a0a0c !important;
          border: 1px solid rgba(255,255,255,0.09) !important;
          border-radius: 14px !important;
          color: white !important;
          height: 48px !important;
          font-size: 0.875rem !important;
          font-family: 'Outfit', sans-serif !important;
          transition: border-color 0.2s ease, box-shadow 0.2s ease !important;
        }
        .auth-input:focus, .auth-input:focus-visible {
          border-color: rgba(34,211,238,0.35) !important;
          box-shadow: 0 0 0 3px rgba(34,211,238,0.07) !important;
          outline: none !important;
          ring: none !important;
        }
        .auth-input::placeholder { color: #3f3f46 !important; }

        /* ── Separator ── */
        .auth-sep {
          height: 1px;
          background: linear-gradient(to right, transparent, rgba(255,255,255,0.07), transparent);
          margin: 0;
        }

        /* ── Left panel quote ── */
        .auth-quote-mark {
          font-family: 'Instrument Serif', Georgia, serif;
          font-size: clamp(5rem, 10vw, 8rem);
          line-height: 0.8;
          color: rgba(255,255,255,0.04);
          pointer-events: none;
          user-select: none;
        }

        /* ── Social proof pill ── */
        .social-proof {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 9999px;
        }
        .avatar-stack {
          display: flex;
          align-items: center;
        }
        .avatar-stack span {
          width: 22px; height: 22px;
          border-radius: 50%;
          border: 1.5px solid #09090b;
          background: linear-gradient(135deg, #27272a, #3f3f46);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 9px;
          font-weight: 700;
          color: #a1a1aa;
          margin-left: -6px;
        }
        .avatar-stack span:first-child { margin-left: 0; }

        /* ── Forgot password link ── */
        .forgot-link {
          background: none;
          border: none;
          padding: 0;
          color: #52525b;
          font-size: 0.78rem;
          font-weight: 500;
          cursor: pointer;
          font-family: 'Outfit', sans-serif;
          transition: color 0.2s;
          -webkit-tap-highlight-color: transparent;
        }
        .forgot-link:hover { color: #a1a1aa; }

        /* ── Dialog override ── */
        .auth-dialog-content {
          background: #121214 !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
          border-radius: 24px !important;
          font-family: 'Outfit', sans-serif !important;
        }

        /* ── Mobile safe area ── */
        @supports (padding: max(0px)) {
          .auth-root {
            padding-bottom: max(0px, env(safe-area-inset-bottom));
          }
        }

        /* ── Scrollable on very small heights ── */
        @media (max-height: 700px) {
          .auth-root {
            overflow-y: auto;
          }
        }
      `}</style>

      {/* ── Background layers ── */}
      <div className="auth-grid-bg" />
      <div className="auth-orb auth-orb-1" />
      <div className="auth-orb auth-orb-2" />
      <div className="auth-orb auth-orb-3" />

      {/* ── Header ── */}
      <header
        style={{
          position: "relative",
          zIndex: 10,
          padding: "1rem 1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid rgba(255,255,255,0.04)",
          background: "rgba(9,9,11,0.5)",
          backdropFilter: "blur(16px)",
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => navigate("/")}
          style={{
            display: "flex", alignItems: "center", gap: 10,
            background: "none", border: "none", cursor: "pointer",
            padding: 0,
            WebkitTapHighlightColor: "transparent",
          }}
        >
          <div
            style={{
              width: 36, height: 36,
              borderRadius: 10,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.2s",
              flexShrink: 0,
            }}
          >
            <img src={dinoLogo} alt="" style={{ width: 20, height: 20, opacity: 0.9 }} />
          </div>
          <span
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: 15, fontWeight: 600,
              color: "#f4f4f5", letterSpacing: "-0.02em",
            }}
          >
            Team Dino
          </span>
        </button>

        <button
          onClick={() => navigate("/")}
          className="auth-ghost-btn"
        >
          ← Back to home
        </button>
      </header>

      {/* ── Main content ── */}
      <main
        style={{
          flex: 1,
          position: "relative",
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem 1rem",
          gap: 0,
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 960,
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: "2.5rem",
            alignItems: "center",
          }}
          // Two-column on md+
          className="auth-layout"
        >
          <style>{`
            @media (min-width: 768px) {
              .auth-layout {
                grid-template-columns: 1fr 1fr !important;
                gap: 4rem !important;
              }
              .auth-left-panel { display: flex !important; }
              .auth-left-mobile-top { display: none !important; }
            }
            @media (max-width: 767px) {
              .auth-left-panel { display: none !important; }
              .auth-left-mobile-top { display: flex !important; }
            }
          `}</style>

          {/* ── LEFT PANEL (desktop only) ── */}
          <div
            className="auth-left-panel auth-enter"
            style={{
              flexDirection: "column",
              alignItems: "flex-start",
              gap: "2rem",
              display: "none", /* overridden by media query above */
            }}
          >
            {/* Badge */}
            <div className="auth-badge">
              <img src={genai} alt="" style={{ width: 11, height: 11, opacity: 0.7 }} />
              Your study companion
            </div>

            {/* Headline */}
            <div>
              <p
                className="font-display"
                style={{
                  fontSize: "clamp(2.5rem, 4.5vw, 3.8rem)",
                  fontWeight: 400,
                  letterSpacing: "-0.03em",
                  lineHeight: 1.08,
                  color: "#fafafa",
                  marginBottom: "0.2rem",
                }}
              >
                Every exam,
              </p>
              <p
                className="font-display grad-cyan"
                style={{
                  fontSize: "clamp(2.5rem, 4.5vw, 3.8rem)",
                  fontWeight: 400,
                  fontStyle: "italic",
                  letterSpacing: "-0.03em",
                  lineHeight: 1.08,
                  marginBottom: "0.2rem",
                  display: "block",
                }}
              >
                every subject,
              </p>
              <p
                className="font-display"
                style={{
                  fontSize: "clamp(2.5rem, 4.5vw, 3.8rem)",
                  fontWeight: 400,
                  letterSpacing: "-0.03em",
                  lineHeight: 1.08,
                  color: "#3f3f46",
                }}
              >
                covered.
              </p>
            </div>

            {/* Sub copy */}
            <p
              style={{
                fontSize: "0.9rem",
                color: "#52525b",
                lineHeight: 1.75,
                maxWidth: 360,
                fontWeight: 400,
              }}
            >
              Notes, PYQs, AI help, attendance tracking — everything a GITAM
              student actually needs, in one place.
            </p>

            {/* Social proof */}
            <div className="social-proof">
              <div className="avatar-stack">
                {["A", "R", "S", "K"].map((l, i) => (
                  <span key={i}>{l}</span>
                ))}
              </div>
              <span style={{ fontSize: "0.75rem", color: "#71717a", fontWeight: 500 }}>
                900+ students already inside
              </span>
            </div>

            {/* Dino illustration */}
            <div style={{ marginTop: "auto", paddingTop: "1.5rem" }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 80, height: 80,
                  borderRadius: 24,
                  background: "rgba(255,255,255,0.025)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <img
                  src={dinoLogo}
                  alt=""
                  className="dino-float"
                  style={{ width: 46, height: 46, opacity: 0.65 }}
                />
              </div>
            </div>
          </div>

          {/* ── MOBILE TOP (branding above form) ── */}
          <div
            className="auth-left-mobile-top auth-enter"
            style={{
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              gap: "0.75rem",
            }}
          >
            <div
              style={{
                width: 60, height: 60,
                borderRadius: 18,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.09)",
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: 4,
              }}
            >
              <img src={dinoLogo} alt="" className="dino-float" style={{ width: 36, height: 36, opacity: 0.8 }} />
            </div>
            <h1
              className="font-display"
              style={{
                fontSize: "clamp(1.9rem, 8vw, 2.8rem)",
                fontWeight: 400,
                letterSpacing: "-0.03em",
                lineHeight: 1.1,
                color: "#fafafa",
              }}
            >
              Team{" "}
              <span className="grad-cyan" style={{ fontStyle: "italic" }}>Dino</span>
            </h1>
            <p style={{ fontSize: "0.8rem", color: "#52525b", fontWeight: 500 }}>
              Your last-minute study survival kit
            </p>
          </div>

          {/* ── RIGHT PANEL — the form card ── */}
          <div className="auth-enter-2">
            <div className="auth-card">
              {/* Inner padding */}
              <div style={{ padding: "clamp(20px, 5vw, 32px)" }}>

                {/* Card header */}
                <div style={{ marginBottom: "1.75rem" }}>

                  <p
                    style={{
                      fontSize: "1.15rem",
                      fontWeight: 700,
                      color: "#e4e4e7",
                      letterSpacing: "-0.02em",
                      lineHeight: 1.3,
                    }}
                  >
                    Sign in to your workspace
                  </p>
                  <p style={{ fontSize: "0.8rem", color: "#52525b", marginTop: 4, fontWeight: 400 }}>
                    Access notes, AI help, and everything else.
                  </p>
                </div>

                <Tabs defaultValue="signin" className="w-full">
                  {/* Tab switcher */}
                  <TabsList
                    className="auth-tabs-list w-full mb-6"
                    style={{
                      background: "#0a0a0c",
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: 9999,
                      padding: 4,
                      height: 44,
                    }}
                  >
                    <TabsTrigger
                      value="signin"
                      style={{
                        borderRadius: 9999,
                        fontFamily: "'Outfit', sans-serif",
                        fontWeight: 600,
                        fontSize: "0.85rem",
                        transition: "all 0.2s",
                        height: "100%",
                        border: "none",
                      }}
                    >
                      Log In
                    </TabsTrigger>
                    <TabsTrigger
                      value="signup"
                      style={{
                        borderRadius: 9999,
                        fontFamily: "'Outfit', sans-serif",
                        fontWeight: 600,
                        fontSize: "0.85rem",
                        transition: "all 0.2s",
                        height: "100%",
                        border: "none",
                      }}
                    >
                      Create Account
                    </TabsTrigger>
                  </TabsList>

                  {/* ── SIGN IN ── */}
                  <TabsContent value="signin" style={{ marginTop: 0 }}>
                    <form onSubmit={handleSignIn} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                      {/* Email */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <Label
                          htmlFor="signin-email"
                          style={{
                            fontSize: "0.78rem", fontWeight: 500,
                            color: "#71717a", paddingLeft: 4,
                            fontFamily: "'Outfit', sans-serif",
                          }}
                        >
                          Email Address
                        </Label>
                        <div style={{ position: "relative" }}>
                          <Mail
                            style={{
                              position: "absolute", left: 14, top: "50%",
                              transform: "translateY(-50%)",
                              width: 15, height: 15, color: "#3f3f46",
                            }}
                          />
                          <Input
                            id="signin-email"
                            name="email"
                            type="email"
                            placeholder="name@university.edu"
                            className="auth-input"
                            style={{ paddingLeft: 40 }}
                            required
                          />
                        </div>
                      </div>

                      {/* Password */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingLeft: 4, paddingRight: 4 }}>
                          <Label
                            htmlFor="signin-password"
                            style={{
                              fontSize: "0.78rem", fontWeight: 500,
                              color: "#71717a",
                              fontFamily: "'Outfit', sans-serif",
                            }}
                          >
                            Password
                          </Label>
                          <Dialog open={isForgotPasswordOpen} onOpenChange={setIsForgotPasswordOpen}>
                            <DialogTrigger asChild>
                              <button type="button" className="forgot-link">
                                Forgot password?
                              </button>
                            </DialogTrigger>
                            <DialogContent
                              className="auth-dialog-content"
                              style={{
                                background: "#121214",
                                border: "1px solid rgba(255,255,255,0.1)",
                                borderRadius: 24,
                                fontFamily: "'Outfit', sans-serif",
                                maxWidth: 400,
                              }}
                            >
                              <DialogHeader>
                                <div
                                  style={{
                                    width: 42, height: 42,
                                    borderRadius: 12,
                                    background: "rgba(255,255,255,0.06)",
                                    border: "1px solid rgba(255,255,255,0.1)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    marginBottom: 12,
                                  }}
                                >
                                  <ShieldCheck style={{ width: 18, height: 18, color: "#67e8f9" }} />
                                </div>
                                <DialogTitle style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, color: "#f4f4f5" }}>
                                  Reset Password
                                </DialogTitle>
                                <DialogDescription style={{ fontFamily: "'Outfit', sans-serif", color: "#52525b", fontSize: "0.83rem" }}>
                                  Enter your registered email and we'll send you a secure reset link.
                                </DialogDescription>
                              </DialogHeader>
                              <form onSubmit={handleForgotPassword} style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: 8 }}>
                                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                  <Label htmlFor="reset-email" style={{ fontFamily: "'Outfit', sans-serif", fontSize: "0.78rem", color: "#71717a" }}>
                                    Email Address
                                  </Label>
                                  <Input
                                    id="reset-email"
                                    name="reset-email"
                                    type="email"
                                    placeholder="name@university.edu"
                                    className="auth-input"
                                    required
                                  />
                                </div>
                                <button type="submit" className="auth-cta-btn" disabled={isResettingPassword}>
                                  {isResettingPassword ? "Sending…" : "Send Reset Link"}
                                  {!isResettingPassword && <ArrowRight style={{ width: 15, height: 15 }} />}
                                </button>
                              </form>
                            </DialogContent>
                          </Dialog>
                        </div>
                        <div style={{ position: "relative" }}>
                          <Lock
                            style={{
                              position: "absolute", left: 14, top: "50%",
                              transform: "translateY(-50%)",
                              width: 15, height: 15, color: "#3f3f46",
                            }}
                          />
                          <Input
                            id="signin-password"
                            name="password"
                            type="password"
                            placeholder="••••••••"
                            className="auth-input"
                            style={{ paddingLeft: 40 }}
                            required
                          />
                        </div>
                      </div>

                      {/* Divider */}
                      <div style={{ height: 4 }} />

                      {/* Submit */}
                      <button type="submit" className="auth-cta-btn" disabled={isLoading}>
                        {isLoading ? "Authenticating…" : "Log In"}
                        {!isLoading && <ArrowRight style={{ width: 15, height: 15 }} />}
                      </button>

                      <p style={{ textAlign: "center", fontSize: "0.72rem", color: "#27272a", fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                        Trusted by 900+ students
                      </p>
                    </form>
                  </TabsContent>

                  {/* ── SIGN UP ── */}
                  <TabsContent value="signup" style={{ marginTop: 0 }}>
                    <form onSubmit={handleSignUp} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                      {/* Email */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <Label
                          htmlFor="signup-email"
                          style={{
                            fontSize: "0.78rem", fontWeight: 500,
                            color: "#71717a", paddingLeft: 4,
                            fontFamily: "'Outfit', sans-serif",
                          }}
                        >
                          University Email
                        </Label>
                        <div style={{ position: "relative" }}>
                          <Mail
                            style={{
                              position: "absolute", left: 14, top: "50%",
                              transform: "translateY(-50%)",
                              width: 15, height: 15, color: "#3f3f46",
                            }}
                          />
                          <Input
                            id="signup-email"
                            name="email"
                            type="email"
                            placeholder="name@university.edu"
                            className="auth-input"
                            style={{ paddingLeft: 40 }}
                            required
                          />
                        </div>
                      </div>

                      {/* Password */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <Label
                          htmlFor="signup-password"
                          style={{
                            fontSize: "0.78rem", fontWeight: 500,
                            color: "#71717a", paddingLeft: 4,
                            fontFamily: "'Outfit', sans-serif",
                          }}
                        >
                          Create Password
                        </Label>
                        <div style={{ position: "relative" }}>
                          <Lock
                            style={{
                              position: "absolute", left: 14, top: "50%",
                              transform: "translateY(-50%)",
                              width: 15, height: 15, color: "#3f3f46",
                            }}
                          />
                          <Input
                            id="signup-password"
                            name="password"
                            type="password"
                            placeholder="Minimum 6 characters"
                            minLength={6}
                            className="auth-input"
                            style={{ paddingLeft: 40 }}
                            required
                          />
                        </div>
                      </div>

                      <div style={{ height: 4 }} />

                      <button type="submit" className="auth-cta-btn" disabled={isLoading}>
                        {isLoading ? "Creating account…" : "Create Account"}
                        {!isLoading && <ArrowRight style={{ width: 15, height: 15 }} />}
                      </button>

                      <p style={{ textAlign: "center", fontSize: "0.72rem", color: "#27272a", fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                        Free to start · No card needed
                      </p>
                    </form>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Card footer */}
              <div className="auth-sep" />
              <div
                style={{
                  padding: "14px clamp(20px, 5vw, 32px)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                <img src={genai} alt="" style={{ width: 11, height: 11, opacity: 0.4 }} />
                <p style={{ fontSize: "0.72rem", color: "#27272a", fontWeight: 500, letterSpacing: "0.02em" }}>
                  By continuing, you agree to our Terms & Privacy Policy
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}