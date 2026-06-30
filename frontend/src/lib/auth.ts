// JWT (Supabase access token) stored in a readable cookie so the API wrapper can
// attach it to requests. Client-side only.

const TOKEN_KEY = "token";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export function setToken(token: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${TOKEN_KEY}=${encodeURIComponent(token)}; path=/; max-age=${MAX_AGE}; samesite=lax`;
}

export function getToken(): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(/(?:^|;\s*)token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : undefined;
}

export function clearToken(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${TOKEN_KEY}=; path=/; max-age=0`;
}
