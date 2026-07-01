"use client";

import { useCallback, useEffect, useState } from "react";
import { Search, ChevronRight, Flame, Users, List as ListIcon, BarChart2, Plus, Award } from "lucide-react";
import { AuthPage } from "@/app/components/auth-page";
import { LandingPage } from "@/app/components/landing-page";
import { RankingsView } from "@/app/components/rankings-view";
import { ListsView } from "@/app/components/lists-view";
import { FriendsView } from "@/app/components/friends-view";
import { RecipeCard } from "@/app/components/recipe-card";
import { AddRecipeModal } from "@/app/components/add-recipe-modal";
import { RecipeDetailModal } from "@/app/components/recipe-detail-modal";
import { FRIENDS, NAV_ITEMS, TRENDING, TIER_CONFIG, type Recipe, type Screen } from "@/app/components/app-data";
import { apiFetch, ApiError } from "@/lib/api";
import { mapRecipe } from "@/lib/recipe-map";
import { useUser } from "@/hooks/useUser";
import type { BackendRecipe } from "@/lib/types";

export default function App() {
  const [screen, setScreen] = useState<Screen>("landing");
  const [activeNav, setActiveNav] = useState("Feed");
  const [searchFocused, setSearchFocused] = useState(false);
  const { user, loading, refresh } = useUser();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  const loadFeed = useCallback(async () => {
    try {
      const data = await apiFetch<BackendRecipe[]>("/recipes?limit=50");
      setRecipes(data.map(mapRecipe));
      setFeedError(null);
    } catch (err) {
      setFeedError(err instanceof ApiError ? err.message : "Could not load recipes. Is the backend running?");
    }
  }, []);

  async function changeAvatar() {
    const url = window.prompt("Paste an image URL for your profile photo:", user?.avatar_url ?? "");
    if (url === null) return;
    try {
      await apiFetch("/profiles/me", { method: "PATCH", body: JSON.stringify({ avatar_url: url.trim() || null }) });
      await refresh();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Could not update your photo.");
    }
  }

  useEffect(() => {
    if (screen === "app") {
      loadFeed();
      refresh();
    }
  }, [screen, loadFeed, refresh]);

  useEffect(() => {
    if (!loading && user && screen === "landing") {
      setScreen("app");
    }
  }, [user, loading, screen]);

  if (screen === "landing") {
    return <LandingPage onLogin={() => setScreen("login")} onSignup={() => setScreen("signup")} />;
  }

  if (screen === "login" || screen === "signup") {
    return <AuthPage mode={screen} onBack={() => setScreen("landing")} onEnter={() => setScreen("app")} />;
  }

  return (
    <div className="min-h-screen bg-background" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <header className="sticky top-0 z-30 bg-background/90 backdrop-blur-md border-b border-border">
        <div className="max-w-[1280px] mx-auto px-6 h-14 flex items-center gap-6">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-[#C04E28] flex items-center justify-center">
              <Award size={15} className="text-white" />
            </div>
            <span className="font-['Playfair_Display'] text-lg font-semibold text-foreground">Reci</span>
          </div>

          <div className={`flex items-center gap-2 flex-1 max-w-sm bg-muted rounded-xl px-3 py-2 transition-all ${searchFocused ? "ring-2 ring-[#C04E28]/30" : ""}`}>
            <Search size={14} className="text-muted-foreground shrink-0" />
            <input type="text" placeholder="Search recipes, cuisines, friends..." className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-full" onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)} />
          </div>

          <div className="ml-auto flex items-center gap-4">
            <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 text-sm text-[#C04E28] font-medium border border-[#C04E28]/30 px-3 py-1.5 rounded-lg hover:bg-[#C04E28]/8 transition-colors">
              <Plus size={14} />
              Add Recipe
            </button>

            <div className="flex items-center gap-2 cursor-pointer group">
              <img src={user?.avatar_url || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=36&h=36&fit=crop&auto=format"} alt="Profile" className="w-8 h-8 rounded-full object-cover border-2 border-[#C04E28]/30" />
              <span className="text-sm font-medium text-foreground">{user?.name ?? "Guest"}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-[1280px] mx-auto px-6 py-6 grid grid-cols-[220px_1fr_260px] gap-6">
        <aside className="space-y-6">
          <div className="bg-card rounded-2xl border border-border p-4 text-center">
            <button onClick={changeAvatar} title="Click to change your photo" className="block mx-auto mb-3 rounded-full">
              <img src={user?.avatar_url || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&auto=format"} alt="Profile" className="w-16 h-16 rounded-full object-cover border-4 border-[#EDE7DC] hover:opacity-80 transition-opacity" />
            </button>
            <p className="font-['Playfair_Display'] font-semibold text-foreground">{user?.name ?? "Guest"}</p>
            <p className="text-xs text-muted-foreground mt-0.5">@{(user?.name ?? "guest").toLowerCase().replace(/\s+/g, "")}</p>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[
                { val: "142", label: "Ranked" },
                { val: "9", label: "Lists" },
                { val: "48", label: "Friends" },
              ].map(({ val, label }) => (
                <div key={label} className="text-center">
                  <p className="font-mono text-sm font-semibold text-foreground">{val}</p>
                  <p className="text-[11px] text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <nav className="space-y-1">
            {NAV_ITEMS.map(({ icon: Icon, label }) => {
              const iconMap = { Flame, BarChart2, List: ListIcon, Users };
              const IconComponent = iconMap[Icon as keyof typeof iconMap] || Flame;
              return (
                <button key={label} onClick={() => setActiveNav(label)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${activeNav === label ? "bg-[#C04E28] text-white" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
                  <IconComponent size={16} />
                  {label}
                </button>
              );
            })}
          </nav>

          <div className="bg-card rounded-2xl border border-border p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">My Tier Summary</p>
            <div className="space-y-2">
              {(["S", "A", "B", "C"] as const).map((tier) => {
                const cfg = TIER_CONFIG[tier];
                const counts = { S: 12, A: 34, B: 58, C: 38 };
                const total = 142;
                const pct = Math.round((counts[tier] / total) * 100);
                return (
                  <div key={tier} className="flex items-center gap-2">
                    <span className={`w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center ${cfg.bg} ${cfg.text}`}>{tier}</span>
                    <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
                      <div className={`h-full rounded-full ${cfg.bg} opacity-80`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="font-mono text-xs text-muted-foreground w-6 text-right">{counts[tier]}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>

        <main>
          {activeNav === "Feed" && (
            <>
              <div className="flex items-center justify-between mb-5">
                <h1 className="font-['Playfair_Display'] text-2xl font-semibold text-foreground">Friends&apos; Rankings</h1>
                <div className="flex items-center gap-2">
                  {['Recent', 'Top Rated', 'Trending'].map((filter) => (
                    <button key={filter} className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${filter === "Recent" ? "bg-[#1C1814] text-white" : "text-muted-foreground hover:bg-muted"}`}>
                      {filter}
                    </button>
                  ))}
                </div>
              </div>
              {feedError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">{feedError}</p>
              )}
              {!feedError && recipes.length === 0 && (
                <p className="text-sm text-muted-foreground">No recipes yet. Add one to get started.</p>
              )}
              <div className="grid grid-cols-2 gap-4">
                {recipes.map((recipe) => (
                  <RecipeCard key={recipe.backendId ?? recipe.id} recipe={recipe} onOpen={() => setSelectedRecipe(recipe)} />
                ))}
              </div>
            </>
          )}
          {activeNav === "My Rankings" && <RankingsView />}
          {activeNav === "My Lists" && <ListsView />}
          {activeNav === "Friends" && <FriendsView />}
        </main>

        <aside className="space-y-5">
          <div className="bg-card rounded-2xl border border-border p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Trending This Week</p>
              <Flame size={13} className="text-[#C04E28]" />
            </div>
            <div className="space-y-1">
              {TRENDING.map((item, index) => (
                <div key={item.name} className="flex items-center gap-3 py-2 px-2 rounded-xl hover:bg-muted cursor-pointer transition-colors group">
                  <span className="font-mono text-xs text-muted-foreground w-4">{index + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                    <p className="text-[11px] text-muted-foreground">{item.cuisine}</p>
                  </div>
                  <span className="font-mono text-[11px] text-muted-foreground">{item.count}</span>
                  <ChevronRight size={12} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card rounded-2xl border border-border p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Friend Activity</p>
            <div className="space-y-3">
              {FRIENDS.map((friend) => (
                <div key={friend.name + friend.recipe} className="flex items-start gap-2.5">
                  <img src={friend.avatar} alt={friend.name} className="w-7 h-7 rounded-full object-cover border border-border shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-foreground leading-snug">
                      <span className="font-medium">{friend.name}</span>{' '}
                      <span className="text-muted-foreground">{friend.action}</span>{' '}
                      <span className="font-medium">{friend.recipe}</span>
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{friend.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#C04E28] to-[#9E3A1C] rounded-2xl p-4 text-white">
            <p className="font-['Playfair_Display'] text-base font-semibold mb-1">Rank something today</p>
            <p className="text-xs text-white/70 mb-3 leading-relaxed">You&apos;ve cooked 3 recipes this week. Give them a rating.</p>
            <button className="w-full bg-white/15 hover:bg-white/25 text-white text-sm font-medium py-2 rounded-xl transition-colors">Start ranking</button>
          </div>
        </aside>
      </div>

      {showAdd && (
        <AddRecipeModal onClose={() => setShowAdd(false)} onCreated={loadFeed} />
      )}
      {selectedRecipe && (
        <RecipeDetailModal recipe={selectedRecipe} onClose={() => setSelectedRecipe(null)} />
      )}
    </div>
  );
}
