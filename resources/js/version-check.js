/**
 * Version Notifier Module
 *
 * Detects when a new version of the app has been deployed and prompts
 * the user to refresh their browser. Uses three detection methods:
 *
 * 1. WebSocket broadcast (immediate) - via Laravel Reverb/Echo
 * 2. Polling fallback (every 5 minutes) - for when WebSocket is disconnected
 * 3. Chunk load errors - catches failed dynamic imports from stale code
 */

// Configuration with defaults
const config = window.versionNotifierConfig || {};
const POLL_INTERVAL = config.pollInterval || 5 * 60 * 1000; // 5 minutes
const INITIAL_POLL_DELAY = config.initialPollDelay || 30 * 1000; // 30 seconds
const MAX_BACKOFF_MULTIPLIER = config.maxBackoffMultiplier || 4; // Max 20 minutes between polls
const LOCAL_STORAGE_KEY = config.storageKey || 'version-notifier-dismissed';
const API_ENDPOINT = config.apiEndpoint || '/api/version';
const BROADCAST_CHANNEL = config.broadcastChannel || 'app';
const BROADCAST_EVENT = config.broadcastEvent || 'AppVersionUpdated';

let initialVersion = null;
let newVersion = null;
let hasPrompted = false;
let pollTimeoutId = null;
let consecutiveFailures = 0;
let isSubscribed = false;
let isInitialized = false;

/**
 * Initialize version checking
 */
function init() {
    if (isInitialized) {
        return;
    }

    // Get initial version from context or config
    initialVersion = window.versionNotifierConfig?.initialVersion ||
                     window.context?.version ||
                     document.querySelector('meta[name="app-version"]')?.content;

    if (!initialVersion) {
        if (config.debug) {
            console.warn('[VersionNotifier] No initial version found. Provide via config, window.context, or meta tag.');
        }
        return;
    }

    isInitialized = true;

    if (config.debug) {
        console.log('[VersionNotifier] Initialized with version:', initialVersion);
    }

    // Listen for WebSocket broadcasts (if enabled, default true)
    if (config.websocket !== false) {
        listenForBroadcast();
    }

    // Start polling fallback (if enabled, default true)
    if (config.polling !== false) {
        startPolling();
    }

    // Detect chunk load errors (if enabled, default true)
    if (config.chunkErrors !== false) {
        detectChunkErrors();
    }
}

/**
 * Listen for AppVersionUpdated broadcasts via Echo
 */
function listenForBroadcast() {
    // If Echo is already loaded
    if (window.Echo) {
        subscribeToChannel();
    }

    // Also listen for when Echo loads later
    window.addEventListener('EchoLoaded', () => {
        subscribeToChannel();
    });
}

/**
 * Subscribe to the public app channel
 */
function subscribeToChannel() {
    if (!window.Echo || isSubscribed) {
        return;
    }

    isSubscribed = true;

    if (config.debug) {
        console.log('[VersionNotifier] Subscribing to channel:', BROADCAST_CHANNEL);
    }

    window.Echo.channel(BROADCAST_CHANNEL).listen(BROADCAST_EVENT, (event) => {
        if (config.debug) {
            console.log('[VersionNotifier] Received broadcast:', event);
        }

        if (event.version && event.version !== initialVersion) {
            newVersion = event.version;
            showRefreshPrompt();
        }
    });
}

/**
 * Start polling the version endpoint
 */
function startPolling() {
    // Poll after initial delay, then continue with dynamic intervals
    pollTimeoutId = setTimeout(() => pollAndScheduleNext(), INITIAL_POLL_DELAY);
}

/**
 * Poll for version and schedule the next check
 */
async function pollAndScheduleNext() {
    if (hasPrompted) {
        return;
    }

    await checkVersion();

    // Schedule next poll with backoff based on failures
    const multiplier = Math.min(
        Math.pow(2, consecutiveFailures),
        MAX_BACKOFF_MULTIPLIER
    );
    const nextDelay = POLL_INTERVAL * multiplier;

    if (config.debug) {
        console.log('[VersionNotifier] Next poll in:', nextDelay / 1000, 'seconds');
    }

    pollTimeoutId = setTimeout(() => pollAndScheduleNext(), nextDelay);
}

/**
 * Check the version endpoint
 */
async function checkVersion() {
    try {
        const response = await fetch(API_ENDPOINT, {
            headers: {
                Accept: 'application/json',
            },
        });

        if (!response.ok) {
            consecutiveFailures++;
            return;
        }

        consecutiveFailures = 0;

        const data = await response.json();

        if (data.version && data.version !== initialVersion) {
            newVersion = data.version;
            showRefreshPrompt();
        }
    } catch {
        consecutiveFailures++;
    }
}

/**
 * Detect Vite chunk load errors
 */
function detectChunkErrors() {
    // Handle unhandled promise rejections (common for dynamic imports)
    window.addEventListener('unhandledrejection', (event) => {
        const message = event.reason?.message || String(event.reason);

        if (isChunkLoadError(message)) {
            if (config.debug) {
                console.warn('[VersionNotifier] Chunk load error detected:', message);
            }
            event.preventDefault();
            showRefreshPrompt();
        }
    });

    // Handle regular errors
    window.addEventListener('error', (event) => {
        const message = event.message || '';

        if (isChunkLoadError(message)) {
            if (config.debug) {
                console.warn('[VersionNotifier] Chunk load error detected:', message);
            }
            event.preventDefault();
            showRefreshPrompt();
        }
    });
}

/**
 * Check if an error message indicates a chunk load failure
 */
function isChunkLoadError(message) {
    const patterns = [
        'Failed to fetch dynamically imported module',
        'Loading chunk',
        'Loading CSS chunk',
        'ChunkLoadError',
        'Importing a module script failed',
    ];

    return patterns.some((pattern) =>
        message.toLowerCase().includes(pattern.toLowerCase())
    );
}

/**
 * Show the refresh prompt
 */
function showRefreshPrompt() {
    if (hasPrompted) {
        return;
    }

    // Check if user already dismissed this version
    if (newVersion) {
        try {
            const dismissedVersion = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (dismissedVersion === newVersion) {
                if (config.debug) {
                    console.log('[VersionNotifier] Version already dismissed:', newVersion);
                }
                return;
            }
        } catch {
            // Storage unavailable (private browsing), continue to show prompt
        }
    }

    hasPrompted = true;

    // Stop polling since we've already detected a new version
    if (pollTimeoutId) {
        clearTimeout(pollTimeoutId);
    }

    if (config.debug) {
        console.log('[VersionNotifier] Showing update prompt. New version:', newVersion);
    }

    // Dispatch event for the UI banner to handle
    window.dispatchEvent(
        new CustomEvent('app:update-available', {
            detail: {
                currentVersion: initialVersion,
                newVersion: newVersion,
            },
        })
    );
}

/**
 * Dismiss the update prompt
 */
function dismiss() {
    if (newVersion) {
        try {
            localStorage.setItem(LOCAL_STORAGE_KEY, newVersion);
        } catch {
            // Storage unavailable (private browsing), dismiss only lasts this session
        }
    }

    if (config.debug) {
        console.log('[VersionNotifier] Dismissed version:', newVersion);
    }
}

/**
 * Force refresh the page
 */
function refresh() {
    window.location.reload();
}

/**
 * Check if an update has been detected
 */
function hasUpdate() {
    return hasPrompted;
}

/**
 * Get the initial version (at page load)
 */
function getInitialVersion() {
    return initialVersion;
}

/**
 * Get the new version (if detected)
 */
function getNewVersion() {
    return newVersion;
}

// Build the public API
const VersionNotifier = {
    init,
    hasUpdate,
    refresh,
    dismiss,
    getInitialVersion,
    getNewVersion,
};

// Expose globally
window.VersionNotifier = VersionNotifier;

// Also expose as versionCheck for backwards compatibility
window.versionCheck = {
    dismiss,
    refresh,
    hasUpdate,
};

// Export for ES module usage
export {
    init,
    hasUpdate,
    refresh,
    dismiss,
    getInitialVersion,
    getNewVersion,
};

export default VersionNotifier;
