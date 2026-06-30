"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { MY_RANKINGS, TIER_CONFIG } from "@/app/components/app-data";

export function RankingsView() {
  const [activeTier, setActiveTier] = useState<"All" | "S" | "A" | "B" | "C">("All");
  const [sortBy, setSortBy] = useState<"Recent" | "Rating">("Recent");

  const filtered = MY_RANKINGS.filter((recipe) => activeTier === "All" || recipe.tier === activeTier).sort((a, b) => (sortBy === "Rating" ? b.rating - a.rating : 0));

  const counts = {
    All: MY_RANKINGS.length,
    S: MY_RANKINGS.filter((recipe) => recipe.tier === "S").length,
    A: MY_RANKINGS.filter((recipe) => recipe.tier === "A").length,
    B: MY_RANKINGS.filter((recipe) => recipe.tier === "B").length,
    C: MY_RANKINGS.filter((recipe) => recipe.tier === "C").length,
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-['Playfair_Display'] text-2xl font-semibold text-foreground">My Rankings</h1>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground mr-1">Sort:</span>
          {(["Recent", "Rating"] as const).map((option) => (
            <button key={option} onClick={() => setSortBy(option)} className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${sortBy === option ? "bg-[#1C1814] text-white" : "text-muted-foreground hover:bg-muted"}`}>
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 mb-5">
        {(["All", "S", "A", "B", "C"] as const).map((tier) => {
          const cfg = tier !== "All" ? TIER_CONFIG[tier] : null;
          const isActive = activeTier === tier;
          return (
            <button key={tier} onClick={() => setActiveTier(tier)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${isActive ? tier === "All" ? "bg-[#1C1814] text-white border-[#1C1814]" : `${cfg!.bg} ${cfg!.text} border-transparent` : "border-border text-muted-foreground hover:border-foreground/20 bg-card"}`}>
              {tier !== "All" && <span className={`w-4 h-4 rounded-sm flex items-center justify-center text-[9px] font-bold ${isActive ? "bg-white/20" : `${cfg!.bg} ${cfg!.text}`}`}>{tier}</span>}
              {tier === "All" ? "All" : TIER_CONFIG[tier].desc}
              <span className={`font-mono text-[10px] ${isActive ? "opacity-70" : "text-muted-foreground"}`}>{counts[tier]}</span>
            </button>
          );
        })}
      </div>

      <div className="space-y-3">
        {filtered.map((recipe, index) => {
          const cfg = TIER_CONFIG[recipe.tier];
          return (
            <div key={recipe.id} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4 group hover:shadow-sm transition-shadow">
              <span className="font-mono text-sm text-muted-foreground w-5 shrink-0">{index + 1}</span>
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted shrink-0">
                <img src={recipe.image} alt={recipe.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center shrink-0 ${cfg.bg} ${cfg.text}`}>{recipe.tier}</span>
                  <h3 className="font-['Playfair_Display'] text-[15px] font-semibold text-foreground truncate">{recipe.name}</h3>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-1 mb-1">"{recipe.notes}"</p>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-muted-foreground">{recipe.cuisine} · {recipe.time}</span>
                  <span className="text-[11px] text-muted-foreground">{recipe.rankedDate}</span>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div className="flex items-center gap-1 justify-end font-mono text-lg font-semibold text-[#C04E28]">
                  {recipe.rating.toFixed(1)}
                </div>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} size={10} className={star <= Math.round(recipe.rating / 2) ? "text-[#D4A853]" : "text-muted"} fill={star <= Math.round(recipe.rating / 2) ? "currentColor" : "none"} />
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
