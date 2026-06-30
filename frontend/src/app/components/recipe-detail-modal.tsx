"use client";

import { Clock, Star, X } from "lucide-react";
import { TIER_CONFIG, type Recipe } from "@/app/components/app-data";

function splitLines(value?: string): string[] {
  if (!value) return [];
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function RecipeDetailModal({ recipe, onClose }: { recipe: Recipe; onClose: () => void }) {
  const cfg = TIER_CONFIG[recipe.tier];
  const ingredients = splitLines(recipe.ingredients);
  const steps = splitLines(recipe.steps);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-card rounded-2xl border border-border w-full max-w-2xl max-h-[88vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="relative h-56 bg-muted">
          <img src={recipe.image} alt={recipe.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <button onClick={onClose} className="absolute top-3 right-3 bg-black/40 backdrop-blur-sm text-white rounded-full p-1.5 hover:bg-black/60 transition-colors">
            <X size={16} />
          </button>
          <span className="absolute top-3 left-3 bg-black/50 backdrop-blur-sm text-white text-[11px] font-medium px-2 py-0.5 rounded-full">
            {recipe.cuisine}
          </span>
        </div>

        <div className="p-6">
          <div className="flex items-start justify-between gap-4 mb-3">
            <h2 className="font-['Playfair_Display'] text-2xl font-semibold text-foreground">{recipe.name}</h2>
            <span className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold ${cfg.bg} ${cfg.text}`} title={cfg.desc}>
              {cfg.label}
            </span>
          </div>

          <div className="flex items-center gap-4 mb-5 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <img src={recipe.authorAvatar} alt={recipe.author} className="w-5 h-5 rounded-full object-cover" />
              {recipe.author}
            </span>
            <span className="flex items-center gap-1 text-[#C04E28] font-medium">
              <Star size={13} fill="currentColor" />
              {recipe.rating.toFixed(1)}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={13} />
              {recipe.time}
            </span>
          </div>

          {ingredients.length > 0 && (
            <section className="mb-6">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Ingredients</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm text-foreground">
                {ingredients.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </section>
          )}

          {steps.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Steps</h3>
              <ol className="list-decimal pl-5 space-y-2 text-sm text-foreground leading-relaxed">
                {steps.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ol>
            </section>
          )}

          {ingredients.length === 0 && steps.length === 0 && (
            <p className="text-sm text-muted-foreground">No ingredients or steps were provided for this recipe.</p>
          )}
        </div>
      </div>
    </div>
  );
}
