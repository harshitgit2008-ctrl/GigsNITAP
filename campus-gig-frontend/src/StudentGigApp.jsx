import React, { useState, useMemo, useEffect, useCallback } from "react";
import { registerUser, getGigs, createGig, acceptGig as acceptGigAPI } from './api/client';
import {
  Search, MapPin, Clock, Star, CheckCircle2, Zap, MessageCircle, User as UserIcon,
  Plus, Filter, Shield, DollarSign, TrendingUp, Award, Send, Paperclip, ChevronRight,
  Sparkles, Briefcase, GraduationCap, AlertTriangle, X, Check, Camera, Users, Home,
  LayoutGrid, Mail, ArrowRight, ArrowLeft, Flame, BadgeCheck, Wallet, FileText,
  MessageSquareWarning, ChevronLeft, Settings, LogOut, Percent, Loader2,
  BarChart, Activity, ShieldCheck, IndianRupee, QrCode
} from "lucide-react";

/**
 * ==========================================================================
 * STUDENT GIG MARKETPLACE — production-style prototype
 * ==========================================================================
 * Design language ("Campus Ledger"):
 *  - Every money-bearing surface (gig cards, escrow bar, earnings) is drawn
 *    like a torn ticket stub / receipt — a dashed perforation divides the
 *    "what" from the "worth", because on a real campus corkboard that's
 *    exactly how flyers, ride-shares and tutoring ads get read: skim the
 *    dollar figure first, then the details.
 *  - Indigo/violet = trust & platform chrome. Emerald = money moving in
 *    the student's favor. Amber = urgency. Slate = paper/neutral surface.
 *  - Typography: tight, heavy tracking on numbers (tabular-nums) so prices
 *    line up like a real receipt; everything else is calm and readable.
 * ==========================================================================
 * NOTE ON TYPESCRIPT: this canvas environment executes plain Babel/JSX
 * (no TS transform), so interfaces are expressed as JSDoc typedefs below
 * instead of `interface` syntax — drop this into a .tsx file and promote
 * the typedefs to real `interface`/`type` declarations 1:1, no logic
 * changes needed.
 * ==========================================================================
 */

/**
 * @typedef {Object} Gig
 * @property {string} id
 * @property {string} title
 * @property {string} category
 * @property {number} reward
 * @property {'fixed'|'hourly'} rewardType
 * @property {string} eta
 * @property {string} poster
 * @property {string} posterInitials
 * @property {boolean} urgent
 * @property {string} location
 * @property {string} description
 */

/**
 * @typedef {Object} Freelancer
 * @property {string} id
 * @property {string} name
 * @property {string} initials
 * @property {string} major
 * @property {string} year
 * @property {number} rating
 * @property {number} reviews
 * @property {string[]} skills
 * @property {number} rate
 * @property {boolean} availableNow
 * @property {string[]} portfolio
 */

// ---------------------------------------------------------------------------
// MOCK DATA — tailored to campus life
// ---------------------------------------------------------------------------

const CATEGORIES = ["All", "Academics", "Errands", "Delivery", "Design", "Events"];

const CATEGORY_STYLES = {
  Academics: "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-500/10 dark:text-violet-300 dark:border-violet-500/20",
  Errands: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20",
  Delivery: "bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/20",
  Design: "bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-500/10 dark:text-pink-300 dark:border-pink-500/20",
  Events: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20",
  All: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-500/10 dark:text-slate-300 dark:border-slate-500/20",
};

const INITIAL_GIGS = [
  {
    id: "g1",
    title: "ED Sheet Drawing Help Needed Tonight",
    category: "Academics",
    reward: 200,
    rewardType: "fixed",
    eta: "~2 hrs",
    poster: "Rajesh Kumar",
    posterInitials: "RK",
    urgent: true,
    location: "Godavari Hostel, Room 214",
    description: "Struggling with the orthographic projections for tomorrow's lab. Need someone to help me draw 3 sheets.",
  },
  {
    id: "g2",
    title: "Need a Cycle for 3 Hours",
    category: "Errands",
    reward: 50,
    rewardType: "fixed",
    eta: "~3 hrs",
    poster: "Sneha Reddy",
    posterInitials: "SR",
    urgent: true,
    location: "Banganga Hostel",
    description: "Need a cycle to go to the main gate to pick up a parcel. Will return it in perfect condition.",
  },
  {
    id: "g3",
    title: "Night Canteen Delivery (Maggi & Paratha)",
    category: "Delivery",
    reward: 40,
    rewardType: "fixed",
    eta: "~30 min",
    poster: "Amit Sharma",
    posterInitials: "AS",
    urgent: true,
    location: "Munneru Hostel",
    description: "Too lazy to walk to the night canteen. Bring me 2 egg maggis and 1 aloo paratha. Tip included.",
  },
  {
    id: "g4",
    title: "Vulcanzy Tech Fest UI/UX Design",
    category: "Design",
    reward: 1500,
    rewardType: "fixed",
    eta: "~3 days",
    poster: "Vulcanzy Core Team",
    posterInitials: "VC",
    urgent: false,
    location: "Remote",
    description: "Need a Figma prototype for the Vulcanzy tech fest website. Cyberpunk theme.",
  },
  {
    id: "g5",
    title: "Event Photographer - Cultural Night",
    category: "Events",
    reward: 800,
    rewardType: "fixed",
    eta: "~4 hrs",
    poster: "Cultural Committee",
    posterInitials: "CC",
    urgent: false,
    location: "Open Air Theatre",
    description: "Covering the ethnic day performances. Deliver 50+ edited photos within 48 hrs.",
  },
  {
    id: "g6",
    title: "DSA End-Sem Crash Course / Notes",
    category: "Tutoring",
    reward: 300,
    rewardType: "hourly",
    eta: "~2 hrs",
    poster: "Priya Singh",
    posterInitials: "PS",
    urgent: true,
    location: "Academic Block 1",
    description: "Need someone to explain dynamic programming and graphs before tomorrow's DSA exam.",
  },
];

const FREELANCERS = [
  {
    id: "f1",
    name: "Karthik N",
    initials: "KN",
    major: "Computer Science",
    year: "3rd Year",
    rating: 4.9,
    reviews: 62,
    skills: ["Python", "Tutoring", "Data Structures"],
    rate: 250,
    availableNow: true,
    portfolio: ["DSA Crash Course Notes", "Web Dev Bootcamp Project"],
  },
  {
    id: "f2",
    name: "Anjali Rao",
    initials: "AR",
    major: "Mechanical Eng.",
    year: "4th Year",
    rating: 5.0,
    reviews: 41,
    skills: ["AutoCAD", "Design", "Engineering Drawing"],
    rate: 350,
    availableNow: false,
    portfolio: ["Vulcanzy 2024 Stage Design", "Robotics Club CAD Models"],
  },
  {
    id: "f3",
    name: "Vikas Patel",
    initials: "VP",
    major: "Electronics (ECE)",
    year: "2nd Year",
    rating: 4.7,
    reviews: 19,
    skills: ["Photography", "Event Management"],
    rate: 400,
    availableNow: true,
    portfolio: ["Shishir Fest Aftermovie", "Freshers Party Photos"],
  },
  {
    id: "f4",
    name: "Surya T",
    initials: "ST",
    major: "Electrical (EEE)",
    year: "3rd Year",
    rating: 4.8,
    reviews: 33,
    skills: ["Hardware", "Arduino", "IoT"],
    rate: 300,
    availableNow: true,
    portfolio: ["Smart Hostel Lock Build", "Arduino Weather Station"],
  },
  {
    id: "f5",
    name: "Deepak M",
    initials: "DM",
    major: "Civil Eng.",
    year: "4th Year",
    rating: 5.0,
    reviews: 88,
    skills: ["Math", "Calculus", "Tutoring"],
    rate: 250,
    availableNow: true,
    portfolio: ["M1 & M2 Study Guide (300+ downloads)", "SOM Final Review Deck"],
  },
];

const CONVERSATIONS = [
  {
    id: "c1",
    name: "Rajesh Kumar",
    initials: "RK",
    gigTitle: "ED Sheet Drawing Help Needed Tonight",
    escrow: 200,
    lastMessage: "Sounds good, see you at 7!",
    unread: 2,
    role: "buyer",
    messages: [
      { id: 1, type: "system", text: "Gig accepted by Jordan Kim." },
      { id: 2, type: "system", text: "UPI Escrow Funded — ₹200.00 locked." },
      { id: 3, type: "them", text: "Hey! Thanks for picking this up, are you free around 7pm?" },
      { id: 4, type: "me", text: "Yep, 7pm works. I'll bring my drafter." },
      { id: 5, type: "them", text: "Sounds good, see you at 7!" },
    ],
  },
  {
    id: "c2",
    name: "Vulcanzy Core Team",
    initials: "VC",
    gigTitle: "Vulcanzy Tech Fest UI/UX Design",
    escrow: 1500,
    lastMessage: "Attached the brand guide 📎",
    unread: 0,
    role: "buyer",
    messages: [
      { id: 1, type: "system", text: "UPI Escrow Funded — ₹1500.00 locked." },
      { id: 2, type: "them", text: "Attached the brand guide 📎" },
      { id: 3, type: "file", text: "brand-guide.pdf" },
      { id: 4, type: "me", text: "Got it — first drafts by Thursday." },
    ],
  },
  {
    id: "c3",
    name: "Priya Singh",
    initials: "PS",
    gigTitle: "DSA End-Sem Crash Course / Notes",
    escrow: 300,
    lastMessage: "It's fixed! Submitting for review now.",
    unread: 1,
    role: "buyer",
    messages: [
      { id: 1, type: "system", text: "UPI Escrow Funded — ₹300.00 locked." },
      { id: 2, type: "me", text: "Found the bug — off-by-one in your remove() method." },
      { id: 3, type: "them", text: "It's fixed! Submitting for review now." },
    ],
  },
];

const SKILL_TAGS = [
  "Tutoring", "Design", "Coding", "Delivery", "Photography", "AutoCAD",
  "Event Planning", "Music", "Video Editing", "Math", "Engineering Drawing",
];

// Deterministic mock "AI" price estimator — keyword + category weighted
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
  const boostWords = ["urgent", "tonight", "final", "asap", "calculus", "organic chemistry", "advanced"];
  const bumps = boostWords.filter((w) => text.includes(w)).length;
  low += bumps * 3;
  high += bumps * 5;
  if (text.length > 120) high += 5; // more scope described → likely bigger job
  return { low: Math.max(5, low), high: Math.max(low + 5, high) };
}

// ---------------------------------------------------------------------------
// SMALL SHARED PRIMITIVES
// ---------------------------------------------------------------------------

function Avatar({ initials, size = "md", ring = false, online = null }) {
  const sizes = { sm: "h-8 w-8 text-xs", md: "h-11 w-11 text-sm", lg: "h-16 w-16 text-lg", xl: "h-24 w-24 text-2xl" };
  return (
    <div className="relative shrink-0">
      <div
        className={`${sizes[size]} rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center font-semibold tracking-tight ${ring ? "ring-4 ring-white dark:ring-slate-900" : ""}`}
      >
        {initials}
      </div>
      {online !== null && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-slate-900 ${online ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"}`}
        />
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
        aria-pressed={checked}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${checked ? "translate-x-5" : "translate-x-0.5"}`}
        />
      </button>
    </div>
  );
}

// A ticket-stub style divider — the "campus ledger" signature motif
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
    <div className="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-[60] animate-[fadeIn_0.2s_ease]">
      <div className="flex items-center gap-2 rounded-full bg-slate-900 text-white text-sm font-medium px-4 py-2.5 shadow-xl dark:bg-white dark:text-slate-900">
        <CheckCircle2 size={16} className="text-emerald-400 dark:text-emerald-600" />
        {message}
      </div>
    </div>
  );
}

// ===========================================================================
// VIEW 1 — ONBOARDING & .edu SSO
// ===========================================================================

function OnboardingView({ onFinish, darkMode }) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [branch, setBranch] = useState("");
  const [year, setYear] = useState("");
  const [upiId, setUpiId] = useState("");
  const [verified, setVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [role, setRole] = useState(null);
  const [skills, setSkills] = useState([]);
  const [availableNow, setAvailableNow] = useState(true);
  const [error, setError] = useState("");
  const totalSteps = 3;

  // Relaxed for dev/testing, but explicitly encouraging student.nitandhra.ac.in
  const eduValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(email);
  const nameValid = name.trim().length >= 2;
  const nitValid = email.toLowerCase().includes("nitandhra.ac.in");

  function handleVerify() {
    if (!eduValid || !nameValid) return;
    setVerifying(true);
    setTimeout(() => {
      setVerifying(false);
      setVerified(true);
    }, 900);
  }

  function toggleSkill(skill) {
    setSkills((prev) => (prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]));
  }

  async function handleFinish() {
    setError("");
    try {
      const initials = name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2);
      // Backend expects: major (branch), year, university
      const res = await registerUser({ 
        name: name.trim(), 
        email: email.trim().toLowerCase(), 
        role, 
        skills, 
        initials,
        major: branch || 'B.Tech',
        year: year || '1st Year',
        university: 'NIT Andhra Pradesh'
      });
      
      // Store UPI locally for MVP purposes since backend user model doesn't have it yet, 
      // but ideally this goes to the DB.
      const userData = { ...res.data, upiId: upiId || '' };
      onFinish({ user: userData, availableNow });
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors duration-300 ${
                  s < step
                    ? "bg-emerald-500 text-white"
                    : s === step
                    ? "bg-indigo-600 text-white ring-4 ring-indigo-100 dark:ring-indigo-500/20"
                    : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500"
                }`}
              >
                {s < step ? <Check size={16} /> : s}
              </div>
              {s < totalSteps && <div className={`h-0.5 w-10 mx-1 rounded ${s < step ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-700"}`} />}
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700 shadow-sm p-6 sm:p-8">
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-3 py-2.5 text-red-700 dark:text-red-300 text-sm">
              {error}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                <Shield size={20} />
                <span className="text-xs font-bold uppercase tracking-wider">Campus Verification</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Create your account</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Gig Marketplace is exclusive to verified students — this keeps every gig hyper-local and trustworthy.
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 block">Your name</label>
                <div className="relative">
                  <UserIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ravi Kumar"
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 pl-9 pr-3 py-2.5 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 block">Branch</label>
                  <select
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 px-3 py-2.5 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">Select...</option>
                    <option value="CSE">CSE</option>
                    <option value="ECE">ECE</option>
                    <option value="EEE">EEE</option>
                    <option value="Mechanical">Mechanical</option>
                    <option value="Civil">Civil</option>
                    <option value="Biotech">Biotech</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 block">B.Tech Year</label>
                  <select
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 px-3 py-2.5 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">Select...</option>
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 block">NIT AP Email (Roll No.)</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setVerified(false);
                    }}
                    placeholder="412101@student.nitandhra.ac.in"
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 pl-9 pr-3 py-2.5 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                {email.length > 0 && !eduValid && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5">Must be a valid email address.</p>
                )}
                {email.length > 0 && eduValid && !nitValid && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5">Note: For official verification, use @student.nitandhra.ac.in</p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1"><QrCode size={12}/> UPI ID (For Escrow Payments)</label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="rollno@ybl"
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 px-3 py-2.5 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {verified && (
                <div className="flex items-center gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-3 py-2.5 text-emerald-700 dark:text-emerald-300">
                  <BadgeCheck size={18} className="shrink-0" />
                  <span className="text-sm font-medium">Verified student — trust badge unlocked</span>
                </div>
              )}

              <button
                onClick={handleVerify}
                disabled={!eduValid || !nameValid || verifying}
                className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 dark:disabled:bg-slate-700 text-white font-semibold py-2.5 text-sm transition-colors flex items-center justify-center gap-2"
              >
                {verifying ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Verifying…
                  </>
                ) : verified ? (
                  "Verified ✓"
                ) : (
                  "Send verification"
                )}
              </button>

              <button
                onClick={() => setStep(2)}
                disabled={!verified}
                className="w-full text-center text-sm font-semibold text-indigo-600 dark:text-indigo-400 disabled:text-slate-300 dark:disabled:text-slate-600 flex items-center justify-center gap-1 py-1"
              >
                Continue <ArrowRight size={14} />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">How will you use campus?</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">You can always switch later in your profile.</p>
              </div>
              <div className="grid gap-3">
                {[
                  { id: "seller", label: "Seller (Freelancer)", desc: "Offer your skills & pick up gigs", icon: Briefcase },
                  { id: "buyer", label: "Buyer (Hiring)", desc: "Post gigs and hire fellow students", icon: Users },
                  { id: "both", label: "Both", desc: "Post gigs and get hired — full access", icon: Sparkles },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setRole(opt.id)}
                    className={`flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-colors ${
                      role === opt.id
                        ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-500/10"
                        : "border-slate-200 dark:border-slate-700 hover:border-indigo-200"
                    }`}
                  >
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${role === opt.id ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-500"}`}>
                      <opt.icon size={18} />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-slate-800 dark:text-slate-100">{opt.label}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{opt.desc}</p>
                    </div>
                    {role === opt.id && <CheckCircle2 size={18} className="text-indigo-600 dark:text-indigo-400" />}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={() => setStep(1)} className="rounded-lg border border-slate-200 dark:border-slate-600 px-4 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                  <ArrowLeft size={14} /> Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!role}
                  className="flex-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 dark:disabled:bg-slate-700 text-white font-semibold py-2.5 text-sm flex items-center justify-center gap-1"
                >
                  Continue <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Pick your skill tags</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Helps us match you to relevant gigs on the board.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {SKILL_TAGS.map((skill) => (
                  <Pill key={skill} active={skills.includes(skill)} onClick={() => toggleSkill(skill)}>
                    {skills.includes(skill) && <Check size={12} className="inline mr-1 -mt-0.5" />}
                    {skill}
                  </Pill>
                ))}
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-slate-50 dark:bg-slate-900/50">
                <Toggle
                  checked={availableNow}
                  onChange={setAvailableNow}
                  label="Available Now"
                  sublabel="Show a live green indicator on your profile"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button onClick={() => setStep(2)} className="rounded-lg border border-slate-200 dark:border-slate-600 px-4 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                  <ArrowLeft size={14} /> Back
                </button>
                <button
                  onClick={handleFinish}
                  disabled={skills.length === 0}
                  className="flex-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-200 disabled:text-slate-400 dark:disabled:bg-slate-700 text-white font-semibold py-2.5 text-sm flex items-center justify-center gap-1"
                >
                  Enter Marketplace <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ===========================================================================
// VIEW 2 — DUAL FEED (Gig Board / Service Directory)
// ===========================================================================

function GigCard({ gig, onAccept, accepted }) {
  return (
    <div className="group flex rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex-1 p-4 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-2">
          <CategoryTag category={gig.category} />
          {gig.urgent && (
            <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 px-2 py-0.5 text-xs font-bold">
              <Flame size={11} className="fill-amber-500 text-amber-500" /> URGENT
            </span>
          )}
        </div>
        <h3 className="font-semibold text-slate-800 dark:text-slate-100 leading-snug mb-1">{gig.title}</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">{gig.description}</p>
        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1"><Clock size={12} /> {gig.eta}</span>
          <span className="flex items-center gap-1"><MapPin size={12} /> {gig.location}</span>
        </div>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/60">
          <div className="flex items-center gap-2">
            <Avatar initials={gig.posterInitials} size="sm" />
            <div className="flex flex-col">
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
                {gig.poster}
                {gig.verified && <ShieldCheck size={12} className="text-blue-500" />}
              </span>
              <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                <Star size={10} className="fill-amber-400 text-amber-400" /> {gig.posterRating.toFixed(1)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <Perforation />

      <div className="w-28 sm:w-32 shrink-0 flex flex-col items-center justify-center gap-2 p-3 bg-slate-50/60 dark:bg-slate-900/40">
        <div className="text-center">
          <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 tabular-nums leading-none">₹{gig.reward}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">{gig.rewardType === "hourly" ? "/ hr" : "flat"}</p>
        </div>
        <div className="flex items-center justify-center w-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold py-1 px-1 rounded gap-1 mb-1 border border-emerald-100 dark:border-emerald-800/50">
          <QrCode size={10} /> UPI Escrow
        </div>
        <button
          onClick={() => onAccept(gig.id)}
          disabled={accepted}
          className={`w-full rounded-lg py-1.5 text-xs font-bold transition-colors ${
            accepted
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 cursor-default"
              : "bg-indigo-600 hover:bg-indigo-700 text-white"
          }`}
        >
          {accepted ? "Accepted ✓" : "Accept"}
        </button>
      </div>
    </div>
  );
}

function FreelancerCard({ freelancer, onMessage }) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start gap-3">
        <Avatar initials={freelancer.initials} size="lg" online={freelancer.availableNow} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 truncate">{freelancer.name}</h3>
            {freelancer.availableNow && (
              <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> AVAILABLE NOW
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">{freelancer.year} · {freelancer.major}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <Stars rating={freelancer.rating} />
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{freelancer.rating.toFixed(1)}</span>
            <span className="text-xs text-slate-400">({freelancer.reviews})</span>
            {freelancer.rating === 5 && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 ml-0.5">
                <Award size={9} /> TOP RATED
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mt-3">
        {freelancer.skills.map((skill) => (
          <span key={skill} className="inline-flex items-center gap-1 rounded-md bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-500/20 px-2 py-0.5 text-[11px] font-medium">
            <BadgeCheck size={10} /> {skill}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-1.5 mt-3">
        {freelancer.portfolio.map((item) => (
          <div key={item} className="aspect-video rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-750 border border-slate-200 dark:border-slate-600 flex items-center justify-center p-2">
            <p className="text-[10px] text-slate-500 dark:text-slate-400 text-center leading-tight line-clamp-3">{item}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-dashed border-slate-200 dark:border-slate-700">
        <div>
          <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 tabular-nums leading-none">₹{freelancer.rate}</p>
          <p className="text-[10px] text-slate-400">per hour</p>
        </div>
        <button
          onClick={() => onMessage(freelancer)}
          className="rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 flex items-center gap-1.5"
        >
          <MessageCircle size={13} /> Message
        </button>
      </div>
    </div>
  );
}

function FeedView({ acceptedGigs, onAcceptGig, onMessageFreelancer, showToast, currentUser }) {
  const [feedMode, setFeedMode] = useState("board"); // "board" | "directory"
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [onCampusOnly, setOnCampusOnly] = useState(false);
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchGigs = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (category !== 'All') params.category = category;
      if (query.trim()) params.search = query.trim();
      const res = await getGigs(params);
      setGigs(res.data);
    } catch (err) {
      console.error('Failed to fetch gigs:', err);
    } finally {
      setLoading(false);
    }
  }, [category, query]);

  useEffect(() => {
    if (feedMode === 'board') {
      const debounce = setTimeout(fetchGigs, 300);
      return () => clearTimeout(debounce);
    }
  }, [fetchGigs, feedMode]);

  // Map API gig to the shape GigCard expects
  const mapGig = (g) => ({
    id: g._id,
    title: g.title,
    category: g.category,
    reward: g.budget,
    rewardType: g.rewardType || 'fixed',
    eta: g.eta || '~1 hr',
    poster: g.postedBy?.name || 'Unknown',
    posterInitials: g.postedBy?.initials || (g.postedBy?.name ? g.postedBy.name.split(/\s+/).map(w=>w[0]).join('').toUpperCase().slice(0,2) : '??'),
    posterRating: g.postedBy?.rating || 4.8,
    verified: true,
    urgent: g.urgent,
    location: g.location || 'On Campus',
    description: g.description,
  });

  const displayGigs = useMemo(() => {
    let mapped = gigs.map(mapGig);
    if (onCampusOnly) mapped = mapped.filter(g => !g.location.toLowerCase().includes('remote'));
    return mapped;
  }, [gigs, onCampusOnly]);

  const filteredFreelancers = useMemo(() => {
    return FREELANCERS.filter((f) => {
      const matchesCategory = category === "All" || f.skills.some((s) => s.toLowerCase().includes(category.toLowerCase())) || category === "Tutoring" && f.skills.some(s=>s.toLowerCase().includes('tutor')||s.toLowerCase().includes('math')||s.toLowerCase().includes('calc'));
      const matchesQuery = f.name.toLowerCase().includes(query.toLowerCase()) || f.skills.join(" ").toLowerCase().includes(query.toLowerCase()) || f.major.toLowerCase().includes(query.toLowerCase());
      return (category === "All" ? true : matchesCategory) && matchesQuery;
    });
  }, [query, category]);

  return (
    <div className="max-w-3xl mx-auto px-4 pb-6">
      {/* Feed switcher */}
      <div className="sticky top-16 z-20 -mx-4 px-4 pt-4 pb-3 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur">
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-200/70 dark:bg-slate-800 p-1 mb-3">
          <button
            onClick={() => setFeedMode("board")}
            className={`rounded-lg py-2 text-sm font-bold flex items-center justify-center gap-1.5 transition-colors ${feedMode === "board" ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-slate-500 dark:text-slate-400"}`}
          >
            <LayoutGrid size={15} /> Gig Board
          </button>
          <button
            onClick={() => setFeedMode("directory")}
            className={`rounded-lg py-2 text-sm font-bold flex items-center justify-center gap-1.5 transition-colors ${feedMode === "directory" ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-slate-500 dark:text-slate-400"}`}
          >
            <Users size={15} /> Service Directory
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={feedMode === "board" ? "Search gigs (e.g. tutoring, moving)…" : "Search freelancers or skills…"}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-9 pr-3 py-2.5 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Category pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
          {CATEGORIES.map((c) => (
            <Pill key={c} active={category === c} onClick={() => setCategory(c)}>
              {c}
            </Pill>
          ))}
        </div>

        {/* Geofence toggle */}
        <div className="flex items-center justify-between mt-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <MapPin size={13} className="text-indigo-600 dark:text-indigo-400" /> Geofenced: On-Campus Only
          </span>
          <Toggle checked={onCampusOnly} onChange={setOnCampusOnly} color="indigo" />
        </div>
      </div>

      {/* Results */}
      <div className="mt-4 space-y-3">
        {feedMode === "board" ? (
          loading ? (
            <div className="text-center py-16"><Loader2 size={24} className="animate-spin mx-auto text-indigo-500" /><p className="text-sm text-slate-500 mt-2">Loading gigs…</p></div>
          ) : displayGigs.length > 0 ? (
            <>
              {currentUser?.skills?.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-1.5">
                    <Sparkles size={16} className="text-indigo-500" /> Recommended For You
                  </h3>
                  <div className="space-y-3">
                    {displayGigs
                      .filter(g => currentUser.skills.some(s => g.category.toLowerCase().includes(s.toLowerCase()) || g.title.toLowerCase().includes(s.toLowerCase())))
                      .slice(0, 2)
                      .map((g) => (
                        <GigCard key={g.id} gig={g} onAccept={(id) => { onAcceptGig(id); showToast(`Accepted "${g.title}"`); }} accepted={acceptedGigs.includes(g.id)} />
                      ))}
                    {displayGigs.filter(g => currentUser.skills.some(s => g.category.toLowerCase().includes(s.toLowerCase()) || g.title.toLowerCase().includes(s.toLowerCase()))).length === 0 && (
                      <p className="text-xs text-slate-500 italic px-2">No recommended gigs match your skills right now.</p>
                    )}
                  </div>
                  <div className="my-5 border-b border-slate-200 dark:border-slate-700/60" />
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-3">All Campus Gigs</h3>
                </div>
              )}
              {displayGigs.map((g) => (
                <GigCard key={g.id} gig={g} onAccept={(id) => { onAcceptGig(id); showToast(`Accepted "${g.title}"`); }} accepted={acceptedGigs.includes(g.id)} />
              ))}
            </>
          ) : (
            <EmptyState text="No gigs match your filters yet — try widening your search." />
          )
        ) : filteredFreelancers.length > 0 ? (
          filteredFreelancers.map((f) => <FreelancerCard key={f.id} freelancer={f} onMessage={onMessageFreelancer} />)
        ) : (
          <EmptyState text="No freelancers match your filters yet — try a different skill." />
        )}
      </div>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="text-center py-16 px-4">
      <div className="mx-auto h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
        <Search size={20} className="text-slate-400" />
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400">{text}</p>
    </div>
  );
}

// ===========================================================================
// VIEW 3 — AI-ASSISTED GIG CREATION
// ===========================================================================

function PostGigView({ onCreate, showToast, currentUser }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Tutoring");
  const [description, setDescription] = useState("");
  const [pricingType, setPricingType] = useState("fixed"); // fixed | milestone
  const [price, setPrice] = useState("");
  const [location, setLocation] = useState("");
  const [eta, setEta] = useState("");
  const [milestones, setMilestones] = useState([
    { id: 1, label: "Initial draft / setup", amount: "" },
    { id: 2, label: "Final delivery", amount: "" },
  ]);
  const [urgent, setUrgent] = useState(false);
  const [posted, setPosted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const estimate = useMemo(() => estimatePrice(title, category, description), [title, category, description]);

  function updateMilestone(id, amount) {
    setMilestones((prev) => prev.map((m) => (m.id === id ? { ...m, amount } : m)));
  }

  function addMilestone() {
    setMilestones((prev) => [...prev, { id: Date.now(), label: `Milestone ${prev.length + 1}`, amount: "" }]);
  }

  const milestoneTotal = milestones.reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0);
  const budgetValue = pricingType === "fixed" ? parseFloat(price) || 0 : milestoneTotal;
  const readyToPost = title.trim().length > 3 && description.trim().length > 5 && budgetValue > 0;

  async function handleSubmit() {
    if (!readyToPost || submitting) return;
    setSubmitting(true);
    try {
      await createGig({
        title: title.trim(),
        description: description.trim(),
        category,
        budget: budgetValue,
        rewardType: pricingType === "milestone" ? "fixed" : pricingType,
        urgent,
        eta: eta.trim() || undefined,
        location: location.trim() || undefined,
        postedBy: currentUser._id,
      });
      setPosted(true);
      showToast("Gig posted to the board!");
      onCreate();
      setTimeout(() => {
        setPosted(false);
        setTitle("");
        setDescription("");
        setPrice("");
        setLocation("");
        setEta("");
        setUrgent(false);
        setSubmitting(false);
      }, 1600);
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to post gig');
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-5 pb-10">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Post a gig</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Describe what you need — our AI estimator helps you price it fairly.</p>
      </div>

      <div className="space-y-5">
        <div>
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 block">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Calculus Tutor for Midterm Review"
            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 block">Category</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.filter((c) => c !== "All").map((c) => (
              <Pill key={c} active={category === c} onClick={() => setCategory(c)}>
                {c}
              </Pill>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 block">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="What exactly do you need done, and by when?"
            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 block">Location</label>
            <div className="relative">
              <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Godavari Hostel"
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-8 pr-3 py-2.5 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 block">Estimated time</label>
            <div className="relative">
              <Clock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={eta}
                onChange={(e) => setEta(e.target.value)}
                placeholder="e.g. ~2 hrs"
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-8 pr-3 py-2.5 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* AI Price Estimator Widget */}
        {title.trim().length > 2 && (
          <div className="rounded-xl border border-indigo-200 dark:border-indigo-500/30 bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-500/10 dark:to-violet-500/10 p-4 animate-[fadeIn_0.3s_ease]">
            <div className="flex items-center gap-2 mb-1.5">
              <Sparkles size={15} className="text-indigo-600 dark:text-indigo-400" />
              <p className="text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wide">AI Price Estimator</p>
            </div>
            <p className="text-2xl font-bold text-slate-800 dark:text-white tabular-nums">
              ${estimate.low}–${estimate.high}
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{category === "Tutoring" || category === "Tech" ? "/hr" : " total"}</span>
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Based on {Math.floor(40 + estimate.low)} similar campus gigs in {category}.</p>
          </div>
        )}

        <div>
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 block">Pricing type</label>
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
            <button
              onClick={() => setPricingType("fixed")}
              className={`rounded-lg py-2 text-sm font-semibold transition-colors ${pricingType === "fixed" ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-slate-500 dark:text-slate-400"}`}
            >
              Fixed Price
            </button>
            <button
              onClick={() => setPricingType("milestone")}
              className={`rounded-lg py-2 text-sm font-semibold transition-colors ${pricingType === "milestone" ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-slate-500 dark:text-slate-400"}`}
            >
              Milestone Payments
            </button>
          </div>
        </div>

        {pricingType === "fixed" ? (
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 block">Offer amount</label>
            <div className="relative">
              <DollarSign size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder={estimate.low.toString()}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-8 pr-3 py-2.5 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Milestones</label>
            {milestones.map((m) => (
              <div key={m.id} className="flex items-center gap-2">
                <input
                  value={m.label}
                  onChange={(e) => setMilestones((prev) => prev.map((mm) => (mm.id === m.id ? { ...mm, label: e.target.value } : mm)))}
                  className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <div className="relative w-28">
                  <DollarSign size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="number"
                    value={m.amount}
                    onChange={(e) => updateMilestone(m.id, e.target.value)}
                    placeholder="0"
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-6 pr-2 py-2 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            ))}
            <button onClick={addMilestone} className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 pt-1">
              <Plus size={13} /> Add milestone
            </button>
            <div className="flex justify-between text-sm pt-2 border-t border-dashed border-slate-200 dark:border-slate-700">
              <span className="text-slate-500 dark:text-slate-400">Total</span>
              <span className="font-bold text-slate-800 dark:text-white tabular-nums">${milestoneTotal.toFixed(2)}</span>
            </div>
          </div>
        )}

        <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame size={16} className="text-amber-500" />
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Promote as Urgent</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Pin to top of board · +₹2.00 fee</p>
            </div>
          </div>
          <Toggle checked={urgent} onChange={setUrgent} color="indigo" />
        </div>

        <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-4 flex items-center justify-between text-sm">
          <span className="text-slate-500 dark:text-slate-400">You'll be charged at posting</span>
          <span className="font-bold text-slate-800 dark:text-white tabular-nums">
            ${(budgetValue + (urgent ? 2 : 0)).toFixed(2)}
          </span>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!readyToPost || submitting}
          className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 dark:disabled:bg-slate-700 text-white font-bold py-3 text-sm flex items-center justify-center gap-2 transition-colors"
        >
          {posted ? (
            <>
              <CheckCircle2 size={16} /> Posted!
            </>
          ) : submitting ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Posting…
            </>
          ) : (
            <>
              Post Gig <ArrowRight size={15} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ===========================================================================
// VIEW 4 — CHAT, ESCROW & MILESTONE TRACKER
// ===========================================================================

function ChatView({ conversations, setConversations, activeId, setActiveId, showToast }) {
  const [draft, setDraft] = useState("");
  const [disputeOpen, setDisputeOpen] = useState(false);
  const active = conversations.find((c) => c.id === activeId) || conversations[0];

  function sendMessage() {
    if (!draft.trim()) return;
    setConversations((prev) =>
      prev.map((c) => (c.id === active.id ? { ...c, messages: [...c.messages, { id: Date.now(), type: "me", text: draft }], lastMessage: draft } : c))
    );
    setDraft("");
  }

  function releaseFunds() {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === active.id
          ? { ...c, escrow: 0, messages: [...c.messages, { id: Date.now(), type: "system", text: `Funds Released — $${c.escrow.toFixed(2)} sent to seller.` }] }
          : c
      )
    );
    showToast("Funds released 🎉");
  }

  function submitWork() {
    setConversations((prev) =>
      prev.map((c) => (c.id === active.id ? { ...c, messages: [...c.messages, { id: Date.now(), type: "system", text: "Work submitted for buyer review." }] } : c))
    );
    showToast("Work submitted for review");
  }

  return (
    <div className="max-w-5xl mx-auto md:flex md:gap-4 md:px-4 md:py-4 h-[calc(100vh-4rem)] md:h-[calc(100vh-5rem)]">
      {/* Conversation list */}
      <div className={`${active ? "hidden md:block" : "block"} md:w-80 shrink-0 border-r border-slate-200 dark:border-slate-700 md:border-r md:rounded-l-2xl overflow-y-auto bg-white dark:bg-slate-800`}>
        <div className="p-4 border-b border-slate-100 dark:border-slate-700">
          <h2 className="font-bold text-slate-800 dark:text-white">Messages</h2>
        </div>
        {conversations.map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveId(c.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 text-left border-b border-slate-50 dark:border-slate-700/50 transition-colors ${
              active?.id === c.id ? "bg-indigo-50 dark:bg-indigo-500/10" : "hover:bg-slate-50 dark:hover:bg-slate-700/40"
            }`}
          >
            <Avatar initials={c.initials} size="md" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{c.name}</p>
                {c.unread > 0 && <span className="h-5 w-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">{c.unread}</span>}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{c.lastMessage}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Active conversation */}
      {active && (
        <div className="flex-1 flex flex-col bg-white dark:bg-slate-800 md:rounded-r-2xl overflow-hidden border border-slate-200 dark:border-slate-700 md:border-l-0">
          {/* Top bar */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center gap-3">
            <button onClick={() => setActiveId(null)} className="md:hidden text-slate-400">
              <ChevronLeft size={20} />
            </button>
            <Avatar initials={active.initials} size="md" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{active.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{active.gigTitle}</p>
            </div>
          </div>

          {/* Escrow status */}
          <div className={`mx-4 mt-3 rounded-xl border px-4 py-2.5 flex items-center justify-between ${active.escrow > 0 ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20" : "bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700"}`}>
            <div className="flex items-center gap-2">
              <Wallet size={16} className={active.escrow > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"} />
              <span className={`text-sm font-semibold ${active.escrow > 0 ? "text-emerald-700 dark:text-emerald-300" : "text-slate-500 dark:text-slate-400"}`}>
                {active.escrow > 0 ? `Funds Locked in Escrow: $${active.escrow.toFixed(2)}` : "Escrow released — gig complete"}
              </span>
            </div>
            {active.escrow > 0 && <Shield size={15} className="text-emerald-500" />}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {active.messages.map((m) => {
              if (m.type === "system") {
                return (
                  <div key={m.id} className="flex justify-center">
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/60 rounded-full px-3 py-1 flex items-center gap-1">
                      <Shield size={10} /> {m.text}
                    </span>
                  </div>
                );
              }
              if (m.type === "file") {
                return (
                  <div key={m.id} className="flex justify-start">
                    <div className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/60 px-3 py-2 max-w-[75%]">
                      <FileText size={16} className="text-indigo-500" />
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-200">{m.text}</span>
                    </div>
                  </div>
                );
              }
              const mine = m.type === "me";
              return (
                <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${
                      mine ? "bg-indigo-600 text-white rounded-br-sm" : "bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-bl-sm"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Escrow action bar */}
          <div className="border-t border-slate-100 dark:border-slate-700 p-3 space-y-2">
            {active.escrow > 0 && (
              <div className="flex gap-2">
                <button onClick={releaseFunds} className="flex-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold py-2.5 flex items-center justify-center gap-1.5">
                  <Wallet size={13} /> Release Funds to Seller
                </button>
                <button onClick={submitWork} className="flex-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 flex items-center justify-center gap-1.5">
                  <CheckCircle2 size={13} /> Submit Work for Review
                </button>
                <button onClick={() => setDisputeOpen(true)} className="rounded-lg border border-red-200 dark:border-red-500/30 text-red-500 px-3 py-2.5">
                  <MessageSquareWarning size={15} />
                </button>
              </div>
            )}
            <div className="flex items-center gap-2">
              <button className="text-slate-400 p-2">
                <Paperclip size={17} />
              </button>
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Message…"
                className="flex-1 rounded-full border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
              />
              <button onClick={sendMessage} className="h-9 w-9 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shrink-0">
                <Send size={15} />
              </button>
            </div>
          </div>
        </div>
      )}

      {disputeOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setDisputeOpen(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="h-11 w-11 rounded-full bg-red-100 dark:bg-red-500/10 text-red-500 flex items-center justify-center mb-3">
              <AlertTriangle size={20} />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-white mb-1">Open a dispute?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              A neutral student peer mediator will review the chat and escrow terms before funds move. This pauses automatic release.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setDisputeOpen(false)} className="flex-1 rounded-lg border border-slate-200 dark:border-slate-600 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
                Cancel
              </button>
              <button
                onClick={() => {
                  setDisputeOpen(false);
                  showToast("Dispute opened — peer mediation requested");
                }}
                className="flex-1 rounded-lg bg-red-500 hover:bg-red-600 text-white py-2 text-sm font-semibold"
              >
                Open Dispute
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ===========================================================================
// VIEW 5 — PROFILE & PORTFOLIO
// ===========================================================================

function ProfileView({ availableNow, setAvailableNow, acceptedCount, currentUser }) {
  const [tab, setTab] = useState("gigs");

  const completedGigs = [
    { title: "M1 Exam Notes Delivery", amount: 150, date: "Aug 21" },
    { title: "Shifted mattress to Godavari Hostel", amount: 200, date: "Aug 15" },
    { title: "Vulcanzy Core Team T-Shirt Design", amount: 800, date: "Aug 9" },
  ];
  const workSamples = [
    { title: "Python Automation Script", type: "Code" },
    { title: "ED Sheet Orthographic Guide", type: "Doc" },
    { title: "Shishir Fest Poster", type: "Design" },
  ];
  const reviews = [
    { name: "Suresh P", rating: 5, text: "Explained pointers in C very well. Highly recommended." },
    { name: "Ananya S", rating: 5, text: "Brought my parcel from main gate quickly." },
    { name: "Rahul M", rating: 4, text: "Good design work, but asked for 2 revisions." },
  ];

  return (
    <div className="max-w-2xl mx-auto pb-10">
      {/* Banner */}
      <div className="h-28 sm:h-36 bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-600 relative">
        <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_20%_30%,white_1px,transparent_1px)] [background-size:16px_16px]" />
      </div>
      <div className="px-4 sm:px-6">
        <div className="-mt-12 flex items-end justify-between">
          <Avatar initials={currentUser?.initials || "?"} size="xl" ring />
          <button className="mb-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
            <Settings size={13} /> Edit
          </button>
        </div>

        <div className="mt-2 flex items-center gap-1.5">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{currentUser?.name || "Student"}</h1>
          <BadgeCheck size={17} className="text-indigo-500" />
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
          <GraduationCap size={14} /> {currentUser?.major || "Student"} {currentUser?.year ? `· ${currentUser.year}` : ""}
        </p>

        <div className="flex flex-wrap gap-1.5 mt-2">
          {currentUser?.upiId && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-400 text-[11px] font-bold px-2.5 py-1">
              <QrCode size={11} /> UPI: {currentUser.upiId}
            </span>
          )}
          {currentUser?.email && currentUser.email.match(/^\d+/) && (
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800/50 text-indigo-700 dark:text-indigo-400 text-[11px] font-bold px-2.5 py-1">
              <ShieldCheck size={11} /> Roll No: {currentUser.email.match(/^\d+/)[0]}
            </span>
          )}
          <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-white text-[11px] font-bold px-2.5 py-1">
            <Award size={11} /> Top Rated
          </span>
        </div>

        {/* Available now toggle */}
        <div className="mt-4 rounded-xl border border-slate-200 dark:border-slate-700 p-3.5 flex items-center justify-between bg-white dark:bg-slate-800">
          <span className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
            <span className={`h-2.5 w-2.5 rounded-full ${availableNow ? "bg-emerald-500 animate-pulse" : "bg-slate-300 dark:bg-slate-600"}`} />
            {availableNow ? "Available Now" : "Not available"}
          </span>
          <Toggle checked={availableNow} onChange={setAvailableNow} />
        </div>

        {/* Earnings dashboard */}
        <div className="grid grid-cols-3 gap-2.5 mt-4">
          <MetricCard icon={IndianRupee} label="Total Earned" value="₹12,400" accent="emerald" />
          <MetricCard icon={CheckCircle2} label="Completed" value={`${38 + acceptedCount}`} accent="indigo" />
          <MetricCard icon={Star} label="Rating" value="4.9" accent="amber" />
        </div>

        {/* Portfolio tabs */}
        <div className="mt-6">
          <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
            {[
              { id: "gigs", label: "Completed Gigs" },
              { id: "samples", label: "Work Samples" },
              { id: "reviews", label: "Reviews" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`rounded-lg py-2 text-xs sm:text-sm font-semibold transition-colors ${tab === t.id ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-slate-500 dark:text-slate-400"}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="mt-3 space-y-2.5">
            {tab === "gigs" &&
              completedGigs.map((g) => (
                <div key={g.title} className="flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
                  <div className="flex-1 p-3">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{g.title}</p>
                    <p className="text-xs text-slate-400">{g.date}</p>
                  </div>
                  <Perforation />
                  <div className="px-4">
                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">+${g.amount}</p>
                  </div>
                </div>
              ))}

            {tab === "samples" &&
              workSamples.map((s) => (
                <div key={s.title} className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3">
                  <div className="h-10 w-10 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <FileText size={17} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{s.title}</p>
                    <p className="text-xs text-slate-400">{s.type}</p>
                  </div>
                </div>
              ))}

            {tab === "reviews" &&
              reviews.map((r) => (
                <div key={r.name} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3.5">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{r.name}</p>
                    <Stars rating={r.rating} size={12} />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{r.text}</p>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, accent }) {
  const colors = {
    emerald: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10",
    indigo: "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10",
    amber: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10",
  };
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3">
      <div className={`h-7 w-7 rounded-lg flex items-center justify-center mb-1.5 ${colors[accent]}`}>
        <Icon size={14} />
      </div>
      <p className="text-base font-bold text-slate-800 dark:text-white tabular-nums leading-none">{value}</p>
      <p className="text-[10px] text-slate-400 mt-1">{label}</p>
    </div>
  );
}

// ===========================================================================
// INSIGHTS VIEW
// ===========================================================================

function InsightsView() {
  return (
    <div className="max-w-2xl mx-auto px-4 pb-6">
      <div className="pt-6 pb-4">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <Activity className="text-indigo-600 dark:text-indigo-400" />
          Campus Economy
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Live data from the student marketplace.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-4 text-white shadow-sm">
          <div className="flex items-center gap-1.5 opacity-80 text-xs font-semibold uppercase tracking-wider mb-2">
            <DollarSign size={14} /> Total Value Created
          </div>
          <div className="text-3xl font-black tabular-nums tracking-tight">₹42,850</div>
          <div className="text-xs mt-1 opacity-80">This semester</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <CheckCircle2 size={14} /> Gigs Completed
          </div>
          <div className="text-3xl font-black text-slate-800 dark:text-white tabular-nums tracking-tight">1,842</div>
          <div className="text-xs mt-1 text-emerald-500 font-medium flex items-center gap-0.5">
            <TrendingUp size={10} /> +12% this week
          </div>
        </div>
      </div>

      <h3 className="font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
        <Flame size={16} className="text-amber-500" /> High Demand Skills (Pre Mid-Sems)
      </h3>
      <div className="space-y-3 mb-6">
        {[
          { skill: "DSA & C++ Tutoring", rate: "₹300 - ₹500/hr", demand: 92 },
          { skill: "Engineering Drawing (ED)", rate: "₹200 - ₹400 flat", demand: 85 },
          { skill: "Night Canteen Delivery", rate: "₹30 - ₹50 flat", demand: 78 },
          { skill: "AutoCAD & SolidWorks", rate: "₹400 - ₹800/hr", demand: 70 },
        ].map((item, i) => (
          <div key={i} className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex justify-between items-end mb-2">
              <span className="font-semibold text-sm text-slate-800 dark:text-slate-100">{item.skill}</span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{item.rate}</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5">
              <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${item.demand}%` }} />
            </div>
          </div>
        ))}
      </div>

      <h3 className="font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
        <Award size={16} className="text-indigo-500" /> Top Contributors
      </h3>
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden mb-6">
        {[
          { name: "Karthik N", initials: "KN", major: "CSE", earned: "₹12,400", rank: 1 },
          { name: "Vikas Patel", initials: "VP", major: "ECE", earned: "₹9,800", rank: 2 },
          { name: "Deepak M", initials: "DM", major: "Civil", earned: "₹8,500", rank: 3 },
        ].map((user, i) => (
          <div key={i} className={`flex items-center gap-3 p-3 ${i !== 2 ? 'border-b border-slate-100 dark:border-slate-700/60' : ''}`}>
            <div className="w-6 text-center text-sm font-black text-slate-400">#{user.rank}</div>
            <Avatar initials={user.initials} size="sm" />
            <div className="flex-1">
              <div className="font-semibold text-sm text-slate-800 dark:text-slate-100">{user.name}</div>
              <div className="text-[10px] text-slate-500">{user.major}</div>
            </div>
            <div className="font-bold text-sm text-emerald-600 dark:text-emerald-400">{user.earned}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===========================================================================
// APP SHELL — NAV + ROUTING
// ===========================================================================

const NAV_ITEMS = [
  { id: "feed", label: "Explore", icon: Home },
  { id: "post", label: "Post Gig", icon: Plus },
  { id: "chat", label: "Chat", icon: MessageCircle },
  { id: "insights", label: "Insights", icon: BarChart },
  { id: "profile", label: "Profile", icon: UserIcon },
];

export default function StudentGigApp() {
  // Restore user from localStorage on mount
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem('campusgig_user');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });
  const [view, setView] = useState(currentUser ? "feed" : "onboarding");
  const [onboarded, setOnboarded] = useState(!!currentUser);
  const [darkMode, setDarkMode] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "" });

  const [acceptedGigs, setAcceptedGigs] = useState([]);
  const [availableNow, setAvailableNow] = useState(currentUser?.isAvailable ?? true);
  const [conversations, setConversations] = useState(CONVERSATIONS);
  const [activeChatId, setActiveChatId] = useState(null);
  const [postedCount, setPostedCount] = useState(0);

  function showToast(message) {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: "" }), 2200);
  }

  function handleOnboardingFinish({ user, availableNow: avail }) {
    setCurrentUser(user);
    localStorage.setItem('campusgig_user', JSON.stringify(user));
    setOnboarded(true);
    setAvailableNow(avail);
    setView("feed");
    showToast("Welcome to the marketplace!");
  }

  async function handleAcceptGig(id) {
    if (acceptedGigs.includes(id)) return;
    try {
      await acceptGigAPI(id, currentUser._id);
      setAcceptedGigs((prev) => [...prev, id]);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to accept gig');
    }
  }

  function handleLogout() {
    localStorage.removeItem('campusgig_user');
    setCurrentUser(null);
    setOnboarded(false);
    setView('onboarding');
    setAcceptedGigs([]);
  }

  function handleMessageFreelancer(freelancer) {
    // Ensure a conversation thread exists for this freelancer, then jump to Chat
    setConversations((prev) => {
      const existing = prev.find((c) => c.name === freelancer.name);
      if (existing) return prev;
      return [
        ...prev,
        {
          id: `c-${freelancer.id}`,
          name: freelancer.name,
          initials: freelancer.initials,
          gigTitle: "New inquiry",
          escrow: 0,
          lastMessage: "Say hello 👋",
          unread: 0,
          role: "seller",
          messages: [{ id: 1, type: "system", text: `Conversation started with ${freelancer.name}.` }],
        },
      ];
    });
    setActiveChatId(`c-${freelancer.id}`);
    setView("chat");
  }

  return (
    <div className={darkMode ? "dark" : ""}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px);} to { opacity: 1; transform: translateY(0);} }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300">
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-16 border-b border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-900/90 backdrop-blur flex items-center px-4">
          <div className="max-w-6xl mx-auto w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
                <Sparkles size={16} className="text-white" />
              </div>
              <span className="font-bold text-slate-800 dark:text-white tracking-tight hidden sm:inline">Campus<span className="text-indigo-600 dark:text-indigo-400">Gigs</span></span>
            </div>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-full p-1">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setView(item.id)}
                  className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                    view === item.id ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700"
                  }`}
                >
                  <item.icon size={15} /> {item.label}
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setDarkMode((d) => !d)}
                className="h-8 w-8 rounded-full border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-500 dark:text-slate-300 text-xs font-bold"
                title="Toggle dark mode"
              >
                {darkMode ? "☀" : "☾"}
              </button>
              <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 text-xs font-bold">
                <span className={`h-1.5 w-1.5 rounded-full bg-emerald-500 ${availableNow ? "animate-pulse" : "opacity-40"}`} />
                {availableNow ? "Available" : "Away"}
              </div>
              {currentUser && (
                <button
                  onClick={handleLogout}
                  className="h-8 w-8 rounded-full border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors"
                  title="Log out"
                >
                  <LogOut size={14} />
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="pb-24 md:pb-6">
          {view === "onboarding" && <OnboardingView onFinish={handleOnboardingFinish} darkMode={darkMode} />}
          {view === "feed" && (
            <FeedView
              acceptedGigs={acceptedGigs}
              onAcceptGig={handleAcceptGig}
              onMessageFreelancer={handleMessageFreelancer}
              showToast={showToast}
              currentUser={currentUser}
            />
          )}
          {view === "post" && <PostGigView onCreate={() => setPostedCount((c) => c + 1)} showToast={showToast} currentUser={currentUser} />}
          {view === "chat" && (
            <ChatView
              conversations={conversations}
              setConversations={setConversations}
              activeId={activeChatId}
              setActiveId={setActiveChatId}
              showToast={showToast}
            />
          )}
          {view === "insights" && <InsightsView />}
          {view === "profile" && (
            <ProfileView availableNow={availableNow} setAvailableNow={setAvailableNow} acceptedCount={acceptedGigs.length + postedCount} currentUser={currentUser} />
          )}
        </main>

        {/* Mobile bottom tab bar */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 border-t border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur grid grid-cols-5">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-semibold transition-colors ${
                view === item.id ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400"
              }`}
            >
              <item.icon size={19} />
              {item.label}
            </button>
          ))}
        </nav>

        <Toast show={toast.show} message={toast.message} />
      </div>
    </div>
  );
}
