"use client";

import { useState } from "react";
import { List, Plus } from "lucide-react";
import { MY_LISTS, type ListItem } from "@/app/components/app-data";

export function ListsView() {
  const [lists, setLists] = useState(MY_LISTS);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");

  function createList() {
    if (!newName.trim()) return;
    setLists([{ id: Date.now(), name: newName, description: "New list", count: 0, cover: [], public: false, updatedAgo: "Just now" }, ...lists]);
    setNewName("");
    setShowNew(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-['Playfair_Display'] text-2xl font-semibold text-foreground">My Lists</h1>
        <button onClick={() => setShowNew(true)} className="flex items-center gap-1.5 text-sm font-medium bg-[#C04E28] text-white px-3 py-1.5 rounded-xl hover:bg-[#9E3A1C] transition-colors">
          <Plus size={14} /> New list
        </button>
      </div>

      {showNew && (
        <div className="bg-card border border-[#C04E28]/30 rounded-2xl p-4 mb-4 flex items-center gap-3">
          <input autoFocus type="text" placeholder="List name..." value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") createList(); if (e.key === "Escape") setShowNew(false); }} className="flex-1 bg-muted rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#C04E28]/30 text-foreground placeholder:text-muted-foreground" />
          <button onClick={createList} className="bg-[#C04E28] text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-[#9E3A1C] transition-colors">Create</button>
          <button onClick={() => setShowNew(false)} className="text-muted-foreground hover:text-foreground text-sm px-2">Cancel</button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {lists.map((list) => (
          <div key={list.id} className="bg-card border border-border rounded-2xl overflow-hidden group hover:shadow-md transition-shadow cursor-pointer">
            <div className="h-32 bg-muted flex overflow-hidden">
              {list.cover.length > 0 ? (
                list.cover.map((src, index) => (
                  <div key={`${list.id}-${index}`} className="flex-1 overflow-hidden">
                    <img src={src} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                ))
              ) : (
                <div className="w-full flex items-center justify-center bg-muted">
                  <List size={28} className="text-muted-foreground/40" />
                </div>
              )}
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="font-['Playfair_Display'] text-base font-semibold text-foreground leading-tight">{list.name}</h3>
                <span className={`shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full border ${list.public ? "border-[#8B9E84] text-[#8B9E84]" : "border-muted-foreground/30 text-muted-foreground"}`}>
                  {list.public ? "Public" : "Private"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">{list.description}</p>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-muted-foreground">{list.count} recipes</span>
                <span className="text-[11px] text-muted-foreground">Updated {list.updatedAgo}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
