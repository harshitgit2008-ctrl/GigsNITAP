import React, { useState, useMemo, useEffect } from "react";
import {
  Search, MapPin, Clock, Star, CheckCircle2, Zap, MessageCircle, User as UserIcon,
  Plus, Shield, DollarSign, Award, Send, Paperclip, Sparkles, Briefcase, 
  GraduationCap, AlertTriangle, Check, Users, Home, LayoutGrid, Mail, 
  ArrowRight, ArrowLeft, Flame, BadgeCheck, Wallet, FileText,
  MessageSquareWarning, ChevronLeft, Settings, Loader2
} from "lucide-react";
import { getGigs, createGig, registerUser } from "./api/client";

const CATEGORIES = ["All", "Tutoring", "Moving", "Tech", "Design", "Events"];

const CATEGORY_STYLES = {
  Tutoring: "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-500/10 dark:text-violet-300 dark:border-violet-500/20",
  Moving: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20",
  Tech: "bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/20",
  Design: "bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-500/10 dark:text-pink-300 dark:border-pink-500/20",
  Events: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20",
  All: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-500/10 dark:text-slate-300 dark:border-slate-500/20",
};

const FREELANCERS = [
  {
    id: "f1",
    name: "Priya Nair",
    initials: "PN",
    major: "Computer Science",
    year: "Junior",
    rating: 4.9,
    reviews: 62,
    skills: ["Python", "Tutoring", "Data Structures"],
    rate: 22,
    availableNow: true,
    portfolio: ["DSA Crash Course Notes", "CS101 Grade Report — A"],
  },
  {
    id: "f2",
    name: "Marcus Chen",
    initials: "MC",
    major: "Graphic Design",
    year: "Senior",
    rating: 5.0,
    reviews: 41,
    skills: ["Figma", "Branding", "Illustration"],
    rate: 35,
    availableNow: false,
    portfolio: ["Homecoming Poster Series", "Startup Pitch Deck"],
  }
];

const CONVERSATIONS = [
  {
    id: "c1",
    name: "Ravi Shah",
    initials: "RS",
    gigTitle: "Calculus II Tutor Needed Tonight",
    escrow: 45,
    lastMessage: "Sounds good, see you at 7!",
    unread: 2,
    role: "buyer",
    messages: [
      { id: 1, type: "system", text: "Gig accepted by Jordan Kim." },
      { id: 2, type: "system", text: "Escrow Funded — $45.00 locked." },
      { id: 3, type: "them", text: "Hey! Thanks for picking this up, are you free around 7pm?" },
      { id: 4, type: "me", text: "Yep, 7pm works. I'll bring practice problems on related rates." },
      { id: 5, type: "them", text: "Sounds good, see you at 7!" },
    ],
  }
];

const SKILL_TAGS = [
  "Tutoring", "Design", "Coding", "Moving", "Photography", "Writing",
  "Event Planning", "Music", "Video Editing", "Math", "Languages",
];

function estimatePrice(title, category, description) {
  const text = `${title} ${description}`.toLowerCase();
  const base = {
    Tutoring: [18, 30],
    Moving: [25, 55],
    Tech: [15, 35],
    Design: [30, 70],
    Events: [20, 60],
    All: [15, 35],
  }[category] || [15, 35];

  let [low, high] = base;
  const boostWords = ["urgent", "tonight", "final", "asap", "calculus", "advanced"];
  const bumps = boostWords.filter((w) => text.includes(w)).length;
  low += bumps * 3;
  high += bumps * 5;
  if (text.length > 120) high += 5;
  return { low: Math.max(5, low), high: Math.max(low + 5, high) };
}

function Avatar({ initials, size = "md", ring = false, online = null }) {
  const sizes = { sm: "h-8 w-8 text-xs", md: "h-11 w-11 text-sm", lg: "h-16 w-16 text-lg", xl: "h-24 w-24 text-2xl" };
  return (
    <div className="relative shrink-0">
      <div className={`${sizes[size]} rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center font-semibold tracking-tight ${ring ? "ring-4 ring-white dark:ring-slate-900" : ""}`}>
        {initials}
      </div>
      {online !== null && (
        <span className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-slate-900 ${online ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"}`} />
      )}
    </div>
  );
}

function Pill({ active, onClick, children, className = "" }) {
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all duration-150 ${
        active
          ? "bg-indigo-600 border-indigo-600 text-white shadow-sm shadow-indigo-600/30"
          : "bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
      } ${className}`}
    >
      {children}
    </button>
  );
}

function CategoryTag({ category }) {
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${CATEGORY_STYLES[category] || CATEGORY_STYLES.All}`}>
      {category}
    </span>
  );
}

function Stars({ rating, size = 14 }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          className={i <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200 dark:fill-slate-700 dark:text-slate-700"}
        />
      ))}
    </div>
  );
}

function Toggle({ checked, onChange, label, sublabel, color = "emerald" }) {
  const colorMap = {
    emerald: checked ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600",
    indigo: checked ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-600",
  };
  return (
    <div className="flex items-center justify-between gap-4">
      {(label || sublabel) && (
        <div>
          {label && <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{label}</p>}
          {sublabel && <p className="text-xs text-slate-500 dark:text-slate-400">{sublabel}</p>}
        </div>
      )}
      <button
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${colorMap[color]}`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
      </button>
    </div>
  );
}

function Perforation() {
  return (
    <div className="relative flex items-center px-0 shrink-0">
      <div className="h-full w-px border-l-2 border-dashed border-slate-200 dark:border-slate-700" />
    </div>
  );
}

function Toast({ message, show }) {
  if (!show) return null;
  return (
    <div className="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-[60] animate-bounce">
      <div className="flex items-center gap-2 rounded-full bg-slate-900 text-white text-sm font-medium px-4 py-2.5 shadow-xl dark:bg-white dark:text-slate-900">
        <CheckCircle2 size={16} className="text-emerald-400 dark:text-emerald-600" />
        {message}
      </div>
    </div>
  );
}

function OnboardingView({ onFinish }) {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [verified, setVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [role, setRole] = useState(null);
  const [skills, setSkills] = useState([]);
  const [availableNow, setAvailableNow] = useState(true);

  const eduValid = email.includes("@");

  function handleVerify() {
    if (!eduValid) return;
    setVerifying(true);
    setTimeout(() => {
      setVerifying(false);
      setVerified(true);
    }, 800);
  }

  function toggleSkill(skill) {
    setSkills((prev) => (prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]));
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700 shadow-sm p-6 sm:p-8">
          {step === 1 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                <Shield size={20} />
                <span className="text-xs font-bold uppercase tracking-wider">Institutional SSO</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Verify .edu email</h2>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setVerified(false); }}
                placeholder="you@university.edu"
                className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 px-3 py-2.5 text-sm"
              />
              <button
                onClick={handleVerify}
                disabled={!eduValid || verifying}
                className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white font-semibold py-2.5 text-sm"
              >
                {verifying ? "Verifying..." : verified ? "Verified ✓" : "Send Verification"}
              </button>
              {verified && (
                <button onClick={() => setStep(2)} className="w-full text-center text-sm font-semibold text-indigo-600">
                  Continue &rarr;
                </button>
              )}
            </div>
          )}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold">Pick your role</h2>
              {["Seller", "Buyer", "Both"].map((r) => (
                <button
                  key={r}
                  onClick={() => setRole(r.toLowerCase())}
                  className={`w-full p-3 rounded-xl border text-left font-medium ${role === r.toLowerCase() ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20" : "border-slate-200"}`}
                >
                  {r}
                </button>
              ))}
              <button onClick={() => setStep(3)} disabled={!role} className="w-full bg-indigo-600 text-white py-2 rounded-lg font-semibold disabled:bg-slate-200">
                Continue
              </button>
            </div>
          )}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold">Select Skills</h2>
              <div className="flex flex-wrap gap-2">
                {SKILL_TAGS.map((s) => (
                  <Pill key={s} active={skills.includes(s)} onClick={() => toggleSkill(s)}>
                    {s}
                  </Pill>
                ))}
              </div>
              <button
                onClick={() => onFinish({ email, role, skills, availableNow })}
                disabled={skills.length === 0}
                className="w-full bg-emerald-500 text-white py-2.5 rounded-lg font-bold"
              >
                Finish Setup
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/*
 * --- End of the content that was provided ---
 *
 * The source document cut off partway through the button above (everything
 * above this comment is reproduced as-is). Based on the icon imports at the
 * top of this file (Home, LayoutGrid, MessageSquareWarning, Wallet, Search,
 * MapPin, etc.) and the FREELANCERS / CONVERSATIONS / CATEGORIES mock data
 * already defined above, the full app most likely also includes:
 *   - a gig marketplace / browse view (Home, LayoutGrid, Search, MapPin, Flame)
 *   - a gig posting form using estimatePrice() for a live price range
 *   - a messaging view built from CONVERSATIONS (MessageCircle, Send, Paperclip)
 *   - a freelancer/profile view built from FREELANCERS (Award, BadgeCheck, Wallet)
 * None of that was in the file you shared, so it isn't guessed at here.
 * The line below is the only addition beyond closing the syntax: it renders
 * OnboardingView so the project builds and runs end-to-end.
 */

export default function StudentGigApp() {
  const [profile, setProfile] = useState(null);

  if (!profile) {
    return <OnboardingView onFinish={setProfile} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 text-center">
      <div>
        <CheckCircle2 className="mx-auto mb-3 text-emerald-500" size={40} />
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Onboarding complete</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-sm">
          Signed up as {profile.email || "a new user"} ({profile.role}). The marketplace, messaging,
          and profile views come next — see the comment above this component.
        </p>
      </div>
    </div>
  );
}
