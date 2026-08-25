/**
 * Blocking theme script, injected into <head> before first paint.
 *
 * Two jobs, both of which must happen before the browser paints:
 *
 *   1. Decide whether THIS surface is allowed a dark theme at all.
 *      Dark mode is scoped to the signed-in product — app.bondzi.online
 *      and partners.bondzi.online. The marketing site keeps its cream
 *      editorial palette regardless of OS preference; its art direction
 *      is built on warm paper, and a first-time visitor should see the
 *      identity we chose rather than a dark variant of it.
 *
 *   2. Apply the stored preference, so a dark-mode student never gets a
 *      white flash on load. React can't do this — it runs after paint.
 *
 * Surface detection has to work on three hosts AND on localhost, where
 * every route is reachable on one origin:
 *   - production: the hostname settles it.
 *   - dev/preview: fall back to the path, treating the known marketing
 *     routes as light-only and everything else as product.
 *
 * `/partners` (marketing, plural) and `/partner/...` (the portal,
 * singular) are deliberately distinguished.
 *
 * Kept as a plain string rather than a component: it must be inline and
 * synchronous, and it must not depend on the React runtime.
 */
export const THEME_STORAGE_KEY = "bondzi-theme";

export const themeScript = `(function(){try{
var h=location.hostname,p=location.pathname;
var appHost=/^(www\\.)?(app|partners)\\./.test(h);
var marketing=p==="/"||p==="/partners"||p==="/privacy-policy"||p==="/terms-of-service"||p==="/account-deletion"||p.indexOf("/blog")===0||p.indexOf("/r/")===0;
var surface=appHost||!marketing;
var r=document.documentElement;
if(!surface){r.classList.remove("dark");r.style.colorScheme="light";return;}
var t=localStorage.getItem("${THEME_STORAGE_KEY}");
var d=t==="dark"||((!t||t==="system")&&window.matchMedia("(prefers-color-scheme: dark)").matches);
r.classList.toggle("dark",d);r.style.colorScheme=d?"dark":"light";
}catch(e){}})();`;

/** Mirrors the script's surface test, for use inside React. */
export function isProductSurface(hostname: string, pathname: string): boolean {
  const appHost = /^(www\.)?(app|partners)\./.test(hostname);
  const marketing =
    pathname === "/" ||
    pathname === "/partners" ||
    pathname === "/privacy-policy" ||
    pathname === "/terms-of-service" ||
    pathname === "/account-deletion" ||
    pathname.startsWith("/blog") ||
    pathname.startsWith("/r/");
  return appHost || !marketing;
}

export type ThemePreference = "light" | "dark" | "system";

/** Resolve a stored preference into the class that should be applied. */
export function resolveTheme(pref: ThemePreference): "light" | "dark" {
  if (pref === "system") {
    return typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return pref;
}
