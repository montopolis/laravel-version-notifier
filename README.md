# Laravel Version Notifier

A version notification system for Laravel applications that detects new deployments and prompts users to refresh their browser. Features real-time WebSocket broadcasting via Laravel Reverb, HTTP polling fallback, and automatic chunk error detection.

## Features

- **Real-time WebSocket Broadcasting** - Instant notifications via Laravel Reverb/Echo (1-2 seconds)
- **HTTP Polling Fallback** - Automatic fallback if WebSocket disconnects (configurable interval)
- **Chunk Error Detection** - Catches Vite dynamic import failures from stale code
- **Filament Integration** - Pre-built components for Filament admin panels
- **Zero Dependencies** - Works with any Laravel application
- **Customizable UI** - Banner component with Alpine.js for easy customization

## Installation

### 1. Install the Package

Since this is a private package, add the repository to your `composer.json`:

```json
{
    "repositories": [
        {
            "type": "vcs",
            "url": "https://github.com/montopolis/laravel-version-notifier.git"
        }
    ]
}
```

Then install:

```bash
composer require montopolis/laravel-version-notifier:@dev
```

For CI/CD, add GitHub token authentication to your workflow:

```yaml
- name: Configure Composer GitHub token
  run: composer config --global --auth github-oauth.github.com "${{ secrets.GITHUB_TOKEN }}"

- name: Install Dependencies
  run: composer install --no-interaction --prefer-dist
```

### 2. Publish Assets

Publish the configuration and JavaScript assets:

```bash
# Configuration file
php artisan vendor:publish --tag=version-notifier-config

# JavaScript assets (required for frontend integration)
php artisan vendor:publish --tag=version-notifier-assets

# Optional: Banner component (if you want to customize it)
php artisan vendor:publish --tag=version-notifier-views
```

### 3. Configure Broadcasting (Laravel Reverb)

**Important:** Each application should have its own dedicated Reverb credentials. Do not share credentials across applications.

Add Reverb credentials to your `.env`:

```env
BROADCAST_DRIVER=reverb

# Reverb (WebSocket Broadcasting) - Use app-specific credentials
REVERB_APP_ID=your_app_id
REVERB_APP_KEY=your_app_key
REVERB_APP_SECRET=your_app_secret
REVERB_HOST=ws-reverb.example.com
REVERB_PORT=443
REVERB_SCHEME=https

# Frontend environment variables
VITE_REVERB_APP_KEY="${REVERB_APP_KEY}"
VITE_REVERB_HOST="${REVERB_HOST}"
VITE_REVERB_PORT="${REVERB_PORT}"
VITE_REVERB_SCHEME="${REVERB_SCHEME}"
```

Update `config/broadcasting.php` (may already exist):

```php
'reverb' => [
    'driver' => 'reverb',
    'key' => env('REVERB_APP_KEY'),
    'secret' => env('REVERB_APP_SECRET'),
    'app_id' => env('REVERB_APP_ID'),
    'options' => [
        'host' => env('REVERB_HOST', '127.0.0.1'),
        'port' => env('REVERB_PORT', 8080),
        'scheme' => env('REVERB_SCHEME', 'http'),
        'useTLS' => env('REVERB_SCHEME', 'http') === 'https',
    ],
],
```

### 4. Configure Version Notifier

Edit `config/version-notifier.php` and set a unique channel name for your application:

```php
'broadcasting' => [
    'enabled' => true,
    'channel' => 'your-app-name', // IMPORTANT: Use unique channel per app
],
```

## Frontend Integration

### 1. Install JavaScript Dependencies

```bash
npm install laravel-echo pusher-js
```

### 2. Configure Laravel Echo

In `resources/js/bootstrap.js`, add Laravel Echo configuration:

```javascript
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

window.Echo = new Echo({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: import.meta.env.VITE_REVERB_HOST,
    wsPort: import.meta.env.VITE_REVERB_PORT ?? 80,
    wssPort: import.meta.env.VITE_REVERB_PORT ?? 443,
    forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https',
    enabledTransports: ['ws', 'wss'],
});
```

### 3. Initialize Version Notifier

In `resources/js/app.js`, add the version notifier initialization:

```javascript
import "./bootstrap";

// Configure version notifier BEFORE importing the module
// Using dynamic import to avoid hoisting - ensures config is set first
window.versionNotifierConfig = {
    initialVersion: document.querySelector('meta[name="app-version"]')?.content,
    pollInterval: 5 * 60 * 1000, // 5 minutes (fallback)
    apiEndpoint: "/api/version",
    broadcastChannel: "your-app-name", // MUST match config/version-notifier.php
    broadcastEvent: ".AppVersionUpdated", // Leading dot required for custom event names
    websocket: true, // Enable WebSocket
    polling: true, // Keep polling as fallback
    chunkErrors: true, // Enable chunk error detection
    debug: false, // Set true for development debugging
};

// Dynamic import to ensure config is read after it's set (avoid hoisting)
import("/vendor/version-notifier/version-notifier.js")
    .then((module) => {
        const versionCheck = module.default;

        // Make available globally
        window.versionCheck = versionCheck;
        window.VersionNotifier = versionCheck;

        // Initialize when DOM ready
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", () => {
                versionCheck.init();
            });
        } else {
            versionCheck.init();
        }
    });
```

**Important Notes:**
- Set config BEFORE the dynamic import (ES6 import hoisting issue)
- Use dynamic `import()` not static `import` statement
- `broadcastChannel` must match `config/version-notifier.php`
- `broadcastEvent` requires leading dot (`.AppVersionUpdated`)

### 4. Add Banner Component

#### Option A: Filament Integration

In your Filament panel provider (e.g., `app/Providers/Filament/AdminPanelProvider.php`):

```php
use Filament\Support\Facades\FilamentView;
use Filament\View\PanelsRenderHook;
use Illuminate\Support\Facades\Blade;

public function panel(Panel $panel): Panel
{
    return $panel
        // ... other configuration
        ->renderHook(
            PanelsRenderHook::HEAD_END,
            fn (): string => Blade::render('<meta name="app-version" content="{{ app_version() }}">'),
        )
        ->renderHook(
            PanelsRenderHook::BODY_END,
            fn (): string => view('version-notifier::components.banner')->render(),
        )
        ->renderHook(
            PanelsRenderHook::SCRIPTS_AFTER,
            fn (): string => Blade::render('@vite(\'resources/js/app.js\')'),
        );
}
```

**Filament Specific Notes:**
- If banner appears at top instead of bottom, you may need to create a custom banner component with `!important` styles
- Example custom banner at `resources/views/components/version-banner.blade.php`:

```blade
<div
    x-data="{ show: false }"
    x-on:app:update-available.window="show = true"
    x-show="show"
    x-cloak
    style="position: fixed !important; right: 1rem !important; bottom: 1rem !important; z-index: 9999 !important;"
>
    {{-- Banner content --}}
</div>
```

#### Option B: Blade Layout Integration

Add to your main layout file (e.g., `resources/views/layouts/app.blade.php`):

```blade
<head>
    <meta name="app-version" content="{{ app_version() }}">
    <!-- Other head content -->
    @vite(['resources/js/app.js'])
</head>
<body>
    <!-- Your content -->
    <x-version-notifier::components.banner />
</body>
```

### 5. Build Assets

```bash
npm run build
```

## Deployment Integration

### Add to Deployment Script

Add the version broadcast command to your deployment script (e.g., `forge-deploy.sh`):

```bash
#!/bin/bash

# ... other deployment steps

# Save current version
git rev-parse HEAD | cut -c -8 > public/version.html
date +"%Y-%m-%d %T" >> public/version.html

# Broadcast new version to connected clients (non-critical, continue on failure)
echo "Broadcasting version update..."
if ! php artisan version:broadcast; then
    echo "Warning: Failed to broadcast version update (this is non-critical)"
fi

# ... continue with other deployment steps
```

**Important:** Place the broadcast command AFTER version file generation but BEFORE long-running tasks (like asset compilation) for faster user notifications.

## Configuration Options

### Broadcasting

```php
'broadcasting' => [
    'enabled' => true,              // Enable WebSocket broadcasting
    'channel' => 'app',             // Channel name (unique per app)
],
```

### HTTP Endpoint

```php
'endpoint' => [
    'enabled' => true,              // Enable /api/version endpoint
    'path' => 'api/version',        // Endpoint path
    'middleware' => ['throttle:60,1'], // Rate limiting
],
```

### Frontend

```php
'frontend' => [
    'polling' => [
        'enabled' => true,          // Enable HTTP polling fallback
        'interval' => 300000,       // 5 minutes (milliseconds)
    ],
    'chunk_errors' => [
        'enabled' => true,          // Detect Vite chunk load errors
    ],
],
```

### UI

```php
'ui' => [
    'enabled' => true,              // Show banner
    'message' => 'A new version is available. Please refresh.', // Custom message
],
```

## Usage

### Get Current Version

```php
use Montopolis\LaravelVersionNotifier\Facades\VersionNotifier;

// With timestamp
$version = VersionNotifier::get(); // "1.0.0-abc123 (2025-01-21 14:30:00)"

// Without timestamp
$version = VersionNotifier::get(false); // "1.0.0-abc123"

// Using helper function (recommended)
$version = app_version(); // "1.0.0-abc123"
```

### Broadcast Version Update

During deployment:

```bash
php artisan version:broadcast
```

For testing:

```bash
php artisan version:broadcast --test
```

### HTTP Endpoint

A version check endpoint is available at `/api/version`:

```bash
curl https://your-app.test/api/version
# {"version":"1.0.0-abc123"}
```

## Testing

### 1. Verify WebSocket Connection

Open browser DevTools and check:

```javascript
// Check Echo is loaded
window.Echo

// Check connection state
window.Echo.connector.pusher.connection.state
// Should be "connected"

// Check subscribed channels
Object.keys(window.Echo.connector.channels)
// Should include your app's channel name
```

### 2. Test Broadcast

```bash
php artisan version:broadcast --test
```

In browser console, you should see (if debug enabled):
```
[VersionNotifier] Initialized with version: 1.0.0-abc123
[VersionNotifier] Subscribing to channel: your-app-name
[VersionNotifier] Received broadcast: {version: 'test-1234567890'}
[VersionNotifier] Showing update prompt. New version: test-1234567890
```

Banner should appear at bottom-right within 1-2 seconds.

### 3. Test Polling Fallback

If WebSocket fails, polling will kick in after 30 seconds (default). Check:

```bash
curl http://your-app.test/api/version
```

### 4. Test Production Deployment

1. Open application in browser before deploying
2. Trigger deployment (which runs `php artisan version:broadcast`)
3. Banner should appear within 1-2 seconds
4. Click "Refresh" to reload with new version

## Troubleshooting

### Banner Not Appearing

**Check Echo Connection:**
```javascript
window.Echo.connector.pusher.connection.state
// Should be "connected", not "disconnected" or "connecting"
```

**Check Channel Subscription:**
```javascript
Object.keys(window.Echo.connector.channels)
// Should include your channel name (e.g., "your-app-name")
```

**Check Config Matches:**
- `config/version-notifier.php` → `'channel' => 'your-app-name'`
- `resources/js/app.js` → `broadcastChannel: "your-app-name"`

**Enable Debug Mode:**
```javascript
window.versionNotifierConfig = {
    debug: true, // Enable debug logging
    // ... other config
};
```

### Banner Position Issues (Filament)

Filament's CSS may override positioning. Create a custom banner component with `!important` styles:

```blade
<div style="position: fixed !important; right: 1rem !important; bottom: 1rem !important; z-index: 9999 !important;">
    {{-- Banner content --}}
</div>
```

### WebSocket Authentication Errors

**401 Unauthorized:**
- Verify `REVERB_APP_SECRET` in `.env` matches Reverb server
- Check `BROADCAST_DRIVER=reverb` is set
- Ensure each application has unique credentials

### Import Errors

**Module not found:**
```bash
php artisan vendor:publish --tag=version-notifier-assets --force
npm run build
```

## Architecture

### Three-Tier Detection

1. **Primary: WebSocket** - Real-time via Laravel Reverb (1-2 seconds)
2. **Fallback: HTTP Polling** - Every 5 minutes if WebSocket disconnects
3. **Emergency: Chunk Errors** - Catches failed Vite dynamic imports

### Version Detection Flow

```
Deployment → Generate version.html → Broadcast event
                                    ↓
                          Reverb → WebSocket → Browser
                                    ↓
                          Banner appears (1-2 seconds)
```

If WebSocket fails:
```
Browser → Poll /api/version (every 5 min) → Compare version → Banner
```

If Vite chunk fails:
```
Dynamic import fails → Chunk error detected → Banner
```

## Security Considerations

- **Rate Limiting:** `/api/version` endpoint is throttled by default
- **Public Channel:** Broadcasts use public channel (no authentication required)
- **Version Info:** Only version string is exposed (no sensitive data)
- **Reverb Auth:** Server-side broadcasts require proper credentials

## Performance

- **WebSocket:** Minimal overhead, persistent connection
- **Polling:** 1 request every 5 minutes per user (when WebSocket fails)
- **Broadcast:** Non-blocking, continues deployment on failure
- **Bundle Size:** ~4KB (version-notifier.js, minified)

## License

Proprietary - Internal use only.
