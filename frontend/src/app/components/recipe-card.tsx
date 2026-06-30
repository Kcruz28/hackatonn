"use client";

import { useState } from "react";
import { BookmarkPlus, Check, Clock, Heart, MessageCircle, Share2, Star } from "lucide-react";
import { TIER_CONFIG, type Recipe } from "@/app/components/app-data";

function TierBadge({ tier }: { tier: Recipe["tier"] }) {
  const cfg = TIER_CONFIG[tier];
  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${cfg.bg} ${cfg.text}`} title={cfg.desc}>
      {cfg.label}
    </div>
  );
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-1 font-mono text-sm font-medium text-[#C04E28]">
      <Star size={12} fill="currentColor" />
      {rating.toFixed(1)}
    </span>
  );
}

export function RecipeCard({ recipe }: { recipe: Recipe }) {
  const [saved, setSaved] = useState(recipe.ranked);
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(recipe.likes);

  return (
    <article className="bg-card rounded-2xl overflow-hidden border border-border group transition-shadow hover:shadow-md">
      <div className="relative h-52 bg-muted overflow-hidden">
        <img src={recipe.image} alt={recipe.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

        <div className="absolute top-3 left-3">
          <TierBadge tier={recipe.tier} />
        </div>

        <span className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm text-white text-[11px] font-medium px-2 py-0.5 rounded-full">
          {recipe.cuisine}
        </span>

        <div className="absolute bottom-3 left-3 bg-[#FDF9F3]/90 backdrop-blur-sm rounded-lg px-2 py-1">
          <StarRating rating={recipe.rating} />
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <img src={recipe.authorAvatar} alt={recipe.author} className="w-6 h-6 rounded-full object-cover border border-border" />
          <span className="text-xs text-muted-foreground">{recipe.author}</span>
          <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
            <Clock size={11} />
            {recipe.time}
          </span>
        </div>

        <h3 className="font-['Playfair_Display'] text-[17px] font-semibold leading-snug mb-2 text-foreground">{recipe.name}</h3>

        <p className="text-[13px] text-muted-foreground leading-relaxed mb-3 line-clamp-2">"{recipe.notes}"</p>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {recipe.tags.map((tag) => (
            <span key={tag} className="text-[11px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">#{tag}</span>
          ))}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div className="flex items-center gap-3">
            <button onClick={() => { setLiked(!liked); setLikes(liked ? likes - 1 : likes + 1); }} className={`flex items-center gap-1.5 text-xs transition-colors ${liked ? "text-[#C04E28]" : "text-muted-foreground hover:text-foreground"}`}>
              <Heart size={14} fill={liked ? "currentColor" : "none"} />
              {likes}
            </button>
            <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <MessageCircle size={14} />
              {recipe.comments}
            </button>
            <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <Share2 size={14} />
            </button>
          </div>

          <button onClick={() => setSaved(!saved)} className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${saved ? "bg-[#C04E28] text-white" : "bg-muted text-muted-foreground hover:bg-[#EDE7DC]"}`}>
            {saved ? <Check size={12} /> : <BookmarkPlus size={12} />}
            {saved ? "Ranked" : "Rank it"}
          </button>
        </div>
      </div>
    </article>
  );
}
