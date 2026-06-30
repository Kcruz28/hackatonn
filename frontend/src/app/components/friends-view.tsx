"use client";

import { useState } from "react";
import { ALL_FRIENDS, TIER_CONFIG } from "@/app/components/app-data";

export function FriendsView() {
  const [friends, setFriends] = useState(ALL_FRIENDS);
  const [filter, setFilter] = useState<"All" | "Following">("All");

  const displayed = filter === "Following" ? friends.filter((friend) => friend.following) : friends;

  function toggleFollow(name: string) {
    setFriends(friends.map((friend) => (friend.name === name ? { ...friend, following: !friend.following } : friend)));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-['Playfair_Display'] text-2xl font-semibold text-foreground">Friends</h1>
        <div className="flex items-center gap-2">
          {(["All", "Following"] as const).map((option) => (
            <button key={option} onClick={() => setFilter(option)} className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${filter === option ? "bg-[#1C1814] text-white" : "text-muted-foreground hover:bg-muted"}`}>
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {displayed.map((friend) => {
          const cfg = TIER_CONFIG[friend.recentTier];
          return (
            <div key={friend.name} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4 hover:shadow-sm transition-shadow">
              <img src={friend.avatar} alt={friend.name} className="w-12 h-12 rounded-full object-cover border-2 border-border shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-['Playfair_Display'] text-[15px] font-semibold text-foreground">{friend.name}</p>
                  <span className="text-xs text-muted-foreground">{friend.handle}</span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-1 mb-2">{friend.bio}</p>
                <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                  <span className="font-mono font-semibold text-foreground">{friend.ranked}</span> ranked
                  <span>·</span>
                  <span>{friend.mutuals} mutual friends</span>
                  <span>·</span>
                  <div className="flex items-center gap-1">
                    Latest:
                    <span className={`w-4 h-4 rounded text-[9px] font-bold flex items-center justify-center ${cfg.bg} ${cfg.text}`}>{friend.recentTier}</span>
                    <span className="text-foreground font-medium">{friend.recentRecipe}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => toggleFollow(friend.name)} className={`shrink-0 text-xs font-semibold px-4 py-2 rounded-xl border transition-all ${friend.following ? "border-border text-muted-foreground hover:border-red-300 hover:text-red-500 hover:bg-red-50" : "border-[#C04E28] text-[#C04E28] hover:bg-[#C04E28] hover:text-white"}`}>
                {friend.following ? "Following" : "Follow"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
