/**
 * Sentry Integration for Version Notifier
 *
 * Provides a beforeSend hook that suppresses error reports
 * when a version mismatch has been detected. This prevents
 * noise from stale JavaScript bundles.
 */

/**
 * Create a Sentry beforeSend handler that suppresses errors
 * when the app version is outdated.
 *
 * Usage with Sentry:
 * ```javascript
 * import * as Sentry from '@sentry/browser';
 * import { createSentryBeforeSend } from 'laravel-version-notifier/sentry';
 *
 * Sentry.init({
 *     dsn: '...',
 *     beforeSend: createSentryBeforeSend({
 *         // Your own beforeSend logic (optional)
 *         customBeforeSend: (event) => {
 *             // Your custom logic here
 *             return event;
 *         },
 *         // Enable debug logging (optional)
 *         debug: false,
 *     }),
 * });
 * ```
 *
 * @param {Object} options
 * @param {Function} [options.customBeforeSend] - Custom beforeSend to chain with
 * @param {boolean} [options.debug] - Enable debug logging
 * @returns {Function} Sentry beforeSend handler
 */
export function createSentryBeforeSend(options = {}) {
    const { customBeforeSend, debug = false } = options;

    return function beforeSend(event, hint) {
        // Suppress all errors when a new version has been detected
        // User's JavaScript context is stale - errors are not actionable
        if (window.VersionNotifier?.hasUpdate?.() || window.versionCheck?.hasUpdate?.()) {
            if (debug) {
                console.log('[VersionNotifier] Suppressing Sentry error due to version mismatch');
            }
            return null;
        }

        // Call custom beforeSend if provided
        if (customBeforeSend) {
            return customBeforeSend(event, hint);
        }

        return event;
    };
}

export default { createSentryBeforeSend };
