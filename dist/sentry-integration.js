function i(n = {}) {
  const { customBeforeSend: e, debug: o = !1 } = n;
  return function(r, t) {
    return window.VersionNotifier?.hasUpdate?.() || window.versionCheck?.hasUpdate?.() ? (o && console.log("[VersionNotifier] Suppressing Sentry error due to version mismatch"), null) : e ? e(r, t) : r;
  };
}
const f = { createSentryBeforeSend: i };
export {
  i as createSentryBeforeSend,
  f as default
};
