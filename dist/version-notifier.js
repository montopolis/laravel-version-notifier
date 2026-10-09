//#region resources/js/version-check.js
var e = window.versionNotifierConfig || {}, t = e.pollInterval || 3e5, n = e.initialPollDelay || 3e4, r = e.maxBackoffMultiplier || 4, i = e.storageKey || "version-notifier-dismissed", a = e.apiEndpoint || "/api/version", o = e.broadcastChannel || "app", s = e.broadcastEvent || "AppVersionUpdated", c = null, l = null, u = !1, d = null, f = 0, p = !1, m = !1;
function h() {
	m || (c = window.versionNotifierConfig?.initialVersion || window.context?.version || document.querySelector("meta[name=\"app-version\"]")?.content, c ? (m = !0, e.debug && console.log("[VersionNotifier] Initialized with version:", c), e.websocket !== !1 && g(), e.polling !== !1 && v(), e.chunkErrors !== !1 && x()) : e.debug && console.warn("[VersionNotifier] No initial version found. Provide via config, window.context, or meta tag."));
}
function g() {
	window.Echo && _(), window.addEventListener("EchoLoaded", () => {
		_();
	});
}
function _() {
	window.Echo && !p && (p = !0, e.debug && console.log("[VersionNotifier] Subscribing to channel:", o), window.Echo.channel(o).listen(s, (t) => {
		e.debug && console.log("[VersionNotifier] Received broadcast:", t), t.version && t.version !== c && (l = t.version, C());
	}));
}
function v() {
	d = setTimeout(() => y(), n);
}
async function y() {
	if (u) return;
	await b();
	let n = t * Math.min(2 ** f, r);
	e.debug && console.log("[VersionNotifier] Next poll in:", n / 1e3, "seconds"), d = setTimeout(() => y(), n);
}
async function b() {
	try {
		let e = await fetch(a, { headers: { Accept: "application/json" } });
		if (!e.ok) {
			f++;
			return;
		}
		f = 0;
		let t = await e.json();
		t.version && t.version !== c && (l = t.version, C());
	} catch {
		f++;
	}
}
function x() {
	window.addEventListener("unhandledrejection", (t) => {
		let n = t.reason?.message || String(t.reason);
		S(n) && (e.debug && console.warn("[VersionNotifier] Chunk load error detected:", n), t.preventDefault(), C());
	}), window.addEventListener("error", (t) => {
		let n = t.message || "";
		S(n) && (e.debug && console.warn("[VersionNotifier] Chunk load error detected:", n), t.preventDefault(), C());
	});
}
function S(e) {
	return [
		"Failed to fetch dynamically imported module",
		"Loading chunk",
		"Loading CSS chunk",
		"ChunkLoadError",
		"Importing a module script failed"
	].some((t) => e.toLowerCase().includes(t.toLowerCase()));
}
function C() {
	if (!u) {
		if (l) try {
			if (localStorage.getItem(i) === l) {
				e.debug && console.log("[VersionNotifier] Version already dismissed:", l);
				return;
			}
		} catch {}
		u = !0, d && clearTimeout(d), e.debug && console.log("[VersionNotifier] Showing update prompt. New version:", l), window.dispatchEvent(new CustomEvent("app:update-available", { detail: {
			currentVersion: c,
			newVersion: l
		} }));
	}
}
function w() {
	if (l) try {
		localStorage.setItem(i, l);
	} catch {}
	e.debug && console.log("[VersionNotifier] Dismissed version:", l);
}
function T() {
	window.location.reload();
}
function E() {
	return u;
}
function D() {
	return c;
}
function O() {
	return l;
}
var k = {
	init: h,
	hasUpdate: E,
	refresh: T,
	dismiss: w,
	getInitialVersion: D,
	getNewVersion: O
};
window.VersionNotifier = k, window.versionCheck = {
	dismiss: w,
	refresh: T,
	hasUpdate: E
};
//#endregion
export { k as default, w as dismiss, D as getInitialVersion, O as getNewVersion, E as hasUpdate, h as init, T as refresh };
