//#region resources/js/sentry-integration.js
function e(e = {}) {
	let { customBeforeSend: t, debug: n = !1 } = e;
	return function(e, r) {
		return window.VersionNotifier?.hasUpdate?.() || window.versionCheck?.hasUpdate?.() ? (n && console.log("[VersionNotifier] Suppressing Sentry error due to version mismatch"), null) : t ? t(e, r) : e;
	};
}
var t = { createSentryBeforeSend: e };
//#endregion
export { e as createSentryBeforeSend, t as default };
