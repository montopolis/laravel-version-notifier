function a(s = {}) {
  const { customBeforeSend: n, debug: f = !1 } = s;
  return function(o, u) {
    var e, t, r, i;
    return (t = (e = window.VersionNotifier) == null ? void 0 : e.hasUpdate) != null && t.call(e) || (i = (r = window.versionCheck) == null ? void 0 : r.hasUpdate) != null && i.call(r) ? (f && console.log("[VersionNotifier] Suppressing Sentry error due to version mismatch"), null) : n ? n(o, u) : o;
  };
}
const c = { createSentryBeforeSend: a };
export {
  a as createSentryBeforeSend,
  c as default
};
