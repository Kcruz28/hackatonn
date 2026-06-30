"use client";

import { useState, type FormEvent } from "react";
import { Award, Eye, EyeOff } from "lucide-react";
import { TIER_CONFIG } from "@/app/components/app-data";
import { apiFetch, ApiError } from "@/lib/api";
import { setToken } from "@/lib/auth";
import type { AuthResponse } from "@/lib/types";

export function AuthPage({ mode, onBack, onEnter }: { mode: "login" | "signup"; onBack: () => void; onEnter: () => void }) {
  const [form, setForm] = useState({ email: "", password: "", name: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"login" | "signup">(mode);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const body =
        tab === "signup"
          ? { username: form.name, email: form.email, password: form.password }
          : { username: form.name, password: form.password };
      const res = await apiFetch<AuthResponse>(`/auth/${tab}`, {
        method: "POST",
        body: JSON.stringify(body),
      });
      setToken(res.access_token);
      onEnter();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409 && tab === "signup") {
        setTab("login");
        setError("That account already exists. Please sign in below.");
      } else {
        setError(err instanceof ApiError ? err.message : "Something went wrong. Is the backend running?");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background grid grid-cols-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="relative overflow-hidden bg-[#1C1814] flex flex-col justify-between p-12">
        <img src="https://images.unsplash.com/photo-1766596663327-b932edfe968b?w=900&h=1200&fit=crop&auto=format" alt="Kitchen counter with vegetables" className="absolute inset-0 w-full h-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1C1814] via-[#1C1814]/40 to-transparent" />

        <div className="relative z-10 flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#C04E28] flex items-center justify-center">
            <Award size={15} className="text-white" />
          </div>
          <span className="font-['Playfair_Display'] text-lg font-semibold text-white">Reci</span>
        </div>

        <div className="relative z-10">
          <blockquote className="font-['Playfair_Display'] text-2xl italic text-white/90 leading-relaxed mb-4">
            "Reci helped me find new recipes that I've shared with my friends and ones I will pass down to my kids!"
          </blockquote>
          <div className="flex items-center gap-3">
            <img src="https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=36&h=36&fit=crop&auto=format" alt="Nadia R." className="w-8 h-8 rounded-full object-cover border-2 border-white/20" />
            <div>
              <p className="text-white text-sm font-medium">Nadia Rashid</p>
              <p className="text-white/50 text-xs">142 recipes ranked · S-tier enthusiast</p>
            </div>
          </div>

          <div className="flex gap-2 mt-8">
            {(["S", "A", "B", "C"] as const).map((tier) => {
              const cfg = TIER_CONFIG[tier];
              return (
                <div key={tier} className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${cfg.bg} ${cfg.text}`}>
                  {tier}
                </div>
              );
            })}
            <div className="ml-2 flex flex-col justify-center">
              <p className="text-white/70 text-xs">Your personal ranking system</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col justify-center px-20">
        <button onClick={onBack} className="text-xs text-muted-foreground hover:text-foreground transition-colors mb-10 flex items-center gap-1 w-fit">
          ← Back to home
        </button>

        <div className="flex gap-6 mb-8 border-b border-border pb-0">
          {(["login", "signup"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setTab(type)}
              className={`pb-3 text-sm font-semibold capitalize border-b-2 transition-all -mb-px ${
                tab === type ? "border-[#C04E28] text-[#C04E28]" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {type === "login" ? "Sign in" : "Create account"}
            </button>
          ))}
        </div>

        <h2 className="font-['Playfair_Display'] text-3xl font-semibold text-foreground mb-1">
          {tab === "login" ? "Welcome back." : "Start ranking."}
        </h2>
        <p className="text-sm text-muted-foreground mb-8">
          {tab === "login" ? "Sign in to your Reci account." : "Create your free account and start tracking recipes."}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">{tab === "login" ? "Username or email" : "Username"}</label>
            <input type="text" placeholder={tab === "login" ? "margot or you@example.com" : "margot"} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full bg-muted rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-[#C04E28]/30 transition-all" />
          </div>
          {tab === "signup" && (
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Email</label>
              <input type="email" placeholder="you@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full bg-muted rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-[#C04E28]/30 transition-all" />
            </div>
          )}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-foreground">Password</label>
              {tab === "login" && (
                <button type="button" className="text-xs text-[#C04E28] hover:underline">Forgot password?</button>
              )}
            </div>
            <div className="relative">
              <input type={showPw ? "text" : "password"} placeholder="••••••••" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full bg-muted rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-[#C04E28]/30 transition-all pr-10" />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}

          <button type="submit" disabled={loading} className="w-full bg-[#C04E28] text-white text-sm font-semibold py-3 rounded-xl hover:bg-[#9E3A1C] transition-colors mt-2 flex items-center justify-center gap-2 disabled:opacity-70">
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              tab === "login" ? "Sign in" : "Create account"
            )}
          </button>
        </form>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">or continue with</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          {['Google', 'Apple'].map((provider) => (
            <button key={provider} type="button" disabled title="Not available yet" className="flex items-center justify-center gap-2 bg-muted border border-border rounded-xl py-2.5 text-sm font-medium text-foreground opacity-50 cursor-not-allowed transition-colors">
              {provider === "Google" ? (
                <svg width="15" height="15" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                </svg>
              )}
              {provider}
            </button>
          ))}
        </div>

        <p className="text-xs text-muted-foreground text-center mt-6">
          {tab === "login" ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => setTab(tab === "login" ? "signup" : "login")} className="text-[#C04E28] font-medium hover:underline">
            {tab === "login" ? "Sign up free" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}
