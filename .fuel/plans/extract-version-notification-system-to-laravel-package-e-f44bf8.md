# Epic: Extract version notification system to Laravel package (e-f44bf8)

## Overview

Extract Aliada's production-ready version notification system from `/Users/babul/Sandbox/aliada-create` into a reusable Laravel package `montopolis/laravel-version-notifier`. This package will support both immediate WebSocket notifications and HTTP polling fallback to detect new deployments and prompt users to refresh.

**Scope:** Phases 1-2 (Core Backend + Frontend Integration)
**Target:** Private internal use across multiple projects
**Source:** `/Users/babul/Sandbox/aliada-create`
**Destination:** `/Users/babul/Sandbox/laravel-version-notifier`

**Goals:**
- Zero-config installation works out of box (polling + default UI)
- Extract all 4 backend components + frontend assets
- Support 3 detection strategies: WebSocket, polling, chunk errors
- Optional Sentry error suppression
- Works with Laravel 11+ and PHP 8.2+
- Frontend bundle <20KB (minified)
- Compatible with Vite and Laravel Reverb

## Plan

### Phase 1: Core Package Setup

#### 1.1 Initialize Package Structure

Create base package structure:
```
montopolis/laravel-version-notifier/
├── config/version-notifier.php
├── database/migrations/add_version_tracking_to_users_table.php.stub
├── resources/
│   ├── js/version-check.js
│   ├── views/components/banner.blade.php
│   └── css/banner.css
├── routes/version-notifier.php
├── src/
│   ├── Commands/BroadcastVersionCommand.php
│   ├── Controllers/VersionController.php
│   ├── Events/AppVersionUpdated.php
│   ├── Facades/VersionNotifier.php
│   ├── Middleware/InjectVersionContext.php
│   ├── Support/
│   │   ├── VersionDetectors/
│   │   │   ├── VersionDetectorInterface.php
│   │   │   ├── GitVersionDetector.php
│   │   │   ├── FileVersionDetector.php
│   │   │   ├── ConfigVersionDetector.php
│   │   │   └── ChainVersionDetector.php
│   │   └── VersionManager.php
│   ├── Traits/HasVersionTracking.php
│   └── VersionNotifierServiceProvider.php
├── tests/
├── .gitignore
├── composer.json
├── package.json
├── vite.config.js
└── README.md
```

**Actions:**
- Initialize Laravel package structure
- Create `composer.json` with Laravel 11+ compatibility, PSR-4 autoloading
- Add `.gitignore` for vendor, node_modules, dist
- Create basic README with installation placeholder

#### 1.2 Extract Version Detection System

**Source Files:**
- `/Users/babul/Sandbox/aliada-create/app/Support/VersionGenerator.php`
- `/Users/babul/Sandbox/aliada-create/app/helpers.php` (lines 233-245)

**Target:** `src/Support/VersionDetectors/` (multiple files)

**Implementation:**

1. **VersionDetectorInterface.php** - Define contract:
```php
interface VersionDetectorInterface {
    public function detect(bool $includeTimestamp = true): ?string;
    public function isAvailable(): bool;
}
```

2. **FileVersionDetector.php** - Reads `/public/version.html`:
   - Check if `public_path('version.html')` exists
   - Read two lines: commit hash, timestamp
   - Format: `{app.version}-{hash} ({timestamp})`
   - Used in production deployments

3. **GitVersionDetector.php** - Runtime git commands:
   - Extract logic from VersionGenerator:23-39
   - Execute: `git log --pretty="%h" -n1 HEAD` for hash
   - Execute: `git log -n1 --pretty=%ci HEAD` for timestamp
   - Convert to UTC format: `Y-m-d H:i:s`

4. **ConfigVersionDetector.php** - Last resort:
   - Return `config('app.version')` with no hash
   - Used when git not available and file missing

5. **ChainVersionDetector.php** - Orchestrator:
   - Try detectors in configured order
   - Return first successful detection
   - Default chain: `['file', 'git', 'config']`

6. **VersionManager.php** - Main service class:
```php
class VersionManager {
    public function get(bool $includeTimestamp = true): string
    public function detect(): string
    public function broadcast(string $version = null): void
}
```

7. **Create Facade** at `src/Facades/VersionNotifier.php`

8. **Helper Function** at `src/helpers.php`:
```php
if (!function_exists('app_version')) {
    function app_version(bool $includeTimestamp = true): string {
        return app('version-notifier')->get($includeTimestamp);
    }
}
```

#### 1.3 Extract Broadcasting System

**Source:** `/Users/babul/Sandbox/aliada-create/app/Events/AppUpdated.php`
**Target:** `src/Events/AppVersionUpdated.php`

**Implementation:**
- Rename `AppUpdated` → `AppVersionUpdated`
- Make channel name configurable: `config('version-notifier.broadcasting.channel', 'app')`
- Keep `ShouldBroadcastNow` for immediate delivery
- Accept optional `$version` parameter (for testing)
- Update namespace to `Montopolis\LaravelVersionNotifier\Events`

#### 1.4 Extract HTTP Endpoint

**Source:**
- `/Users/babul/Sandbox/aliada-create/app/Http/Controllers/Api/GetVersionController.php`
- `/Users/babul/Sandbox/aliada-create/routes/api.php` (lines 34-37)

**Target:**
- `src/Controllers/VersionController.php`
- `routes/version-notifier.php`

**Implementation:**
- Simple invokable controller returning JSON
- Configurable route path (default: `api/version`)
- Configurable middleware (default: `throttle:60,1`)
- Named route: `version-notifier.check`

#### 1.5 Extract Artisan Command

**Source:** `/Users/babul/Sandbox/aliada-create/app/Console/Commands/BroadcastDeployment.php`
**Target:** `src/Commands/BroadcastVersionCommand.php`

**Implementation:**
- Rename command signature: `deploy:broadcast` → `version:broadcast`
- Keep `--test` flag for testing with fake version
- Use VersionManager to get version
- Fire `AppVersionUpdated` event
- Output confirmation message

#### 1.6 Create Service Provider

**Target:** `src/VersionNotifierServiceProvider.php`

**Responsibilities:**
1. Register VersionManager as singleton
2. Merge configuration from `config/version-notifier.php`
3. Load routes from `routes/version-notifier.php`
4. Load views from `resources/views`
5. Register Artisan commands
6. Register helper file
7. Publish assets with tags:
   - `version-notifier-config`
   - `version-notifier-views`
   - `version-notifier-assets`
   - `version-notifier-migrations`

#### 1.7 Create Configuration File

**Target:** `config/version-notifier.php`

**Key Options:**
- `detector` - Version detection strategy (file/git/config/chain)
- `broadcasting.enabled` - Enable WebSocket broadcasting
- `broadcasting.channel` - Channel name (default: 'app')
- `endpoint.enabled` - Enable HTTP endpoint
- `endpoint.path` - Endpoint path (default: 'api/version')
- `endpoint.middleware` - Middleware stack
- `frontend.polling.interval` - Polling interval in ms (default: 5 minutes)
- `frontend.chunk_errors.enabled` - Catch Vite import failures
- `ui.enabled` - Show default banner UI
- `ui.message` - Notification message
- `error_suppression.sentry` - Suppress Sentry errors on mismatch

### Phase 2: Frontend Integration

#### 2.1 Extract JavaScript Module

**Source:**
- `/Users/babul/Sandbox/aliada-create/resources/js/version-check.js` (complete file)
- `/Users/babul/Sandbox/aliada-create/resources/js/utils/analytics.js` (lines 100-116)

**Target:**
- `resources/js/version-check.js`
- `resources/js/sentry-integration.js` (optional)

**Implementation:**

1. **Copy and refactor `version-check.js`:**
   - Remove Aliada-specific references (change 'aliada-dismissed-version' to configurable)
   - Make configurable via `window.versionNotifierConfig`
   - Preserve all 3 detection strategies:
     - WebSocket: Echo listener on configured channel
     - Polling: Every 5 minutes with exponential backoff
     - Chunk Errors: Catch Vite dynamic import failures
   - Expose clean API on `window.VersionNotifier`:
     - `init()` - Initialize system
     - `hasUpdate()` - Check if update detected
     - `refresh()` - Reload page
     - `dismiss()` - Dismiss notification
     - `getInitialVersion()` - Get version at page load
     - `getNewVersion()` - Get detected new version

2. **Extract Sentry integration** to `resources/js/sentry-integration.js`:
   - Export `createSentryBeforeSend()` function
   - Check `window.VersionNotifier.hasUpdate()` before sending errors
   - Return `null` to suppress error if update detected

#### 2.2 Setup Build System

**Create:**
- `package.json` with Vite dependencies
- `vite.config.js` for building distributable assets

**Configuration:**
- Entry: `resources/js/version-check.js`
- Output: `dist/` directory
- Formats: ES module + UMD
- External: `laravel-echo` (peer dependency)
- Bundle CSS separately

**Scripts:**
- `npm run build` - Production build
- `npm run dev` - Watch mode for development

**Target Output:**
- `dist/version-check.js` (ES module)
- `dist/version-check.umd.js` (UMD for browser)
- `dist/version-check.css` (bundled styles)
- Goal: <20KB minified + gzipped

#### 2.3 Extract UI Component

**Source:** `/Users/babul/Sandbox/aliada-create/resources/views/components/update-banner.blade.php`
**Target:** `resources/views/components/banner.blade.php`

**Implementation:**
- Copy complete Blade component
- Replace "Aliada" with `config('app.name', 'Application')`
- Make message configurable: `config('version-notifier.ui.message')`
- Extract inline styles to `resources/css/banner.css`
- Keep Alpine.js integration (`x-data`, `x-show`, `x-transition`)
- Keep event listener: `@app:update-available.window`
- Maintain animations (slide-up, fade)

#### 2.4 Create Middleware for Version Context

**Target:** `src/Middleware/InjectVersionContext.php`

**Purpose:** Inject current version into views for JavaScript access

**Implementation:**
- Skip JSON requests
- Share `currentVersion` with all views via `view()->share()`
- Get version from VersionManager
- Document usage in README (add to layout head)

#### 2.5 Migration for User Tracking (Optional)

**Source:** `/Users/babul/Sandbox/aliada-create/database/migrations/2025_07_05_195743_add_version_tracking_to_users_table.php`
**Target:** `database/migrations/add_version_tracking_to_users_table.php.stub`

**Implementation:**
- Copy migration exactly
- Rename to `.stub` extension (publishable)
- Add documentation comments
- Adds columns: `last_seen_version`, `last_seen_announcement_date`

#### 2.6 Create Trait for User Tracking (Optional)

**Target:** `src/Traits/HasVersionTracking.php`

**Methods:**
- `updateSeenVersion(string $version)` - Update last seen version
- `hasSeenVersion(string $version)` - Check if user saw version

### Critical Files to Extract

#### Backend (Priority 1)
| Source | Destination | Lines | Notes |
|--------|-------------|-------|-------|
| `app/Events/AppUpdated.php` | `src/Events/AppVersionUpdated.php` | 29 | Rename event, update namespace |
| `app/Http/Controllers/Api/GetVersionController.php` | `src/Controllers/VersionController.php` | 15 | Simple invokable |
| `app/Console/Commands/BroadcastDeployment.php` | `src/Commands/BroadcastVersionCommand.php` | 35 | Rename signature |
| `app/Support/VersionGenerator.php` | `src/Support/VersionDetectors/*` | 52 | Split into detector classes |
| `app/helpers.php` (233-245) | `src/helpers.php` | 13 | Single helper function |
| `routes/api.php` (34-37) | `routes/version-notifier.php` | 4 | Extract route definition |

#### Frontend (Priority 2)
| Source | Destination | Lines | Notes |
|--------|-------------|-------|-------|
| `resources/js/version-check.js` | `resources/js/version-check.js` | 180 | Remove Aliada refs, add config |
| `resources/views/components/update-banner.blade.php` | `resources/views/components/banner.blade.php` | 75 | Make messages configurable |
| `resources/js/utils/analytics.js` (100-116) | `resources/js/sentry-integration.js` | 17 | Extract error suppression |

#### Database (Priority 3)
| Source | Destination | Lines | Notes |
|--------|-------------|-------|-------|
| `database/migrations/2025_07_05_195743_add_version_tracking_to_users_table.php` | `database/migrations/*.stub` | 32 | Rename to .stub, make publishable |

### Verification Steps

**Backend:**
```bash
php artisan tinker
>>> app('version-notifier')->get()
# Expected: "1.7.0-abc123de (2025-01-21 14:30:00)"

php artisan version:broadcast --test
# Expected: "Broadcasted version update: test-{timestamp}"

curl http://localhost/api/version
# Expected: {"version":"1.7.0-abc123de (...)"}
```

**Frontend:**
```javascript
// Browser console
window.VersionNotifier
// Expected: Object with methods

window.VersionNotifier.getInitialVersion()
// Expected: Version string

// After: php artisan version:broadcast --test
window.VersionNotifier.hasUpdate()
// Expected: true
```

**Integration:**
```bash
# Test in fresh Laravel 11 app
composer require montopolis/laravel-version-notifier
php artisan vendor:publish --tag=version-notifier-config
php artisan vendor:publish --tag=version-notifier-assets

# Add to layout, test full flow
```

### Dependencies

**Composer (require):**
- `php: ^8.2`
- `illuminate/support: ^11.0|^12.0`
- `illuminate/broadcasting: ^11.0|^12.0`
- `illuminate/http: ^11.0|^12.0`

**Composer (require-dev):**
- `orchestra/testbench: ^9.0|^10.0`
- `pestphp/pest: ^3.0`

**NPM (devDependencies):**
- `vite: ^5.0`

**NPM (peerDependencies):**
- `laravel-echo: ^1.16` (optional, for WebSocket)

## Acceptance Criteria

- [x] Package installable via Composer
- [ ] Zero-config installation works (polling + default UI)
- [x] All 4 backend components extracted and functional
- [ ] JavaScript module builds to <20KB (minified + gzipped)
- [ ] WebSocket broadcasting works with Reverb
- [ ] HTTP polling works with exponential backoff
- [ ] Chunk error detection catches Vite import failures
- [ ] Banner UI displays and dismisses correctly
- [ ] localStorage persistence works (dismissed versions)
- [ ] Sentry error suppression functional (optional)
- [x] Version detection chain works (file → git → config)
- [x] Artisan command broadcasts successfully
- [x] Middleware injects version context
- [x] Works with Laravel 11 and PHP 8.2+
- [ ] Can install and test in real Laravel app

## Progress Log

- **Iteration 1**: Initialized Laravel package structure with all core backend components. Created composer.json with Laravel 11+/12+ compatibility, VersionNotifierServiceProvider with auto-discovery, VersionManager for version detection (file/git fallback), AppVersionUpdated broadcast event, BroadcastVersionCommand, VersionController for HTTP endpoint, Facade, helper function, and config file. Added 7 passing Pest tests. Commit: 2c3193a
- **Iteration 2**: Created InjectVersionContext middleware that shares currentVersion with views for HTML requests (skips JSON). Registered 'version-context' middleware alias in ServiceProvider. Added 4 tests for middleware functionality. All 11 tests pass.

## Implementation Notes

**Notes from planning:**
- No tests in initial scope (deferred to Phase 5)
- Private package (no open source prep needed)
- Minimal docs (basic README with installation only)
- Focus on extraction first, optimize later
- User tracking optional (migration publishable, not auto-run)
- Error suppression optional (configurable via config)

**Post-implementation:**
1. Test in real Laravel app (aliada-ui or aliada-support)
2. Verify all detection methods work
3. Document gotchas or edge cases
4. Consider basic unit tests for VersionDetectors
5. Create demo app or video tutorial for team

## Interfaces Created

**VersionDetectorInterface** - Contract for version detection strategies:
```php
interface VersionDetectorInterface {
    public function detect(bool $includeTimestamp = true): ?string;
    public function isAvailable(): bool;
}
```

**VersionManager** - Main service class API:
```php
class VersionManager {
    public function get(bool $includeTimestamp = true): string;
    public function detect(): string;
    public function broadcast(string $version = null): void;
}
```

**JavaScript API** - Exposed on `window.VersionNotifier`:
```javascript
{
    init: () => void,
    hasUpdate: () => boolean,
    refresh: () => void,
    dismiss: () => void,
    getInitialVersion: () => string,
    getNewVersion: () => string
}
```