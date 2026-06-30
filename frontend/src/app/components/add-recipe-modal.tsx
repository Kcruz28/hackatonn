"use client";

import { useState, type FormEvent } from "react";
import { X } from "lucide-react";
import { apiFetch, ApiError } from "@/lib/api";
import type { BackendRecipe, RecipeCreate } from "@/lib/types";

export function AddRecipeModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState<RecipeCreate>({
    title: "",
    budget: "$$",
    ingredients: "",
    steps: "",
    image_url: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      // Convert blank optional fields to null so the DB doesn't store "".
      const payload: RecipeCreate = {
        title: form.title.trim(),
        budget: form.budget || null,
        ingredients: form.ingredients?.trim() || null,
        steps: form.steps?.trim() || null,
        image_url: form.image_url?.trim() || null,
      };
      await apiFetch<BackendRecipe>("/recipes", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      onCreated();
      onClose();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError("Please sign in to add a recipe.");
      } else {
        setError(err instanceof ApiError ? err.message : "Something went wrong.");
      }
    } finally {
      setLoading(false);
    }
  }

  const field =
    "w-full bg-muted rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-[#C04E28]/30 transition-all";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-card rounded-2xl border border-border w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-['Playfair_Display'] text-xl font-semibold text-foreground">Add a recipe</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">Title</label>
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Brown Butter Gnocchi" className={field} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">Image URL</label>
            <input value={form.image_url ?? ""} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." className={field} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">Budget</label>
            <select value={form.budget ?? "$$"} onChange={(e) => setForm({ ...form, budget: e.target.value })} className={field}>
              <option value="$">$</option>
              <option value="$$">$$</option>
              <option value="$$$">$$$</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">Ingredients (one per line)</label>
            <textarea rows={3} value={form.ingredients ?? ""} onChange={(e) => setForm({ ...form, ingredients: e.target.value })} placeholder={"2 cups flour\n1 egg"} className={field} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">Steps (one per line)</label>
            <textarea rows={3} value={form.steps ?? ""} onChange={(e) => setForm({ ...form, steps: e.target.value })} placeholder={"Mix...\nCook..."} className={field} />
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="text-sm font-medium px-4 py-2 rounded-xl text-muted-foreground hover:bg-muted transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="text-sm font-semibold px-4 py-2 rounded-xl bg-[#C04E28] text-white hover:bg-[#9E3A1C] transition-colors disabled:opacity-70">
              {loading ? "Adding..." : "Add recipe"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
