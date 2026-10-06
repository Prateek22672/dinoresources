import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Lock, Mail, ArrowRight, ShieldCheck, Sparkles, ArrowLeft, User, Phone, MailCheck, FileText, Star, BrainCircuit, Calculator } from "lucide-react";
import dinoLogo from "@/assets/dinosaurWhite.png";

/**
 * Hover movement for the brand tiles: each tile leans a few degrees toward
 * the pointer and lifts, with a soft light following it. Written to CSS
 * variables so the motion runs on the compositor; .td-tilt in the page
 * styles does the rest (and is switched off under reduced motion).
 */
const tilt = {
  onMouseMove: (e: React.MouseEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    e.currentTarget.style.setProperty("--rx", `${(-y * 7).toFixed(2)}deg`);
    e.currentTarget.style.setProperty("--ry", `${(x * 9).toFixed(2)}deg`);
    e.currentTarget.style.setProperty("--mx", `${((x + 0.5) * 100).toFixed(1)}%`);
    e.currentTarget.style.setProperty("--my", `${((y + 0.5) * 100).toFixed(1)}%`);
  },
  onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.setProperty("--rx", "0deg");
    e.currentTarget.style.setProperty("--ry", "0deg");
  },
};

export default function AuthPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [signupEmail, setSignupEmail] = useState<string | null>(null);
  /** Set when signup was for an address that already has an account. */
  const [alreadyRegistered, setAlreadyRegistered] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const fullName = ((formData.get("fullName") as string) || "").trim();
    const phone = ((formData.get("phone") as string) || "").trim();
    if (!fullName) { setIsLoading(false); toast.error("Please enter your full name"); return; }
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        // captured into profiles by the handle_new_user trigger
        data: { full_name: fullName, phone: phone || null },
      },
    });
    setIsLoading(false);
    if (error) { toast.error(error.message); return; }

    // Supabase deliberately reports success when the email is already
    // registered, so it can't be used to discover who has an account. It sends
    // no email in that case, which is indistinguishable from a delivery failure
    // unless we check: an existing user comes back with an empty `identities`.
    // Telling them to check an inbox that will stay empty is the worst answer.
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      setAlreadyRegistered(email);
      return;
    }
    setSignupEmail(email);
  };

  const handleResend = async () => {
    if (!signupEmail) return;
    setIsResending(true);
    const { error } = await supabase.auth.resend({ type: "signup", email: signupEmail });
    setIsResending(false);
    if (error) toast.error(error.message);
    else toast.success("Verification email resent.");
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    // Mint this device's token BEFORE auth so the session guard's claim
    // always finds it — the freshest login owns the session.
    const deviceToken = Date.now().toString(36) + Math.random().toString(36).substring(2);
    localStorage.setItem("device_token", deviceToken);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setIsLoading(false);
    if (error) {
      toast.error(error.message);
    } else if (data.user) {
      await supabase.from("profiles").update({ session_token: deviceToken } as any).eq("id", data.user.id);
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
    // Supabase reports success whether or not that address has an account, so
    // promising an email that may never come is a promise we can't keep.
    else { toast.success("If that email has an account, a reset link is on its way."); setIsForgotPasswordOpen(false); }
  };

  const field =
    "w-full h-11 rounded-2xl bg-white/[0.03] border border-white/10 pl-10 pr-3 text-[13px] text-white hover:border-white/20 " +
    "placeholder:text-zinc-600 outline-none transition-shadow td-auth-field";

  return (
    <div className="td-force-dark min-h-[100dvh] lg:h-[100dvh] bg-[#0b0b0e] text-zinc-100 font-sans flex flex-col relative overflow-hidden">
      <style>{`
        .td-auth-field:focus {
          border-color: rgb(var(--td-accent-rgb) / 0.55);
          box-shadow: 0 0 0 3px rgb(var(--td-accent-rgb) / 0.16);
        }
        /* kill Chrome's blue autofill wash — keep our dark field */
        .td-auth-field:-webkit-autofill,
        .td-auth-field:-webkit-autofill:hover,
        .td-auth-field:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 1000px #101014 inset !important;
          -webkit-text-fill-color: #ffffff !important;
          caret-color: #ffffff;
          border-color: rgba(255,255,255,0.12);
          transition: background-color 99999s ease-in-out 0s;
        }
        @keyframes tdAuthIn { from { opacity:0; transform: translateY(16px); } to { opacity:1; transform:none; } }
        /* bento tiles that lean toward the pointer, with a light that follows it */
        .td-tilt {
          transform: perspective(900px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg)) translateY(var(--ty, 0px));
          transition: transform .45s cubic-bezier(.2,.8,.2,1), box-shadow .45s ease;
          will-change: transform; position: relative; overflow: hidden;
        }
        .td-tilt:hover { --ty: -6px; box-shadow: 0 30px 60px -28px rgba(0,0,0,0.85); transition-duration: .2s, .45s; }
        .td-tilt::after {
          content: ""; position: absolute; inset: 0; pointer-events: none; opacity: 0; transition: opacity .3s;
          background: radial-gradient(260px circle at var(--mx, 50%) var(--my, 50%), rgba(255,255,255,0.16), transparent 60%);
        }
        .td-tilt:hover::after { opacity: 1; }
        /* drifting accent light behind everything */
        @keyframes tdBlob { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(40px,-30px) scale(1.12); } }
        .td-auth-blob { position: absolute; border-radius: 9999px; filter: blur(70px); animation: tdBlob 16s ease-in-out infinite; }
        /* the form card glows in the accent while you type in it */
        .td-auth-card { transition: box-shadow .4s ease, border-color .4s ease; }
        .td-auth-card:focus-within { border-color: rgb(var(--td-accent-rgb) / 0.4); box-shadow: 0 0 0 1px rgb(var(--td-accent-rgb) / 0.25), 0 30px 90px -25px rgb(var(--td-accent-rgb) / 0.35); }
        @media (prefers-reduced-motion: reduce) { .td-tilt, .td-auth-blob { animation: none; transform: none !important; transition: none; } }
        .td-auth-in  { animation: tdAuthIn .6s cubic-bezier(.22,1,.36,1) both; }
        .td-auth-in2 { animation: tdAuthIn .6s cubic-bezier(.22,1,.36,1) both; animation-delay:.1s; }
      `}</style>

      {/* Faint grid (renders as solid hairlines) */}
      <div className="pointer-events-none absolute inset-0 z-0" style={{
        backgroundImage:
          "linear-gradient(to right, rgba(255,255,255,0.035) 1px, transparent 1px)," +
          "linear-gradient(to bottom, rgba(255,255,255,0.035) 1px, transparent 1px)",
        backgroundSize: "42px 42px",
        maskImage: "radial-gradient(ellipse 75% 70% at 50% 35%, black 25%, transparent 100%)",
        WebkitMaskImage: "radial-gradient(ellipse 75% 70% at 50% 35%, black 25%, transparent 100%)",
      }} />

      {/* drifting accent light */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <span className="td-auth-blob w-[460px] h-[460px] -top-40 -left-24" style={{ background: "rgb(var(--td-accent-rgb) / 0.22)" }} />
        <span className="td-auth-blob w-[380px] h-[380px] bottom-[-140px] right-[-80px]" style={{ background: "rgb(var(--td-accent-rgb) / 0.16)", animationDelay: "-6s" }} />
        <span className="td-auth-blob w-[260px] h-[260px] top-1/3 left-1/2" style={{ background: "rgba(242,191,156,0.10)", animationDelay: "-11s" }} />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-4 sm:px-6 h-14 shrink-0">
        <button onClick={() => navigate("/")} className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center">
            <img src={dinoLogo} alt="" className="w-5 h-5 opacity-90" />
          </div>
          <span className="font-bold tracking-tight">TeamDino</span>
        </button>
        <button onClick={() => navigate("/")} className="td-btn-ghost px-4 py-2 rounded-full text-[13px] font-medium flex items-center gap-1.5">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to home
        </button>
      </header>

      {/* Main — scrolls if the form is taller than the viewport (short screens) */}
      <main className="relative z-10 flex-1 min-h-0 overflow-y-auto">
        <div className="min-h-full flex items-center justify-center px-4 py-6">
        <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left — brand as a bento (desktop). Every tile leans toward the pointer. */}
          <div className="hidden lg:grid grid-cols-6 gap-3 td-auth-in">
            <div {...tilt} className="td-tilt td-bento td-bento-accent col-span-6 p-7 min-h-[230px] flex flex-col justify-between">
              <span aria-hidden className="absolute -right-10 -bottom-16 w-[200px] h-[200px] rounded-full td-bento-sphere" />
              <span className="relative z-10 td-bento-ghost inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold w-fit">
                <Sparkles className="w-3.5 h-3.5" /> Your study companion
              </span>
              <h1 className="relative z-10 text-[2.5rem] xl:text-[2.8rem] font-extrabold tracking-tight leading-[1.02] max-w-[78%]">
                Every exam, every subject, covered.
              </h1>
            </div>

            {[
              { t: "Notes & material", d: "Unit-wise, for every subject", icon: FileText, cls: "td-bento-deep", span: "col-span-3" },
              { t: "Important Qs & PYQs", d: "What actually gets asked", icon: Star, cls: "bg-[#17171c] border border-white/10", span: "col-span-3" },
              { t: "Rex, the AI tutor", d: "Explains from your own material", icon: BrainCircuit, cls: "bg-[#17171c] border border-white/10", span: "col-span-2" },
              { t: "Free calculators", d: "SGPA · CGPA · attendance", icon: Calculator, cls: "td-bento-ink", span: "col-span-2" },
            ].map((f) => (
              <div key={f.t} {...tilt} className={`td-tilt td-bento ${f.cls} ${f.span} p-5 min-h-[128px] flex flex-col justify-between`}>
                <span className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center"><f.icon className="w-4 h-4" /></span>
                <span>
                  <span className="block text-[15px] font-bold leading-tight">{f.t}</span>
                  <span className="block text-[12px] opacity-60 mt-0.5">{f.d}</span>
                </span>
              </div>
            ))}

            <div {...tilt} className="td-tilt td-bento td-bento-accent col-span-2 p-5 min-h-[128px] flex flex-col justify-between">
              <div className="flex -space-x-2">
                {["A", "R", "S"].map((l) => (
                  <span key={l} className="w-8 h-8 rounded-full bg-[#0d0d0d] text-white border-2 border-white/40 flex items-center justify-center text-[11px] font-bold">{l}</span>
                ))}
              </div>
              <span>
                <span className="block text-[1.6rem] font-extrabold leading-none">1500+</span>
                <span className="block text-[12px] opacity-70 mt-1">students already inside</span>
              </span>
            </div>
          </div>

          {/* Right — form card */}
          <div className="td-auth-in2 w-full max-w-md mx-auto lg:mx-0 lg:justify-self-end">
            <div className="td-auth-card rounded-[28px] bg-[#121216]/90 backdrop-blur-xl border border-white/10 p-6 sm:p-7 shadow-[0_30px_90px_-25px_rgba(0,0,0,0.9)]">
              {alreadyRegistered ? (
                /* No email is on its way for this address, so don't send them to
                   wait at an empty inbox — give them the two routes that work. */
                <div className="td-auth-in flex flex-col items-center text-center py-4">
                  <div className="w-16 h-16 rounded-2xl td-accent-bg flex items-center justify-center mb-4">
                    <MailCheck className="w-7 h-7" />
                  </div>
                  <h2 className="text-xl font-bold tracking-tight">You already have an account</h2>
                  <p className="text-zinc-400 text-sm mt-2 max-w-xs">
                    <span className="text-white font-medium">{alreadyRegistered}</span> is already registered, so we haven&apos;t sent a new verification email. Log in instead — or reset your password if you&apos;ve forgotten it.
                  </p>
                  <div className="flex flex-col gap-2.5 w-full mt-6">
                    <button
                      type="button"
                      onClick={() => { setAlreadyRegistered(null); setIsForgotPasswordOpen(true); }}
                      className="td-btn-ghost h-11 rounded-full text-sm font-semibold flex items-center justify-center gap-2"
                    >
                      Reset my password
                    </button>
                    <button type="button" onClick={() => setAlreadyRegistered(null)} className="text-xs font-medium text-zinc-500 hover:text-white transition-colors">
                      Back to log in
                    </button>
                  </div>
                </div>
              ) : signupEmail ? (
                /* Post-signup — a real screen to check, not just a toast that vanishes */
                <div className="td-auth-in flex flex-col items-center text-center py-4">
                  <div className="w-16 h-16 rounded-2xl td-accent-bg flex items-center justify-center mb-4">
                    <MailCheck className="w-7 h-7" />
                  </div>
                  <h2 className="text-xl font-bold tracking-tight">Check your inbox</h2>
                  <p className="text-zinc-400 text-sm mt-2 max-w-xs">
                    We've sent a verification link to <span className="text-white font-medium">{signupEmail}</span>. Open it to activate your account, then come back and log in.
                  </p>
                  <p className="text-zinc-600 text-xs mt-3">Not there yet? Check spam or promotions too.</p>
                  <div className="flex flex-col gap-2.5 w-full mt-6">
                    <button onClick={handleResend} disabled={isResending} className="td-btn-ghost h-11 rounded-full text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60">
                      {isResending ? "Resending…" : "Resend email"}
                    </button>
                    <button type="button" onClick={() => setSignupEmail(null)} className="text-xs font-medium text-zinc-500 hover:text-white transition-colors">
                      Wrong email? Go back
                    </button>
                  </div>
                </div>
              ) : (
              <>
              {/* Mobile brand */}
              <div className="lg:hidden flex flex-col items-center text-center mb-6">
                <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center mb-3">
                  <img src={dinoLogo} alt="" className="w-8 h-8 opacity-90" />
                </div>
                <h1 className="text-2xl font-extrabold tracking-tight">TeamDino</h1>
                <p className="text-zinc-500 text-sm mt-1">Your last-minute study survival kit</p>
                <div className="flex flex-wrap justify-center gap-1.5 mt-3">
                  {["Notes", "Important Qs", "PYQs", "AI tutor", "Free calculators"].map((c) => (
                    <span key={c} className="rounded-full px-2.5 py-1 text-[11px] font-semibold bg-white/[0.06] border border-white/10 text-zinc-300">{c}</span>
                  ))}
                </div>
              </div>

              <div className="mb-5">
                <h2 className="text-[1.4rem] font-extrabold tracking-tight">Welcome to TeamDino</h2>
                <p className="text-zinc-500 text-[13px] mt-1">Log in, or create a free account in under a minute.</p>
              </div>

              <Tabs defaultValue="signin" className="w-full">
                <TabsList className="grid grid-cols-2 gap-1 w-full h-11 p-1 mb-5 rounded-full bg-white/[0.04] border border-white/[0.07]">
                  <TabsTrigger value="signin" className="rounded-full text-sm font-semibold data-[state=active]:bg-white data-[state=active]:text-black data-[state=inactive]:text-zinc-500">Log In</TabsTrigger>
                  <TabsTrigger value="signup" className="rounded-full text-sm font-semibold data-[state=active]:bg-white data-[state=active]:text-black data-[state=inactive]:text-zinc-500">Create Account</TabsTrigger>
                </TabsList>

                {/* Sign in */}
                <TabsContent value="signin" className="mt-0">
                  <form onSubmit={handleSignIn} className="flex flex-col gap-2.5">
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="signin-email" className="text-xs font-medium text-zinc-400 pl-1">Email address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                        <input id="signin-email" name="email" type="email" placeholder="name@university.edu" className={field} required />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between px-1">
                        <Label htmlFor="signin-password" className="text-xs font-medium text-zinc-400">Password</Label>
                        <Dialog open={isForgotPasswordOpen} onOpenChange={setIsForgotPasswordOpen}>
                          <DialogTrigger asChild>
                            <button type="button" className="text-xs font-medium text-zinc-500 hover:text-white transition-colors">Forgot password?</button>
                          </DialogTrigger>
                          <DialogContent className="rounded-3xl bg-[#141416] border border-white/10 text-zinc-100 font-sans">
                            <DialogHeader>
                              <div className="w-11 h-11 rounded-2xl bg-white/[0.06] border border-white/10 flex items-center justify-center mb-3">
                                <ShieldCheck className="w-5 h-5" style={{ color: "var(--td-accent-soft)" }} />
                              </div>
                              <DialogTitle className="font-bold">Reset password</DialogTitle>
                              <DialogDescription className="text-zinc-500 text-sm">Enter your registered email and we'll send you a secure reset link.</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleForgotPassword} className="flex flex-col gap-4 mt-2">
                              <div className="flex flex-col gap-1">
                                <Label htmlFor="reset-email" className="text-xs font-medium text-zinc-400 pl-1">Email address</Label>
                                <div className="relative">
                                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                                  <input id="reset-email" name="reset-email" type="email" placeholder="name@university.edu" className={field} required />
                                </div>
                              </div>
                              <button type="submit" disabled={isResettingPassword} className="td-btn-primary h-12 flex items-center justify-center gap-2 text-sm disabled:opacity-60">
                                {isResettingPassword ? "Sending…" : <>Send reset link <ArrowRight className="w-4 h-4" /></>}
                              </button>
                            </form>
                          </DialogContent>
                        </Dialog>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                        <input id="signin-password" name="password" type="password" placeholder="••••••••" className={field} required />
                      </div>
                    </div>
                    <button type="submit" disabled={isLoading} className="td-btn-primary h-12 mt-1 flex items-center justify-center gap-2 text-sm disabled:opacity-60">
                      {isLoading ? "Authenticating…" : <>Log In <ArrowRight className="w-4 h-4" /></>}
                    </button>
                    <p className="text-center text-[11px] uppercase tracking-wider text-zinc-600 font-medium">Trusted by 1500+ signups</p>
                  </form>
                </TabsContent>

                {/* Sign up */}
                <TabsContent value="signup" className="mt-0">
                  <form onSubmit={handleSignUp} className="flex flex-col gap-2.5">
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="signup-name" className="text-xs font-medium text-zinc-400 pl-1">Full name</Label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                        <input id="signup-name" name="fullName" type="text" autoComplete="name" placeholder="Your full name" className={field} required />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="signup-email" className="text-xs font-medium text-zinc-400 pl-1">University email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                        <input id="signup-email" name="email" type="email" placeholder="name@university.edu" className={field} required />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="signup-phone" className="text-xs font-medium text-zinc-400 pl-1">Phone <span className="text-zinc-600 font-normal">· optional</span></Label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                        <input id="signup-phone" name="phone" type="tel" autoComplete="tel" inputMode="tel" placeholder="10-digit mobile (optional)" className={field} />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="signup-password" className="text-xs font-medium text-zinc-400 pl-1">Create password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                        <input id="signup-password" name="password" type="password" placeholder="Minimum 6 characters" minLength={6} className={field} required />
                      </div>
                    </div>
                    <button type="submit" disabled={isLoading} className="td-btn-primary h-12 mt-1 flex items-center justify-center gap-2 text-sm disabled:opacity-60">
                      {isLoading ? "Creating account…" : <>Create Account <ArrowRight className="w-4 h-4" /></>}
                    </button>
                    <p className="text-center text-[11px] uppercase tracking-wider text-zinc-600 font-medium">Free to start · No card needed</p>
                  </form>
                </TabsContent>
              </Tabs>
              </>
              )}

              <div className="h-px bg-white/[0.06] my-4" />
              <p className="text-center text-[11px] text-zinc-600 flex items-center justify-center gap-1.5">
                <Sparkles className="w-3 h-3" /> By continuing, you agree to our Terms &amp; Privacy Policy
              </p>
            </div>
          </div>
        </div>
        </div>
      </main>
    </div>
  );
}
