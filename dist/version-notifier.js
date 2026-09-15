const e = window.versionNotifierConfig || {}, v = e.pollInterval || 300 * 1e3, E = e.initialPollDelay || 30 * 1e3, L = e.maxBackoffMultiplier || 4, g = e.storageKey || "version-notifier-dismissed", b = e.apiEndpoint || "/api/version", l = e.broadcastChannel || "app", C = e.broadcastEvent || "AppVersionUpdated";
let t = null, n = null, s = !1, a = null, r = 0, d = !1, f = !1;
function A() {
  if (!f) {
    if (t = window.versionNotifierConfig?.initialVersion || window.context?.version || document.querySelector('meta[name="app-version"]')?.content, !t) {
      e.debug && console.warn("[VersionNotifier] No initial version found. Provide via config, window.context, or meta tag.");
      return;
    }
    f = !0, e.debug && console.log("[VersionNotifier] Initialized with version:", t), e.websocket !== !1 && I(), e.polling !== !1 && k(), e.chunkErrors !== !1 && T();
  }
}
function I() {
  window.Echo && u(), window.addEventListener("EchoLoaded", () => {
    u();
  });
}
function u() {
  !window.Echo || d || (d = !0, e.debug && console.log("[VersionNotifier] Subscribing to channel:", l), window.Echo.channel(l).listen(C, (i) => {
    e.debug && console.log("[VersionNotifier] Received broadcast:", i), i.version && i.version !== t && (n = i.version, c());
  }));
}
function k() {
  a = setTimeout(() => p(), E);
}
async function p() {
  if (s)
    return;
  await S();
  const i = Math.min(
    Math.pow(2, r),
    L
  ), o = v * i;
  e.debug && console.log("[VersionNotifier] Next poll in:", o / 1e3, "seconds"), a = setTimeout(() => p(), o);
}
async function S() {
  try {
    const i = await fetch(b, {
      headers: {
        Accept: "application/json"
      }
    });
    if (!i.ok) {
      r++;
      return;
    }
    r = 0;
    const o = await i.json();
    o.version && o.version !== t && (n = o.version, c());
  } catch {
    r++;
  }
}
function T() {
  window.addEventListener("unhandledrejection", (i) => {
    const o = i.reason?.message || String(i.reason);
    w(o) && (e.debug && console.warn("[VersionNotifier] Chunk load error detected:", o), i.preventDefault(), c());
  }), window.addEventListener("error", (i) => {
    const o = i.message || "";
    w(o) && (e.debug && console.warn("[VersionNotifier] Chunk load error detected:", o), i.preventDefault(), c());
  });
}
function w(i) {
  return [
    "Failed to fetch dynamically imported module",
    "Loading chunk",
    "Loading CSS chunk",
    "ChunkLoadError",
    "Importing a module script failed"
  ].some(
    (V) => i.toLowerCase().includes(V.toLowerCase())
  );
}
function c() {
  if (!s) {
    if (n)
      try {
        if (localStorage.getItem(g) === n) {
          e.debug && console.log("[VersionNotifier] Version already dismissed:", n);
          return;
        }
      } catch {
      }
    s = !0, a && clearTimeout(a), e.debug && console.log("[VersionNotifier] Showing update prompt. New version:", n), window.dispatchEvent(
      new CustomEvent("app:update-available", {
        detail: {
          currentVersion: t,
          newVersion: n
        }
      })
    );
  }
}
function h() {
  if (n)
    try {
      localStorage.setItem(g, n);
    } catch {
    }
  e.debug && console.log("[VersionNotifier] Dismissed version:", n);
}
function m() {
  window.location.reload();
}
function N() {
  return s;
}
function y() {
  return t;
}
function P() {
  return n;
}
const _ = {
  init: A,
  hasUpdate: N,
  refresh: m,
  dismiss: h,
  getInitialVersion: y,
  getNewVersion: P
};
window.VersionNotifier = _;
window.versionCheck = {
  dismiss: h,
  refresh: m,
  hasUpdate: N
};
export {
  _ as default,
  h as dismiss,
  y as getInitialVersion,
  P as getNewVersion,
  N as hasUpdate,
  A as init,
  m as refresh
};
