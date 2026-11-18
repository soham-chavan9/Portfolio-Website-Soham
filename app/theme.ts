// Plain module (no "use client") so the server layout can read these values.

export const themeStorageKey = "portfolio-theme";

// Runs in <head> before first paint: a saved choice wins, otherwise the OS
// preference. Without it, dark-mode visitors saw the light theme flash first.
export const themeInitScript = `(function(){var t=null;try{t=localStorage.getItem(${JSON.stringify(
  themeStorageKey
)})}catch(e){}if(t!=="dark"&&t!=="light"){try{t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}catch(e){t="light"}}document.documentElement.setAttribute("data-theme",t)})();`;
