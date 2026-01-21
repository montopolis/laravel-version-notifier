const i = window.versionNotifierConfig || {}, v = i.pollInterval || 5 * 60 * 1e3, E = i.initialPollDelay || 30 * 1e3, L = i.maxBackoffMultiplier || 4, p = i.storageKey || "version-notifier-dismissed", b = i.apiEndpoint || "/api/version", d = i.broadcastChannel || "app", C = i.broadcastEvent || "AppVersionUpdated";
let r = null, n = null, a = !1, c = null, s = 0, f = !1, u = !1;
function A() {
  var e, o, t;
  if (!u) {
    if (r = ((e = window.versionNotifierConfig) == null ? void 0 : e.initialVersion) || ((o = window.context) == null ? void 0 : o.version) || ((t = document.querySelector('meta[name="app-version"]')) == null ? void 0 : t.content), !r) {
      i.debug && console.warn("[VersionNotifier] No initial version found. Provide via config, window.context, or meta tag.");
      return;
    }
    u = !0, i.debug && console.log("[VersionNotifier] Initialized with version:", r), i.websocket !== !1 && I(), i.polling !== !1 && k(), i.chunkErrors !== !1 && T();
  }
}
function I() {
  window.Echo && w(), window.addEventListener("EchoLoaded", () => {
    w();
  });
}
function w() {
  !window.Echo || f || (f = !0, i.debug && console.log("[VersionNotifier] Subscribing to channel:", d), window.Echo.channel(d).listen(C, (e) => {
    i.debug && console.log("[VersionNotifier] Received broadcast:", e), e.version && e.version !== r && (n = e.version, l());
  }));
}
function k() {
  c = setTimeout(() => h(), E);
}
async function h() {
  if (a)
    return;
  await S();
  const e = Math.min(
    Math.pow(2, s),
    L
  ), o = v * e;
  i.debug && console.log("[VersionNotifier] Next poll in:", o / 1e3, "seconds"), c = setTimeout(() => h(), o);
}
async function S() {
  try {
    const e = await fetch(b, {
      headers: {
        Accept: "application/json"
      }
    });
    if (!e.ok) {
      s++;
      return;
    }
    s = 0;
    const o = await e.json();
    o.version && o.version !== r && (n = o.version, l());
  } catch {
    s++;
  }
}
function T() {
  window.addEventListener("unhandledrejection", (e) => {
    var t;
    const o = ((t = e.reason) == null ? void 0 : t.message) || String(e.reason);
    g(o) && (i.debug && console.warn("[VersionNotifier] Chunk load error detected:", o), e.preventDefault(), l());
  }), window.addEventListener("error", (e) => {
    const o = e.message || "";
    g(o) && (i.debug && console.warn("[VersionNotifier] Chunk load error detected:", o), e.preventDefault(), l());
  });
}
function g(e) {
  return [
    "Failed to fetch dynamically imported module",
    "Loading chunk",
    "Loading CSS chunk",
    "ChunkLoadError",
    "Importing a module script failed"
  ].some(
    (t) => e.toLowerCase().includes(t.toLowerCase())
  );
}
function l() {
  if (!a) {
    if (n)
      try {
        if (localStorage.getItem(p) === n) {
          i.debug && console.log("[VersionNotifier] Version already dismissed:", n);
          return;
        }
      } catch {
      }
    a = !0, c && clearTimeout(c), i.debug && console.log("[VersionNotifier] Showing update prompt. New version:", n), window.dispatchEvent(
      new CustomEvent("app:update-available", {
        detail: {
          currentVersion: r,
          newVersion: n
        }
      })
    );
  }
}
function m() {
  if (n)
    try {
      localStorage.setItem(p, n);
    } catch {
    }
  i.debug && console.log("[VersionNotifier] Dismissed version:", n);
}
function N() {
  window.location.reload();
}
function V() {
  return a;
}
function y() {
  return r;
}
function P() {
  return n;
}
const _ = {
  init: A,
  hasUpdate: V,
  refresh: N,
  dismiss: m,
  getInitialVersion: y,
  getNewVersion: P
};
window.VersionNotifier = _;
window.versionCheck = {
  dismiss: m,
  refresh: N,
  hasUpdate: V
};
export {
  _ as default,
  m as dismiss,
  y as getInitialVersion,
  P as getNewVersion,
  V as hasUpdate,
  A as init,
  N as refresh
};
