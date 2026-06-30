"use client";

import { ArrowRight, Award, Flame, Star } from "lucide-react";
import { HERO_BG, PREVIEW_CARDS, TIER_CONFIG } from "@/app/components/app-data";

function MiniCard({ card, offset }: { card: (typeof PREVIEW_CARDS)[0]; offset: number }) {
  const cfg = TIER_CONFIG[card.tier];

  return (
    <div
      className="w-48 bg-card rounded-2xl overflow-hidden border border-border shadow-lg absolute"
      style={{ transform: `translateY(${offset}px) rotate(${offset * 0.03}deg)` }}
    >
      <div className="relative h-28 bg-muted">
        <img src={card.image} alt={card.name} className="w-full h-full object-cover" />
        <div className={`absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${cfg.bg} ${cfg.text}`}>
          {card.tier}
        </div>
      </div>
      <div className="p-2.5">
        <p className="font-['Playfair_Display'] text-[13px] font-semibold text-foreground leading-tight">{card.name}</p>
        <div className="flex items-center justify-between mt-1">
          <span className="text-[11px] text-muted-foreground">{card.author}</span>
          <span className="flex items-center gap-0.5 font-mono text-[11px] text-[#C04E28] font-medium">
            <Star size={9} fill="currentColor" />{card.rating}
          </span>
        </div>
      </div>
    </div>
  );
}

export function LandingPage({ onLogin, onSignup }: { onLogin: () => void; onSignup: () => void }) {
  return (
    <div className="min-h-screen bg-background" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <header className="absolute top-0 left-0 right-0 z-20 px-10 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#C04E28] flex items-center justify-center">
            <Award size={15} className="text-white" />
          </div>
          <span className="font-['Playfair_Display'] text-lg font-semibold text-foreground">Reci</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onLogin} className="text-sm font-medium text-white/70 hover:text-white transition-colors px-4 py-2">
            Sign in
          </button>
          <button onClick={onSignup} className="text-sm font-medium bg-[#C04E28] text-white px-4 py-2 rounded-xl hover:bg-[#9E3A1C] transition-colors">
            Get started
          </button>
        </div>
      </header>

      <div className="grid grid-cols-2 min-h-screen relative">
        <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-10 bg-[#C04E28] z-10" />

        <div className="flex flex-col justify-center px-30 pt-20">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-[#C04E28] flex items-center justify-center">
              <Award size={24} className="text-white" />
            </div>
            <span className="font-['Playfair_Display'] text-3xl font-semibold text-foreground">Reci</span>
          </div>

          <span className="inline-flex items-center gap-2 text-xs font-medium text-[#C04E28] bg-[#C04E28]/10 px-3 py-1 rounded-full w-fit mb-6">
            <Flame size={11} /> Now in early access
          </span>
          <h1 className="font-['Playfair_Display'] text-6xl font-semibold leading-[1.1] text-foreground mb-6">
            Rank every<br />
            <em className="italic text-[#C04E28]">recipe</em><br />
            you love.
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed max-w-md mb-10">
            Reci is the place to track, tier, and share the recipes that matter to you, while discovering what your friends are cooking.
          </p>

          <div className="flex flex-wrap gap-2 mb-10">
            {['Tiered Ranking', 'Friends\' Rankings', 'Personal Logs', 'Discover Trending'].map((feature) => (
              <span key={feature} className="text-xs bg-muted text-muted-foreground px-3 py-1.5 rounded-full border border-border">
                {feature}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={onSignup}
              className="flex items-center gap-2 bg-[#C04E28] text-white text-sm font-semibold px-6 py-3 rounded-xl hover:bg-[#9E3A1C] transition-colors"
            >
              Start ranking free <ArrowRight size={15} />
            </button>
            <button onClick={onLogin} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Already have an account →
            </button>
          </div>

          <div className="mt-12 flex items-center gap-3">
            <div className="flex -space-x-2">
              {[
                "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=28&h=28&fit=crop&auto=format",
                "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=28&h=28&fit=crop&auto=format",
                "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=28&h=28&fit=crop&auto=format",
                "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=28&h=28&fit=crop&auto=format",
              ].map((src, i) => (
                <img key={i} src={src} alt="" className="w-7 h-7 rounded-full border-2 border-background object-cover" />
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">2,400+</span> home cooks ranking recipes
            </p>
          </div>
        </div>

        <div className="relative overflow-hidden bg-[#1C1814]">
          <img src={HERO_BG} alt="Rustic kitchen with herbs" className="w-full h-full object-cover opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-l from-transparent via-[#1C1814]/20 to-[#1C1814]/60" />

          <div className="absolute inset-0">
            {[
              { name: "Sichuan Mapo Tofu", user: "Lin W.", rating: "8.7", tier: "S", type: "photo", img: "https://images.unsplash.com/photo-1626804475297-411203b71f08?w=300&h=300&fit=crop&auto=format", top: "6%", left: "19%", rotate: "-8deg", size: "w-44", z: 3 },
              { name: "Roasted Carrots", user: "Margot K.", rating: "8.2", tier: "A", type: "color", color: "#7A8B5A", top: "5%", left: "42%", rotate: "6deg", size: "w-40", z: 2 },
              { name: "Lemon Tart", user: "Kenji S.", rating: "9.1", tier: "S", type: "color", color: "#C04E28", top: "24%", left: "30%", rotate: "5deg", size: "w-36", z: 4 },
              { name: "Birria Tacos", user: "Cindy R.", rating: "8.9", tier: "S", type: "photo", img: "https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?w=300&h=300&fit=crop&auto=format", top: "14%", left: "52%", rotate: "-5deg", size: "w-44", z: 5 },
              { name: "Vodka Pasta", user: "Sam T.", rating: "8.8", tier: "S", type: "photo", img: "https://images.unsplash.com/photo-1556761223-4c4282c73f77?w=300&h=300&fit=crop&auto=format", top: "14%", left: "75%", rotate: "-4deg", size: "w-40", z: 2 },
              { name: "Greek Salad", user: "Kaavya P.", rating: "7.8", tier: "B", type: "color", color: "#F4ECE0", top: "40%", left: "16%", rotate: "-4deg", size: "w-40", z: 2 },
              { name: "Butter Chicken", user: "Theo M.", rating: "8.5", tier: "A", type: "photo", img: "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=300&h=300&fit=crop&auto=format", top: "34%", left: "48%", rotate: "7deg", size: "w-44", z: 4 },
              { name: "Margherita Pizza", user: "Lucia F.", rating: "9.2", tier: "S", type: "color", color: "#7A8B5A", top: "32%", left: "64%", rotate: "5deg", size: "w-40", z: 4 },
              { name: "Carne Asada Tacos", user: "Diego M.", rating: "9.0", tier: "S", type: "photo", img: "https://images.unsplash.com/photo-1611250188496-e966043a0629?w=300&h=300&fit=crop&auto=format", top: "56%", left: "10%", rotate: "6deg", size: "w-40", z: 3 },
              { name: "Falafel Bowl", user: "Nadia H.", rating: "8.0", tier: "A", type: "color", color: "#B5805C", top: "54%", left: "38%", rotate: "-6deg", size: "w-40", z: 5 },
              { name: "Fried Rice", user: "Jin K.", rating: "7.6", tier: "B", type: "color", color: "#F4ECE0", top: "52%", left: "62%", rotate: "-5deg", size: "w-36", z: 3 },
              { name: "Caesar Salad", user: "Olivia P.", rating: "7.4", tier: "B", type: "photo", img: "https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=300&h=300&fit=crop&auto=format", top: "68%", left: "28%", rotate: "4deg", size: "w-40", z: 2 },
              { name: "Pad Thai", user: "Mai S.", rating: "8.3", tier: "A", type: "photo", img: "https://images.unsplash.com/photo-1559314809-0d155014e29e?w=300&h=300&fit=crop&auto=format", top: "70%", left: "72%", rotate: "-4deg", size: "w-40", z: 4 },
              { name: "Grilled Salmon", user: "Avaya Z.", rating: "9.1", tier: "S", type: "color", color: "#C04E28", top: "71%", left: "50%", rotate: "5deg", size: "w-36", z: 4 },
            ].map((card) => (
              <div
                key={card.name}
                className={`absolute ${card.size} rounded-3xl overflow-hidden bg-white`}
                style={{
                  top: card.top,
                  left: card.left,
                  transform: `rotate(${card.rotate})`,
                  zIndex: card.z,
                  boxShadow: "0 20px 40px -8px rgba(0,0,0,0.45), 0 6px 16px -4px rgba(0,0,0,0.3)",
                }}
              >
                <div className="absolute top-3 left-3 z-10 w-7 h-7 rounded-full bg-[#C04E28] flex items-center justify-center text-white text-xs font-bold shadow-md">
                  {card.tier}
                </div>
                {card.type === "photo" ? (
                  <img src={card.img} alt={card.name} className="w-full h-32 object-cover" />
                ) : (
                  <div className="w-full h-32" style={{ backgroundColor: card.color }} />
                )}
                <div className="p-3.5">
                  <p className="text-sm font-semibold leading-tight text-[#1C1814]">{card.name}</p>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[11px] text-muted-foreground">{card.user}</span>
                    <span className="text-[11px] font-bold text-[#C04E28]">★ {card.rating}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="absolute bottom-4 left-4 right-4">
            <p className="text-white/50 text-xs font-medium">See what Cindy, Kaavya &amp; 48 others are ranking</p>
          </div>
        </div>
      </div>
    </div>
  );
}
