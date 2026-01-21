# Laravel Version Notifier - Package Extraction Plan

## Executive Summary

This document outlines the complete plan for extracting Aliada's production-ready version notification system into a reusable Laravel package `montopolis/laravel-version-notifier`.

**Project Details:**
- **Package Name:** `montopolis/laravel-version-notifier`
- **Source:** `/Users/babul/Sandbox/aliada-create`
- **Destination:** `/Users/babul/Sandbox/laravel-version-notifier`
- **Scope:** Phases 1-2 (Core Backend + Frontend Integration)
- **Target:** Private internal use across multiple projects
- **Epic ID:** `e-f44bf8`

## Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Phase 1: Core Package Setup](#phase-1-core-package-setup)
4. [Phase 2: Frontend Integration](#phase-2-frontend-integration)
5. [Critical Files Mapping](#critical-files-mapping)
6. [Dependencies](#dependencies)
7. [Verification & Testing](#verification--testing)
8. [Installation Instructions](#installation-instructions)
9. [Deployment Integration](#deployment-integration)
10. [Success Criteria](#success-criteria)

---

## Overview

### Goals

- ✅ Zero-config installation works out of box (polling + default UI)
- ✅ Extract all 4 backend components + frontend assets
- ✅ Support 3 detection strategies: WebSocket, polling, chunk errors
- ✅ Optional Sentry error suppression
- ✅ Works with Laravel 11+ and PHP 8.2+
- ✅ Frontend bundle <20KB (minified + gzipped)
- ✅ Compatible with Vite and Laravel Reverb

### Current Implementation Analysis

The source system in `aliada-create` provides:

#### 1. Version Detection (3 Parallel Strategies)
- **WebSocket Broadcast**: Immediate notification via Laravel Reverb when `AppUpdated` event fires
- **HTTP Polling**: Falls back to `/api/version` endpoint every 5 minutes with exponential backoff
- **Chunk Error Detection**: Catches Vite dynamic import failures from stale JavaScript bundles

#### 2. User Notification
- Alpine.js update banner (bottom-right corner)
- Dismissible with localStorage persistence
- Refresh or dismiss actions

#### 3. Error Suppression (Optional)
- **Client-side**: Sentry `beforeSend` hook suppresses errors when version mismatch detected
- **Server-side**: Can be extended (not currently implemented in Aliada)

#### 4. Database Tracking (Optional)
- `last_seen_version` and `last_seen_announcement_date` columns on users table

---

## System Architecture

### Package Structure

```
montopolis/laravel-version-notifier/
├── config/
│   └── version-notifier.php              # Configuration
├── database/
│   └── migrations/
│       └── add_version_tracking_to_users_table.php.stub
├── dist/                                  # Compiled frontend assets
│   ├── version-check.js
│   ├── version-check.umd.js
│   └── version-check.css
├── resources/
│   ├── js/
│   │   ├── version-check.js              # Core JS module
│   │   └── sentry-integration.js         # Optional Sentry integration
│   ├── views/
│   │   └── components/
│   │       └── banner.blade.php          # Default UI
│   └── css/
│       └── banner.css
├── routes/
│   └── version-notifier.php              # Package routes
├── src/
│   ├── Commands/
│   │   └── BroadcastVersionCommand.php
│   ├── Controllers/
│   │   └── VersionController.php
│   ├── Events/
│   │   └── AppVersionUpdated.php
│   ├── Facades/
│   │   └── VersionNotifier.php
│   ├── Support/
│   │   ├── VersionDetectors/
│   │   │   ├── VersionDetectorInterface.php
│   │   │   ├── GitVersionDetector.php
│   │   │   ├── FileVersionDetector.php
│   │   │   ├── ConfigVersionDetector.php
│   │   │   └── ChainVersionDetector.php
│   │   └── VersionManager.php
│   ├── Middleware/
│   │   └── InjectVersionContext.php
│   ├── Traits/
│   │   └── HasVersionTracking.php
│   └── VersionNotifierServiceProvider.php
├── tests/
├── .gitignore
├── composer.json
├── package.json
├── vite.config.js
└── README.md
```

### Core Interfaces

#### VersionDetectorInterface

```php
<?php

namespace Montopolis\LaravelVersionNotifier\Support\VersionDetectors;

interface VersionDetectorInterface
{
    /**
     * Detect the application version.
     *
     * @param bool $includeTimestamp Whether to include timestamp in version string
     * @return string|null Version string or null if detection fails
     */
    public function detect(bool $includeTimestamp = true): ?string;

    /**
     * Check if this detector is available in the current environment.
     *
     * @return bool True if detector can be used
     */
    public function isAvailable(): bool;
}
```

#### VersionManager API

```php
<?php

namespace Montopolis\LaravelVersionNotifier\Support;

class VersionManager
{
    /**
     * Get the current application version.
     *
     * @param bool $includeTimestamp Whether to include timestamp
     * @return string Version string
     */
    public function get(bool $includeTimestamp = true): string;

    /**
     * Detect version using configured detectors.
     *
     * @return string Detected version
     */
    public function detect(): string;

    /**
     * Broadcast version update to all connected clients.
     *
     * @param string|null $version Custom version (for testing)
     * @return void
     */
    public function broadcast(string $version = null): void;
}
```

#### JavaScript API

```javascript
window.VersionNotifier = {
    /**
     * Initialize version checking system
     */
    init: () => void,

    /**
     * Check if update has been detected
     */
    hasUpdate: () => boolean,

    /**
     * Reload the page
     */
    refresh: () => void,

    /**
     * Dismiss the update notification
     */
    dismiss: () => void,

    /**
     * Get the version when page loaded
     */
    getInitialVersion: () => string,

    /**
     * Get the newly detected version
     */
    getNewVersion: () => string
};
```

---

## Phase 1: Core Package Setup

### 1.1 Initialize Package Structure

**Objective:** Create complete Laravel package structure with proper namespacing and autoloading.

**Actions:**

1. **Create Directory Structure**
   ```bash
   mkdir -p config database/migrations resources/{js,views/components,css}
   mkdir -p routes src/{Commands,Controllers,Events,Facades,Middleware,Support/VersionDetectors,Traits}
   mkdir -p tests
   ```

2. **Create composer.json**
   ```json
   {
       "name": "montopolis/laravel-version-notifier",
       "description": "Real-time version notification system for Laravel applications",
       "type": "library",
       "license": "MIT",
       "authors": [
           {
               "name": "Montopolis",
               "email": "contact@montopolis.com"
           }
       ],
       "require": {
           "php": "^8.2",
           "illuminate/support": "^11.0|^12.0",
           "illuminate/broadcasting": "^11.0|^12.0",
           "illuminate/http": "^11.0|^12.0"
       },
       "require-dev": {
           "orchestra/testbench": "^9.0|^10.0",
           "pestphp/pest": "^3.0",
           "pestphp/pest-plugin-laravel": "^3.0"
       },
       "autoload": {
           "psr-4": {
               "Montopolis\\LaravelVersionNotifier\\": "src/"
           },
           "files": [
               "src/helpers.php"
           ]
       },
       "autoload-dev": {
           "psr-4": {
               "Montopolis\\LaravelVersionNotifier\\Tests\\": "tests/"
           }
       },
       "extra": {
           "laravel": {
               "providers": [
                   "Montopolis\\LaravelVersionNotifier\\VersionNotifierServiceProvider"
               ],
               "aliases": {
                   "VersionNotifier": "Montopolis\\LaravelVersionNotifier\\Facades\\VersionNotifier"
               }
           }
       },
       "minimum-stability": "dev",
       "prefer-stable": true
   }
   ```

3. **Create .gitignore**
   ```
   /vendor
   /node_modules
   /dist
   composer.lock
   package-lock.json
   .DS_Store
   .idea
   .vscode
   *.log
   ```

4. **Create Basic README.md**
   ```markdown
   # Laravel Version Notifier

   Real-time version notification system for Laravel applications.

   ## Installation

   ```bash
   composer require montopolis/laravel-version-notifier
   ```

   ## Documentation

   Coming soon.
   ```

### 1.2 Extract Version Detection System

**Objective:** Create flexible version detection system supporting multiple strategies.

**Source Files:**
- `/Users/babul/Sandbox/aliada-create/app/Support/VersionGenerator.php`
- `/Users/babul/Sandbox/aliada-create/app/helpers.php` (lines 233-245)

#### Implementation Details

**1. Create VersionDetectorInterface.php**

Location: `src/Support/VersionDetectors/VersionDetectorInterface.php`

```php
<?php

namespace Montopolis\LaravelVersionNotifier\Support\VersionDetectors;

interface VersionDetectorInterface
{
    public function detect(bool $includeTimestamp = true): ?string;
    public function isAvailable(): bool;
}
```

**2. Create FileVersionDetector.php**

Location: `src/Support/VersionDetectors/FileVersionDetector.php`

**Purpose:** Primary detection method - reads `/public/version.html` generated at build time.

**Logic:**
- Check if `public_path('version.html')` exists
- Read two lines:
  - Line 1: Git commit hash (short form, e.g., `abc123de`)
  - Line 2: Timestamp (ISO format, e.g., `2025-01-21 14:30:00`)
- Combine with `config('app.version')` (e.g., `1.7.0`)
- Format: `{version}-{hash} ({timestamp})` or `{version}-{hash}`

**Usage:** Production deployments (avoids runtime Git calls)

**3. Create GitVersionDetector.php**

Location: `src/Support/VersionDetectors/GitVersionDetector.php`

**Purpose:** Fallback detection - executes Git commands at runtime.

**Logic to extract from VersionGenerator.php (lines 23-39):**
```php
// Get commit hash
exec('git log --pretty="%h" -n1 HEAD', $output);
$hash = $output[0] ?? 'unknown';

// Get commit timestamp
exec('git log -n1 --pretty=%ci HEAD', $output);
$timestamp = $output[0] ?? null;

// Convert to UTC
if ($timestamp) {
    $date = new DateTime($timestamp);
    $date->setTimezone(new DateTimeZone('UTC'));
    $timestamp = $date->format('Y-m-d H:i:s');
}
```

**Usage:** Development environments

**4. Create ConfigVersionDetector.php**

Location: `src/Support/VersionDetectors/ConfigVersionDetector.php`

**Purpose:** Last resort - returns config value only.

**Logic:**
- Return `config('app.version')` (e.g., `1.7.0`)
- No hash, no timestamp
- Always available

**Usage:** When Git not available and version file missing

**5. Create ChainVersionDetector.php**

Location: `src/Support/VersionDetectors/ChainVersionDetector.php`

**Purpose:** Orchestrates multiple detectors in priority order.

**Logic:**
```php
protected array $detectors;

public function __construct(array $detectors)
{
    $this->detectors = $detectors;
}

public function detect(bool $includeTimestamp = true): ?string
{
    foreach ($this->detectors as $detector) {
        if ($detector->isAvailable()) {
            $version = $detector->detect($includeTimestamp);
            if ($version !== null) {
                return $version;
            }
        }
    }

    return null;
}
```

**Default Chain:** `['file', 'git', 'config']`

**6. Create VersionManager.php**

Location: `src/Support/VersionManager.php`

**Purpose:** Main service class - facade interface to version detection.

```php
<?php

namespace Montopolis\LaravelVersionNotifier\Support;

use Montopolis\LaravelVersionNotifier\Events\AppVersionUpdated;

class VersionManager
{
    protected VersionDetectorInterface $detector;

    public function __construct(VersionDetectorInterface $detector)
    {
        $this->detector = $detector;
    }

    public function get(bool $includeTimestamp = true): string
    {
        return $this->detect($includeTimestamp);
    }

    public function detect(bool $includeTimestamp = true): string
    {
        $version = $this->detector->detect($includeTimestamp);
        return $version ?? config('app.version', 'unknown');
    }

    public function broadcast(string $version = null): void
    {
        event(new AppVersionUpdated($version ?? $this->get(false)));
    }
}
```

**7. Create Facade**

Location: `src/Facades/VersionNotifier.php`

```php
<?php

namespace Montopolis\LaravelVersionNotifier\Facades;

use Illuminate\Support\Facades\Facade;

class VersionNotifier extends Facade
{
    protected static function getFacadeAccessor()
    {
        return 'version-notifier';
    }
}
```

**8. Create Helper Function**

Location: `src/helpers.php`

```php
<?php

if (!function_exists('app_version')) {
    /**
     * Get the application version.
     *
     * @param bool $includeTimestamp Whether to include timestamp
     * @return string Version string
     */
    function app_version(bool $includeTimestamp = true): string
    {
        return app('version-notifier')->get($includeTimestamp);
    }
}
```

### 1.3 Extract Broadcasting System

**Objective:** Enable real-time WebSocket notifications via Laravel Broadcasting.

**Source File:** `/Users/babul/Sandbox/aliada-create/app/Events/AppUpdated.php`

**Target:** `src/Events/AppVersionUpdated.php`

**Implementation:**

```php
<?php

namespace Montopolis\LaravelVersionNotifier\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AppVersionUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public ?string $version = null)
    {
        //
    }

    public function broadcastOn(): Channel
    {
        return new Channel(
            config('version-notifier.broadcasting.channel', 'app')
        );
    }

    public function broadcastWith(): array
    {
        return [
            'version' => $this->version ?? app('version-notifier')->get(false),
        ];
    }
}
```

**Key Changes from Source:**
- Rename: `AppUpdated` → `AppVersionUpdated`
- Make channel name configurable
- Update namespace to package namespace
- Keep `ShouldBroadcastNow` for immediate delivery

### 1.4 Extract HTTP Endpoint

**Objective:** Provide HTTP endpoint for polling fallback.

**Source Files:**
- `/Users/babul/Sandbox/aliada-create/app/Http/Controllers/Api/GetVersionController.php` (15 lines)
- `/Users/babul/Sandbox/aliada-create/routes/api.php` (lines 34-37)

**Target:**
- `src/Controllers/VersionController.php`
- `routes/version-notifier.php`

**Controller Implementation:**

Location: `src/Controllers/VersionController.php`

```php
<?php

namespace Montopolis\LaravelVersionNotifier\Controllers;

use Illuminate\Http\JsonResponse;

class VersionController
{
    public function __invoke(): JsonResponse
    {
        return response()->json([
            'version' => app('version-notifier')->get(),
        ]);
    }
}
```

**Routes Implementation:**

Location: `routes/version-notifier.php`

```php
<?php

use Illuminate\Support\Facades\Route;
use Montopolis\LaravelVersionNotifier\Controllers\VersionController;

if (config('version-notifier.endpoint.enabled', true)) {
    Route::get(
        config('version-notifier.endpoint.path', 'api/version'),
        VersionController::class
    )
        ->middleware(config('version-notifier.endpoint.middleware', ['throttle:60,1']))
        ->name('version-notifier.check');
}
```

**Features:**
- Configurable path (default: `api/version`)
- Configurable middleware (default: `throttle:60,1`)
- Can be disabled via config
- Named route for easy URL generation

### 1.5 Extract Artisan Command

**Objective:** Manual version broadcasting command for deployment scripts.

**Source File:** `/Users/babul/Sandbox/aliada-create/app/Console/Commands/BroadcastDeployment.php` (35 lines)

**Target:** `src/Commands/BroadcastVersionCommand.php`

**Implementation:**

```php
<?php

namespace Montopolis\LaravelVersionNotifier\Commands;

use Illuminate\Console\Command;
use Montopolis\LaravelVersionNotifier\Events\AppVersionUpdated;

class BroadcastVersionCommand extends Command
{
    protected $signature = 'version:broadcast {--test : Use fake version for testing}';

    protected $description = 'Broadcast application version update to all connected clients';

    public function handle(): int
    {
        $version = $this->option('test')
            ? 'test-' . time()
            : app('version-notifier')->get();

        event(new AppVersionUpdated($version));

        $this->info("Broadcasted version update: {$version}");

        return self::SUCCESS;
    }
}
```

**Key Changes:**
- Rename signature: `deploy:broadcast` → `version:broadcast`
- Use VersionManager facade instead of direct helper
- Return proper exit code
- Keep `--test` flag for testing

**Usage:**
```bash
# Production deployment
php artisan version:broadcast

# Testing
php artisan version:broadcast --test
```

### 1.6 Create Service Provider

**Objective:** Register all package components with Laravel.

**Target:** `src/VersionNotifierServiceProvider.php`

**Implementation:**

```php
<?php

namespace Montopolis\LaravelVersionNotifier;

use Illuminate\Support\ServiceProvider;
use Montopolis\LaravelVersionNotifier\Commands\BroadcastVersionCommand;
use Montopolis\LaravelVersionNotifier\Support\VersionDetectors\ChainVersionDetector;
use Montopolis\LaravelVersionNotifier\Support\VersionDetectors\ConfigVersionDetector;
use Montopolis\LaravelVersionNotifier\Support\VersionDetectors\FileVersionDetector;
use Montopolis\LaravelVersionNotifier\Support\VersionDetectors\GitVersionDetector;
use Montopolis\LaravelVersionNotifier\Support\VersionManager;

class VersionNotifierServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // Merge config
        $this->mergeConfigFrom(
            __DIR__ . '/../config/version-notifier.php',
            'version-notifier'
        );

        // Register VersionManager as singleton
        $this->app->singleton('version-notifier', function ($app) {
            $detector = $this->createDetector($app['config']['version-notifier.detector']);
            return new VersionManager($detector);
        });
    }

    public function boot(): void
    {
        // Load routes
        $this->loadRoutesFrom(__DIR__ . '/../routes/version-notifier.php');

        // Load views
        $this->loadViewsFrom(__DIR__ . '/../resources/views', 'version-notifier');

        // Register commands
        if ($this->app->runningInConsole()) {
            $this->commands([
                BroadcastVersionCommand::class,
            ]);

            // Publish config
            $this->publishes([
                __DIR__ . '/../config/version-notifier.php' => config_path('version-notifier.php'),
            ], 'version-notifier-config');

            // Publish views
            $this->publishes([
                __DIR__ . '/../resources/views' => resource_path('views/vendor/version-notifier'),
            ], 'version-notifier-views');

            // Publish assets
            $this->publishes([
                __DIR__ . '/../dist' => public_path('vendor/version-notifier'),
            ], 'version-notifier-assets');

            // Publish migrations
            $this->publishes([
                __DIR__ . '/../database/migrations' => database_path('migrations'),
            ], 'version-notifier-migrations');
        }
    }

    protected function createDetector($config)
    {
        if (is_array($config)) {
            $detectors = array_map(fn($type) => $this->createSingleDetector($type), $config);
            return new ChainVersionDetector($detectors);
        }

        return $this->createSingleDetector($config);
    }

    protected function createSingleDetector(string $type)
    {
        return match ($type) {
            'file' => new FileVersionDetector(),
            'git' => new GitVersionDetector(),
            'config' => new ConfigVersionDetector(),
            default => throw new \InvalidArgumentException("Unknown detector type: {$type}"),
        };
    }
}
```

**Responsibilities:**
1. Merge package configuration
2. Register VersionManager as singleton
3. Load routes, views
4. Register Artisan commands
5. Publish assets with tags

**Publish Tags:**
- `version-notifier-config` - Configuration file
- `version-notifier-views` - Blade components
- `version-notifier-assets` - Compiled JS/CSS
- `version-notifier-migrations` - Database migrations

### 1.7 Create Configuration File

**Objective:** Centralize all package configuration options.

**Target:** `config/version-notifier.php`

**Implementation:**

```php
<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Version Detection Strategy
    |--------------------------------------------------------------------------
    |
    | Specify how the package should detect the application version.
    |
    | Options:
    | - 'file': Read from public/version.html (recommended for production)
    | - 'git': Execute git commands at runtime (development)
    | - 'config': Read from config('app.version') (fallback)
    | - array: Chain multiple strategies, e.g., ['file', 'git', 'config']
    |
    */

    'detector' => env('VERSION_NOTIFIER_DETECTOR', ['file', 'git', 'config']),

    /*
    |--------------------------------------------------------------------------
    | Broadcasting Configuration
    |--------------------------------------------------------------------------
    |
    | Configure WebSocket broadcasting for real-time version notifications.
    |
    */

    'broadcasting' => [
        'enabled' => env('VERSION_NOTIFIER_BROADCAST_ENABLED', true),
        'channel' => env('VERSION_NOTIFIER_CHANNEL', 'app'),
    ],

    /*
    |--------------------------------------------------------------------------
    | HTTP Endpoint Configuration
    |--------------------------------------------------------------------------
    |
    | Configure the HTTP endpoint used for polling fallback.
    |
    */

    'endpoint' => [
        'enabled' => true,
        'path' => 'api/version',
        'middleware' => ['throttle:60,1'],
    ],

    /*
    |--------------------------------------------------------------------------
    | Frontend Detection Strategies
    |--------------------------------------------------------------------------
    |
    | Configure client-side version detection methods.
    |
    */

    'frontend' => [
        'polling' => [
            'enabled' => true,
            'interval' => 5 * 60 * 1000, // 5 minutes in milliseconds
        ],
        'chunk_errors' => [
            'enabled' => true,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | UI Configuration
    |--------------------------------------------------------------------------
    |
    | Customize the update notification banner.
    |
    */

    'ui' => [
        'enabled' => true,
        'component' => 'version-notifier::components.banner',
        'position' => 'bottom-right',
        'message' => 'A new version is available.',
    ],

    /*
    |--------------------------------------------------------------------------
    | Error Suppression
    |--------------------------------------------------------------------------
    |
    | Suppress error reporting when version mismatch is detected.
    | Useful to prevent false positives from stale client code.
    |
    */

    'error_suppression' => [
        'enabled' => true,
        'sentry' => true,
    ],
];
```

---

## Phase 2: Frontend Integration

### 2.1 Extract JavaScript Module

**Objective:** Create configurable JavaScript module with 3 detection strategies.

**Source Files:**
- `/Users/babul/Sandbox/aliada-create/resources/js/version-check.js` (180 lines)
- `/Users/babul/Sandbox/aliada-create/resources/js/utils/analytics.js` (lines 100-116)

**Target:**
- `resources/js/version-check.js`
- `resources/js/sentry-integration.js`

#### Main Module Implementation

Location: `resources/js/version-check.js`

**Refactoring Steps:**

1. **Copy source file completely**
2. **Replace Aliada-specific references:**
   - `'aliada-dismissed-version'` → `config.storageKey`
   - `'app'` channel → `config.channel`
   - `/api/version` → `config.endpoint`

3. **Add configuration support:**

```javascript
// Read configuration from global object
const config = window.versionNotifierConfig || {
    pollingInterval: 5 * 60 * 1000,      // 5 minutes
    channel: 'app',                       // Broadcasting channel
    endpoint: '/api/version',             // HTTP endpoint
    storageKey: 'dismissed-version'       // localStorage key
};
```

4. **Expose clean API:**

```javascript
// Export public API
export function initVersionCheck() {
    // ... existing initialization code ...
}

// Global API
window.VersionNotifier = {
    init: initVersionCheck,
    hasUpdate: () => hasPrompted,
    refresh: refreshPage,
    dismiss: dismissUpdate,
    getInitialVersion: () => initialVersion,
    getNewVersion: () => newVersion
};
```

**Three Detection Strategies (Preserve All):**

**1. WebSocket Detection**
```javascript
function subscribeToVersionUpdates() {
    if (typeof window.Echo !== 'undefined' && !isSubscribed) {
        window.Echo.channel(config.channel)
            .listen('AppVersionUpdated', handleVersionUpdate);
        isSubscribed = true;
    }
}
```

**2. Polling Detection**
```javascript
function startPolling() {
    // Initial delay: 30 seconds
    pollTimeoutId = setTimeout(() => {
        checkVersion();
        // Regular interval: 5 minutes (or configured)
        pollTimeoutId = setInterval(checkVersion, config.pollingInterval);
    }, 30000);
}

async function checkVersion() {
    try {
        const response = await fetch(config.endpoint);
        const data = await response.json();

        if (data.version !== initialVersion) {
            handleVersionUpdate({ version: data.version });
        }

        // Reset failure counter on success
        consecutiveFailures = 0;
    } catch (error) {
        handlePollingFailure();
    }
}
```

**3. Chunk Error Detection**
```javascript
window.addEventListener('unhandledrejection', (event) => {
    const errorMessage = event.reason?.message || '';

    const isChunkError = [
        'Failed to fetch dynamically imported module',
        'Loading chunk',
        'Loading CSS chunk',
        'ChunkLoadError',
        'Importing a module script failed'
    ].some(pattern => errorMessage.includes(pattern));

    if (isChunkError && !hasPrompted) {
        showUpdatePrompt('unknown-chunk-error');
    }
});
```

#### Sentry Integration Module

Location: `resources/js/sentry-integration.js`

**Extract from analytics.js (lines 100-116):**

```javascript
/**
 * Create Sentry beforeSend hook that suppresses errors when update detected.
 *
 * @returns {function} beforeSend handler for Sentry.init()
 */
export function createSentryBeforeSend() {
    return (event, hint) => {
        // Don't send events in local development unless debug enabled
        if (import.meta.env.VITE_APP_ENV === "local" &&
            !import.meta.env.VITE_SENTRY_DEBUG) {
            return null;
        }

        // Suppress all errors when a new version has been detected
        // User's JavaScript context is stale - errors are not actionable
        if (window.VersionNotifier?.hasUpdate?.()) {
            return null;
        }

        return event;
    };
}
```

**Usage Example:**

```javascript
import * as Sentry from '@sentry/browser';
import { createSentryBeforeSend } from '@montopolis/laravel-version-notifier/sentry-integration';

Sentry.init({
    dsn: 'your-dsn',
    beforeSend: createSentryBeforeSend()
});
```

### 2.2 Setup Build System

**Objective:** Create distributable frontend assets using Vite.

#### Package.json

Location: `package.json`

```json
{
    "name": "laravel-version-notifier",
    "version": "1.0.0",
    "type": "module",
    "private": true,
    "scripts": {
        "build": "vite build",
        "dev": "vite build --watch"
    },
    "devDependencies": {
        "vite": "^5.0.0"
    },
    "peerDependencies": {
        "laravel-echo": "^1.16.0"
    }
}
```

#### Vite Configuration

Location: `vite.config.js`

```javascript
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    build: {
        lib: {
            entry: resolve(__dirname, 'resources/js/version-check.js'),
            name: 'VersionNotifier',
            fileName: (format) => `version-check.${format === 'es' ? 'js' : 'umd.js'}`,
            formats: ['es', 'umd']
        },
        outDir: 'dist',
        rollupOptions: {
            external: ['laravel-echo'],
            output: {
                globals: {
                    'laravel-echo': 'Echo'
                },
                assetFileNames: 'version-check.css'
            }
        },
        minify: 'terser',
        terserOptions: {
            compress: {
                drop_console: true
            }
        }
    }
});
```

**Build Output:**
- `dist/version-check.js` - ES module (for modern browsers, Vite apps)
- `dist/version-check.umd.js` - UMD (for legacy browsers, direct script inclusion)
- `dist/version-check.css` - Bundled styles

**Size Target:** <20KB minified + gzipped

**Build Commands:**
```bash
# Production build
npm run build

# Development (watch mode)
npm run dev
```

### 2.3 Extract UI Component

**Objective:** Create configurable Blade component for update notification.

**Source File:** `/Users/babul/Sandbox/aliada-create/resources/views/components/update-banner.blade.php` (75 lines)

**Target:** `resources/views/components/banner.blade.php`

**Implementation:**

```blade
{{-- Version Update Banner --}}
<div x-data="{ show: false }"
     @app:update-available.window="show = true"
     x-show="show"
     x-transition:enter="transition ease-out duration-300"
     x-transition:enter-start="opacity-0 transform translate-y-4"
     x-transition:enter-end="opacity-100 transform translate-y-0"
     x-transition:leave="transition ease-in duration-200"
     x-transition:leave-start="opacity-100"
     x-transition:leave-end="opacity-0"
     style="display: none;"
     class="fixed {{ config('version-notifier.ui.position', 'bottom-right') === 'bottom-right' ? 'bottom-4 right-4' : 'top-4 right-4' }} z-50 max-w-md">

    <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4">
        <div class="flex items-start gap-3">
            {{-- Icon --}}
            <div class="flex-shrink-0">
                <svg class="w-6 h-6 text-blue-500 animate-spin" style="animation-duration: 3s;"
                     fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            </div>

            {{-- Content --}}
            <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ config('version-notifier.ui.message', 'A new version is available.') }}
                </p>
                <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Please refresh to get the latest updates.
                </p>
            </div>

            {{-- Close button --}}
            <button @click="window.VersionNotifier.dismiss(); show = false"
                    type="button"
                    class="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
                <span class="sr-only">Dismiss</span>
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clip-rule="evenodd"></path>
                </svg>
            </button>
        </div>

        {{-- Actions --}}
        <div class="mt-4 flex gap-2">
            <button @click="window.VersionNotifier.refresh()"
                    type="button"
                    class="flex-1 inline-flex justify-center items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
                Refresh Now
            </button>

            <button @click="window.VersionNotifier.dismiss(); show = false"
                    type="button"
                    class="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-md transition-colors">
                Later
            </button>
        </div>
    </div>
</div>
```

**Key Changes:**
- Replace "Aliada" with `config('app.name', 'Application')`
- Make message configurable via config
- Make position configurable (bottom-right, top-right, etc.)
- Keep Alpine.js integration
- Keep event listener: `@app:update-available.window`
- Maintain smooth animations

**Optional CSS File:**

Location: `resources/css/banner.css`

```css
/* Version Notifier Banner Styles */
.version-notifier-banner {
    /* Additional custom styles if needed */
}

@keyframes spin-slow {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}
```

### 2.4 Create Middleware for Version Context

**Objective:** Inject current version into JavaScript context.

**Target:** `src/Middleware/InjectVersionContext.php`

**Implementation:**

```php
<?php

namespace Montopolis\LaravelVersionNotifier\Middleware;

use Closure;
use Illuminate\Http\Request;

class InjectVersionContext
{
    public function handle(Request $request, Closure $next)
    {
        // Skip JSON/API requests
        if ($request->expectsJson()) {
            return $next($request);
        }

        // Share current version with all views
        view()->share('currentVersion', app('version-notifier')->get(false));

        return $next($request);
    }
}
```

**Usage in Layouts:**

```blade
{{-- In your app layout, before </head> --}}
<script>
    window.context = window.context || {};
    window.context.version = '{{ $currentVersion ?? app_version(false) }}';
</script>
```

**Note:** This middleware is optional. Apps can inject version manually in their layouts.

### 2.5 Migration for User Tracking (Optional)

**Objective:** Enable optional user-level version tracking.

**Source:** `/Users/babul/Sandbox/aliada-create/database/migrations/2025_07_05_195743_add_version_tracking_to_users_table.php` (32 lines)

**Target:** `database/migrations/add_version_tracking_to_users_table.php.stub`

**Implementation:**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Add version tracking columns to users table.
     *
     * These columns enable tracking:
     * - last_seen_version: The last app version this user accessed
     * - last_seen_announcement_date: When they last dismissed a version notification
     *
     * Use cases:
     * - Force refresh after X days on old version
     * - Show "What's New" only once per version
     * - Analytics on version adoption rates
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('last_seen_version')->nullable()->after('remember_token');
            $table->date('last_seen_announcement_date')->nullable()->after('last_seen_version');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['last_seen_version', 'last_seen_announcement_date']);
        });
    }
};
```

**Publishing:**

Users opt-in via:
```bash
php artisan vendor:publish --tag=version-notifier-migrations
php artisan migrate
```

### 2.6 Create Trait for User Tracking (Optional)

**Objective:** Provide convenient methods for user version tracking.

**Target:** `src/Traits/HasVersionTracking.php`

**Implementation:**

```php
<?php

namespace Montopolis\LaravelVersionNotifier\Traits;

trait HasVersionTracking
{
    /**
     * Update the user's last seen version and announcement date.
     *
     * @param string $version The version the user has seen
     * @return bool
     */
    public function updateSeenVersion(string $version): bool
    {
        return $this->update([
            'last_seen_version' => $version,
            'last_seen_announcement_date' => now(),
        ]);
    }

    /**
     * Check if the user has seen a specific version.
     *
     * @param string $version The version to check
     * @return bool
     */
    public function hasSeenVersion(string $version): bool
    {
        return $this->last_seen_version === $version;
    }

    /**
     * Check if the user is on an outdated version.
     *
     * @param string $currentVersion The current app version
     * @return bool
     */
    public function isOnOutdatedVersion(string $currentVersion): bool
    {
        return $this->last_seen_version !== null
            && $this->last_seen_version !== $currentVersion;
    }

    /**
     * Get the number of days since the user last saw an announcement.
     *
     * @return int|null
     */
    public function daysSinceLastAnnouncement(): ?int
    {
        if (!$this->last_seen_announcement_date) {
            return null;
        }

        return now()->diffInDays($this->last_seen_announcement_date);
    }
}
```

**Usage:**

```php
use App\Models\User;
use Montopolis\LaravelVersionNotifier\Traits\HasVersionTracking;

class User extends Authenticatable
{
    use HasVersionTracking;
}

// In controller
$user->updateSeenVersion(app_version(false));

if ($user->isOnOutdatedVersion(app_version(false))) {
    // Force refresh or show special notice
}
```

---

## Critical Files Mapping

### Backend Files (Priority 1)

| Source File | Destination | Lines | Complexity | Notes |
|------------|-------------|-------|------------|-------|
| `app/Events/AppUpdated.php` | `src/Events/AppVersionUpdated.php` | 29 | Simple | Rename event, make channel configurable |
| `app/Http/Controllers/Api/GetVersionController.php` | `src/Controllers/VersionController.php` | 15 | Simple | Simple invokable controller |
| `app/Console/Commands/BroadcastDeployment.php` | `src/Commands/BroadcastVersionCommand.php` | 35 | Simple | Rename command signature |
| `app/Support/VersionGenerator.php` | `src/Support/VersionDetectors/*` | 52 | Moderate | Split into 5 detector classes + manager |
| `app/helpers.php` (233-245) | `src/helpers.php` | 13 | Simple | Single helper function |
| `routes/api.php` (34-37) | `routes/version-notifier.php` | 4 | Simple | Extract route definition |

**Total Backend:** ~148 lines → ~400 lines (with refactoring and new classes)

### Frontend Files (Priority 2)

| Source File | Destination | Lines | Complexity | Notes |
|------------|-------------|-------|------------|-------|
| `resources/js/version-check.js` | `resources/js/version-check.js` | 180 | Moderate | Remove Aliada refs, add config support |
| `resources/views/components/update-banner.blade.php` | `resources/views/components/banner.blade.php` | 75 | Simple | Make messages configurable |
| `resources/js/utils/analytics.js` (100-116) | `resources/js/sentry-integration.js` | 17 | Simple | Extract Sentry error suppression |

**Total Frontend:** ~272 lines → ~280 lines (minimal changes)

### Database Files (Priority 3)

| Source File | Destination | Lines | Complexity | Notes |
|------------|-------------|-------|------------|-------|
| `database/migrations/2025_07_05_195743_add_version_tracking_to_users_table.php` | `database/migrations/*.stub` | 32 | Simple | Rename to .stub, add docs |

**Total Database:** ~32 lines

### Summary

| Category | Source Lines | Destination Lines | New Components |
|----------|--------------|-------------------|----------------|
| Backend | ~148 | ~400 | 5 detectors, manager, middleware |
| Frontend | ~272 | ~280 | Sentry integration module |
| Database | ~32 | ~35 | Trait for user tracking |
| **Total** | **~452** | **~715** | **8 new classes** |

---

## Dependencies

### Composer Dependencies (Required)

```json
{
    "require": {
        "php": "^8.2",
        "illuminate/support": "^11.0|^12.0",
        "illuminate/broadcasting": "^11.0|^12.0",
        "illuminate/http": "^11.0|^12.0"
    }
}
```

**Why these versions:**
- **PHP 8.2+**: Modern PHP features (readonly properties, null coalescing)
- **Laravel 11-12**: Current and future Laravel versions

### Composer Dependencies (Development)

```json
{
    "require-dev": {
        "orchestra/testbench": "^9.0|^10.0",
        "pestphp/pest": "^3.0",
        "pestphp/pest-plugin-laravel": "^3.0"
    }
}
```

**Purpose:**
- **Orchestra Testbench**: Laravel package testing
- **Pest**: Modern testing framework (deferred to Phase 5)

### NPM Dependencies (Development)

```json
{
    "devDependencies": {
        "vite": "^5.0.0"
    }
}
```

**Purpose:**
- **Vite**: Build system for frontend assets

### NPM Peer Dependencies (Optional)

```json
{
    "peerDependencies": {
        "laravel-echo": "^1.16.0"
    }
}
```

**Purpose:**
- **Laravel Echo**: WebSocket client (optional, for real-time broadcasting)

### External Services (Optional)

**Laravel Reverb** or **Pusher**:
- Required only if using WebSocket broadcasting
- Package works without (polling fallback only)

**Sentry**:
- Required only if using error suppression feature
- `sentry/sentry-laravel` package

---

## Verification & Testing

### Backend Verification

#### 1. Version Detection

```bash
# Test in Laravel app with package installed
php artisan tinker

# Test version detection
>>> app('version-notifier')->get()
# Expected: "1.7.0-abc123de (2025-01-21 14:30:00)"

# Test without timestamp
>>> app('version-notifier')->get(false)
# Expected: "1.7.0-abc123de"

# Test helper function
>>> app_version()
# Expected: "1.7.0-abc123de (2025-01-21 14:30:00)"
```

#### 2. Broadcasting Command

```bash
# Test normal broadcast
php artisan version:broadcast
# Expected: "Broadcasted version update: 1.7.0-abc123de"

# Test with --test flag
php artisan version:broadcast --test
# Expected: "Broadcasted version update: test-1737470400"
```

#### 3. HTTP Endpoint

```bash
# Test version endpoint
curl http://localhost/api/version

# Expected response:
{
    "version": "1.7.0-abc123de (2025-01-21 14:30:00)"
}
```

#### 4. Event System

```php
# In tinker
use Illuminate\Support\Facades\Event;
use Montopolis\LaravelVersionNotifier\Events\AppVersionUpdated;

Event::fake();

app('version-notifier')->broadcast();

Event::assertDispatched(AppVersionUpdated::class, function ($event) {
    return str_starts_with($event->version, '1.7.0');
});
```

### Frontend Verification

#### 1. JavaScript API

Open browser console on app page:

```javascript
// Check VersionNotifier is defined
window.VersionNotifier
// Expected: Object { init: function, hasUpdate: function, ... }

// Check initial version
window.VersionNotifier.getInitialVersion()
// Expected: "1.7.0-abc123de"

// Check update status (before broadcast)
window.VersionNotifier.hasUpdate()
// Expected: false
```

#### 2. Update Detection

**Terminal:**
```bash
php artisan version:broadcast --test
```

**Browser console (after broadcast):**
```javascript
// Check update detected
window.VersionNotifier.hasUpdate()
// Expected: true

// Check new version
window.VersionNotifier.getNewVersion()
// Expected: "test-1737470400"

// Verify banner visible
document.querySelector('[x-data]')
// Expected: Banner element in DOM with show=true
```

#### 3. Dismissal & Persistence

**Browser console:**
```javascript
// Dismiss notification
window.VersionNotifier.dismiss()

// Check localStorage
localStorage.getItem('dismissed-version')
// Expected: "test-1737470400"

// Reload page and verify banner doesn't appear again
location.reload()
```

### Integration Verification

#### Full Flow Test

1. **Install Package**
   ```bash
   composer require montopolis/laravel-version-notifier
   php artisan vendor:publish --tag=version-notifier-config
   php artisan vendor:publish --tag=version-notifier-assets
   ```

2. **Add to Layout**
   ```blade
   {{-- resources/views/layouts/app.blade.php --}}

   {{-- In <head> --}}
   <script>
       window.context = window.context || {};
       window.context.version = '{{ app_version(false) }}';
   </script>

   {{-- Before </body> --}}
   @include('version-notifier::components.banner')
   <script type="module" src="{{ asset('vendor/version-notifier/version-check.js') }}"></script>
   ```

3. **Configure Broadcasting** (optional)
   ```env
   BROADCAST_CONNECTION=reverb
   VERSION_NOTIFIER_BROADCAST_ENABLED=true
   VERSION_NOTIFIER_CHANNEL=app
   ```

4. **Test Complete Flow**
   - Open app in browser
   - Run: `php artisan version:broadcast --test`
   - Verify banner appears within 1-2 seconds (WebSocket) or 5 minutes (polling)
   - Click "Refresh Now" → page reloads
   - OR click "Later" → banner dismisses
   - Reload page → banner stays dismissed
   - Run another broadcast with different version → banner appears again

### Error Suppression Verification (Sentry)

**Setup:**
```javascript
// In your app.js
import * as Sentry from '@sentry/browser';
import { createSentryBeforeSend } from './vendor/version-notifier/sentry-integration';

Sentry.init({
    dsn: 'your-dsn',
    beforeSend: createSentryBeforeSend()
});
```

**Test:**
```bash
# Trigger update
php artisan version:broadcast --test
```

**Browser console:**
```javascript
// Try to send error
throw new Error('Test error after version mismatch');

// Check Sentry dashboard
// Expected: Error NOT captured (suppressed due to version mismatch)
```

---

## Installation Instructions

### For Testing During Development

#### 1. Local Path Repository

Add to consuming app's `composer.json`:

```json
{
    "repositories": [
        {
            "type": "path",
            "url": "../laravel-version-notifier"
        }
    ],
    "require": {
        "montopolis/laravel-version-notifier": "@dev"
    }
}
```

```bash
composer require montopolis/laravel-version-notifier
```

#### 2. Publish Configuration

```bash
# Publish config (optional, for customization)
php artisan vendor:publish --tag=version-notifier-config

# Publish frontend assets (required)
php artisan vendor:publish --tag=version-notifier-assets

# Publish views (optional, for customization)
php artisan vendor:publish --tag=version-notifier-views

# Publish migrations (optional, for user tracking)
php artisan vendor:publish --tag=version-notifier-migrations
php artisan migrate
```

#### 3. Configure Broadcasting (Optional)

For WebSocket support, configure Laravel Broadcasting:

```env
# .env
BROADCAST_CONNECTION=reverb
VERSION_NOTIFIER_BROADCAST_ENABLED=true
VERSION_NOTIFIER_CHANNEL=app
```

Install Reverb (if not already installed):
```bash
composer require laravel/reverb
php artisan reverb:install
```

#### 4. Add to Layout

```blade
{{-- resources/views/layouts/app.blade.php --}}

<!DOCTYPE html>
<html>
<head>
    {{-- ... other head elements ... --}}

    {{-- Inject current version --}}
    <script>
        window.context = window.context || {};
        window.context.version = '{{ app_version(false) }}';
    </script>

    {{-- Optional: Configure version notifier --}}
    <script>
        window.versionNotifierConfig = {
            pollingInterval: {{ config('version-notifier.frontend.polling.interval') }},
            channel: '{{ config('version-notifier.broadcasting.channel') }}',
            endpoint: '{{ url(config('version-notifier.endpoint.path')) }}',
            storageKey: 'app-dismissed-version'
        };
    </script>
</head>
<body>
    {{-- Your app content --}}

    {{-- Update notification banner --}}
    @include('version-notifier::components.banner')

    {{-- Version check script (ES module) --}}
    <script type="module" src="{{ asset('vendor/version-notifier/version-check.js') }}"></script>

    {{-- OR use UMD version for legacy browsers --}}
    {{-- <script src="{{ asset('vendor/version-notifier/version-check.umd.js') }}"></script> --}}
</body>
</html>
```

#### 5. Build Frontend Assets (During Development)

If modifying the package frontend:

```bash
cd vendor/montopolis/laravel-version-notifier
npm install
npm run build
```

### For Production Use

#### 1. Private Package Repository

**Option A: Private Composer Registry (Recommended)**

```json
{
    "repositories": [
        {
            "type": "composer",
            "url": "https://composer.montopolis.com"
        }
    ],
    "require": {
        "montopolis/laravel-version-notifier": "^1.0"
    }
}
```

**Option B: GitHub Private Repository**

```json
{
    "repositories": [
        {
            "type": "vcs",
            "url": "git@github.com:montopolis/laravel-version-notifier.git"
        }
    ],
    "require": {
        "montopolis/laravel-version-notifier": "^1.0"
    }
}
```

#### 2. Install

```bash
composer require montopolis/laravel-version-notifier
php artisan vendor:publish --tag=version-notifier-config
php artisan vendor:publish --tag=version-notifier-assets
```

---

## Deployment Integration

### Generating Version File

#### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Generate version file
        run: |
          git rev-parse HEAD | cut -c -8 > public/version.html
          date +"%Y-%m-%d %T" >> public/version.html

      - name: Build assets
        run: |
          npm install
          npm run build

      - name: Deploy to server
        # ... your deployment steps ...

      - name: Broadcast version update
        run: |
          ssh user@server "cd /path/to/app && php artisan version:broadcast"
```

#### Laravel Forge

Add to deployment script:

```bash
cd /home/forge/example.com

# Pull latest code
git pull origin main

# Install dependencies
composer install --no-dev --optimize-autoloader

# Build assets
npm install
npm run build

# Generate version file
git rev-parse HEAD | cut -c -8 > public/version.html
date +"%Y-%m-%d %T" >> public/version.html

# Run migrations
php artisan migrate --force

# Clear caches
php artisan optimize

# Broadcast version update to connected clients
php artisan version:broadcast
```

#### Laravel Envoyer

In your deployment hook:

```bash
#!/bin/bash

# Version file generation
cd {{ release }}
git rev-parse HEAD | cut -c -8 > public/version.html
date +"%Y-%m-%d %T" >> public/version.html

# After successful deployment
php artisan version:broadcast
```

### Manual Deployment

```bash
# SSH to server
ssh user@server

# Navigate to app
cd /var/www/html

# Pull changes
git pull

# Build
composer install --no-dev
npm run build

# Generate version file
git rev-parse HEAD | cut -c -8 > public/version.html
date >> public/version.html

# Notify users
php artisan version:broadcast
```

---

## Success Criteria

### Core Functionality

- [ ] **Package installable via Composer**
  - Works with `composer require` from local path
  - Service provider auto-discovered
  - No errors during installation

- [ ] **Zero-config installation works**
  - Default polling (every 5 minutes) functional
  - Default UI banner displays correctly
  - localStorage dismissal works
  - No JavaScript errors in console

- [ ] **All 4 backend components extracted and functional**
  - VersionManager detects versions correctly
  - AppVersionUpdated event broadcasts
  - VersionController returns JSON
  - BroadcastVersionCommand works with/without --test

### Detection Strategies

- [ ] **WebSocket broadcasting works with Reverb**
  - Event fires when `version:broadcast` runs
  - Frontend Echo listener receives event
  - Banner appears within 1-2 seconds
  - Works with Reverb and Pusher

- [ ] **HTTP polling works with exponential backoff**
  - Polls `/api/version` every 5 minutes
  - Detects version changes
  - Implements exponential backoff on failures (2x, max 20min)
  - Resets failure counter on success

- [ ] **Chunk error detection catches Vite import failures**
  - Detects "Failed to fetch dynamically imported module"
  - Detects "Loading chunk" errors
  - Shows update prompt immediately
  - Prevents false negatives from stale code

### Frontend

- [ ] **JavaScript module builds to <20KB**
  - ES module: <15KB minified
  - UMD module: <18KB minified
  - Gzipped: <8KB
  - No external dependencies except laravel-echo (peer)

- [ ] **Banner UI displays and dismisses correctly**
  - Appears on version mismatch
  - "Refresh Now" button reloads page
  - "Later" button dismisses
  - Alpine.js animations smooth
  - Responsive design works

- [ ] **localStorage persistence works**
  - Dismissed version stored with key
  - Same version doesn't show again
  - New version shows banner again
  - Graceful fallback in private browsing

### Optional Features

- [ ] **Sentry error suppression functional**
  - `createSentryBeforeSend()` exports correctly
  - Suppresses errors when `hasUpdate()` is true
  - Normal errors still captured
  - Works with Sentry Browser SDK

- [ ] **Version detection chain works**
  - File detector reads `/public/version.html`
  - Git detector runs commands
  - Config detector returns `app.version`
  - Chain tries in order: file → git → config
  - Fallback graceful

- [ ] **Artisan command broadcasts successfully**
  - `version:broadcast` sends event
  - `--test` flag uses fake version
  - Output confirms version sent
  - No errors or exceptions

- [ ] **Middleware injects version context**
  - `currentVersion` available in views
  - Skips JSON requests
  - No performance impact

### Compatibility

- [ ] **Works with Laravel 11 and PHP 8.2+**
  - No deprecation warnings
  - All features functional
  - Tests pass (when added in Phase 5)

- [ ] **Can install and test in real Laravel app**
  - Installs in aliada-ui or aliada-support
  - Full flow works end-to-end
  - No conflicts with existing code
  - Performance acceptable

### Documentation

- [ ] **Basic README with installation**
  - Installation steps clear
  - Configuration documented
  - Usage examples provided
  - Deployment integration explained

---

## Phase 3: Error Suppression (Optional)

### Overview

**Objective:** Prevent false error reports from users with stale JavaScript code by suppressing errors when version mismatch is detected.

**Status:** Basic frontend Sentry suppression already implemented in Phase 2. This phase adds advanced features.

### 3.1 Backend Error Suppression Middleware

**Objective:** Suppress backend errors when client version doesn't match server version.

**Target:** `src/Middleware/SuppressVersionMismatchErrors.php`

**Implementation:**

```php
<?php

namespace Montopolis\LaravelVersionNotifier\Middleware;

use Closure;
use Illuminate\Http\Request;

class SuppressVersionMismatchErrors
{
    public function handle(Request $request, Closure $next)
    {
        // Check if client version header exists
        $clientVersion = $request->header('X-Client-Version');
        $serverVersion = app('version-notifier')->get(false);

        if ($clientVersion && $clientVersion !== $serverVersion) {
            // Client is on old version - suppress error reporting
            if (config('version-notifier.error_suppression.enabled')) {
                $this->disableErrorReporting();
            }
        }

        return $next($request);
    }

    protected function disableErrorReporting(): void
    {
        // Disable Sentry for this request
        if (class_exists('\Sentry\State\Scope')) {
            \Sentry\configureScope(function (\Sentry\State\Scope $scope): void {
                $scope->clear();
            });
        }
    }
}
```

**Usage:** Add to `app/Http/Kernel.php`:

```php
protected $middleware = [
    // ...
    \Montopolis\LaravelVersionNotifier\Middleware\SuppressVersionMismatchErrors::class,
];
```

### 3.2 Multi-Service Error Suppression

**Objective:** Support multiple error tracking services.

**Target:** `src/Support/ErrorSuppressors/`

**Implementation:**

Create interface:

```php
<?php

namespace Montopolis\LaravelVersionNotifier\Support\ErrorSuppressors;

interface ErrorSuppressorInterface
{
    public function suppress(): void;
    public function isAvailable(): bool;
}
```

**Implementations:**

1. **SentryErrorSuppressor.php**

```php
<?php

namespace Montopolis\LaravelVersionNotifier\Support\ErrorSuppressors;

class SentryErrorSuppressor implements ErrorSuppressorInterface
{
    public function suppress(): void
    {
        if ($this->isAvailable()) {
            \Sentry\configureScope(function (\Sentry\State\Scope $scope): void {
                $scope->clear();
            });
        }
    }

    public function isAvailable(): bool
    {
        return class_exists('\Sentry\State\Scope');
    }
}
```

2. **BugsnagErrorSuppressor.php**

```php
<?php

namespace Montopolis\LaravelVersionNotifier\Support\ErrorSuppressors;

class BugsnagErrorSuppressor implements ErrorSuppressorInterface
{
    public function suppress(): void
    {
        if ($this->isAvailable()) {
            app('bugsnag')->registerCallback(function ($report) {
                $report->setUnhandled(false);
            });
        }
    }

    public function isAvailable(): bool
    {
        return app()->bound('bugsnag');
    }
}
```

3. **RollbarErrorSuppressor.php**

```php
<?php

namespace Montopolis\LaravelVersionNotifier\Support\ErrorSuppressors;

class RollbarErrorSuppressor implements ErrorSuppressorInterface
{
    public function suppress(): void
    {
        if ($this->isAvailable()) {
            config(['logging.channels.rollbar.enabled' => false]);
        }
    }

    public function isAvailable(): bool
    {
        return config('logging.channels.rollbar') !== null;
    }
}
```

**Configuration Addition:**

```php
// config/version-notifier.php
'error_suppression' => [
    'enabled' => true,
    'services' => ['sentry', 'bugsnag', 'rollbar'],
],
```

### 3.3 Advanced Error Filtering

**Objective:** Fine-grained control over which errors to suppress.

**Target:** `src/Support/ErrorFilter.php`

**Implementation:**

```php
<?php

namespace Montopolis\LaravelVersionNotifier\Support;

class ErrorFilter
{
    protected array $allowedErrors = [
        // Critical errors that should always be reported
        'AuthenticationException',
        'ValidationException',
    ];

    protected array $suppressedErrors = [
        // Frontend errors from stale code
        'ChunkLoadError',
        'SyntaxError',
        'TypeError', // JS type errors
    ];

    public function shouldSuppress(string $errorType): bool
    {
        // Never suppress allowed errors
        if ($this->isAllowedError($errorType)) {
            return false;
        }

        // Always suppress known stale code errors
        if ($this->isSuppressedError($errorType)) {
            return true;
        }

        // Default: suppress if version mismatch detected
        return true;
    }

    protected function isAllowedError(string $errorType): bool
    {
        foreach ($this->allowedErrors as $allowed) {
            if (str_contains($errorType, $allowed)) {
                return true;
            }
        }
        return false;
    }

    protected function isSuppressedError(string $errorType): bool
    {
        foreach ($this->suppressedErrors as $suppressed) {
            if (str_contains($errorType, $suppressed)) {
                return true;
            }
        }
        return false;
    }
}
```

### Phase 3 Acceptance Criteria

- [ ] Backend middleware suppresses errors on version mismatch
- [ ] Support for Sentry, Bugsnag, and Rollbar
- [ ] Error filtering by type (critical vs. non-critical)
- [ ] Configuration allows enabling/disabling per service
- [ ] No false negatives (critical errors still reported)

---

## Phase 4: User Tracking (Optional)

### Overview

**Objective:** Track which versions users have seen for analytics and forced refresh scenarios.

**Status:** Migration and trait already created in Phase 2. This phase adds controller integration and analytics.

### 4.1 Version Tracking Controller

**Objective:** API endpoint for tracking user version views.

**Target:** `src/Controllers/TrackVersionController.php`

**Implementation:**

```php
<?php

namespace Montopolis\LaravelVersionNotifier\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TrackVersionController
{
    public function __invoke(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['success' => false], 401);
        }

        $version = $request->input('version');

        if (!$version) {
            return response()->json(['success' => false, 'message' => 'Version required'], 422);
        }

        $user->updateSeenVersion($version);

        return response()->json(['success' => true]);
    }
}
```

**Route Addition:**

```php
// routes/version-notifier.php

if (config('version-notifier.user_tracking.enabled', false)) {
    Route::post(
        'api/version/track',
        [\Montopolis\LaravelVersionNotifier\Controllers\TrackVersionController::class, '__invoke']
    )
        ->middleware(['auth'])
        ->name('version-notifier.track');
}
```

### 4.2 Frontend Tracking Integration

**Objective:** Automatically track when users see new versions.

**Implementation:** Add to `resources/js/version-check.js`:

```javascript
function trackVersionSeen(version) {
    // Only track if user is authenticated
    if (!window.context?.user?.id) {
        return;
    }

    fetch('/api/version/track', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || ''
        },
        body: JSON.stringify({ version })
    });
}

// Call after user dismisses notification or refreshes
function dismissUpdate() {
    if (newVersion) {
        localStorage.setItem(config.storageKey, newVersion);
        trackVersionSeen(newVersion); // Track dismissal
    }
    hasPrompted = false;
}
```

### 4.3 Analytics Dashboard

**Objective:** Visualize version adoption rates.

**Target:** `src/Analytics/VersionAnalytics.php`

**Implementation:**

```php
<?php

namespace Montopolis\LaravelVersionNotifier\Analytics;

use Illuminate\Support\Facades\DB;

class VersionAnalytics
{
    /**
     * Get version adoption statistics.
     */
    public function getAdoptionStats(): array
    {
        $currentVersion = app('version-notifier')->get(false);

        return [
            'current_version' => $currentVersion,
            'total_users' => $this->getTotalUsers(),
            'on_current_version' => $this->getUsersOnVersion($currentVersion),
            'on_old_version' => $this->getUsersOnOldVersions($currentVersion),
            'never_tracked' => $this->getUsersNeverTracked(),
            'adoption_rate' => $this->getAdoptionRate($currentVersion),
            'versions_breakdown' => $this->getVersionsBreakdown(),
        ];
    }

    /**
     * Get users on a specific version.
     */
    public function getUsersOnVersion(string $version): int
    {
        return DB::table('users')
            ->where('last_seen_version', $version)
            ->count();
    }

    /**
     * Get users on outdated versions.
     */
    public function getUsersOnOldVersions(string $currentVersion): int
    {
        return DB::table('users')
            ->whereNotNull('last_seen_version')
            ->where('last_seen_version', '!=', $currentVersion)
            ->count();
    }

    /**
     * Get users who have never been tracked.
     */
    public function getUsersNeverTracked(): int
    {
        return DB::table('users')
            ->whereNull('last_seen_version')
            ->count();
    }

    /**
     * Calculate adoption rate for current version.
     */
    public function getAdoptionRate(string $currentVersion): float
    {
        $total = $this->getTotalUsers();
        if ($total === 0) {
            return 0.0;
        }

        $onCurrent = $this->getUsersOnVersion($currentVersion);
        return round(($onCurrent / $total) * 100, 2);
    }

    /**
     * Get breakdown of all versions.
     */
    public function getVersionsBreakdown(): array
    {
        return DB::table('users')
            ->select('last_seen_version', DB::raw('count(*) as count'))
            ->whereNotNull('last_seen_version')
            ->groupBy('last_seen_version')
            ->orderByDesc('count')
            ->get()
            ->map(fn($row) => [
                'version' => $row->last_seen_version,
                'users' => $row->count,
            ])
            ->toArray();
    }

    protected function getTotalUsers(): int
    {
        return DB::table('users')->count();
    }
}
```

### 4.4 Forced Refresh Logic

**Objective:** Force users on very old versions to refresh.

**Target:** `src/Middleware/ForceRefreshOldVersions.php`

**Implementation:**

```php
<?php

namespace Montopolis\LaravelVersionNotifier\Middleware;

use Closure;
use Illuminate\Http\Request;

class ForceRefreshOldVersions
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if (!$user || !method_exists($user, 'daysSinceLastAnnouncement')) {
            return $next($request);
        }

        $maxDays = config('version-notifier.user_tracking.force_refresh_after_days', 7);
        $daysSince = $user->daysSinceLastAnnouncement();

        if ($daysSince !== null && $daysSince >= $maxDays) {
            // Force a refresh by returning a special response
            return response()->view('version-notifier::force-refresh', [
                'days' => $daysSince,
                'version' => app('version-notifier')->get(false),
            ]);
        }

        return $next($request);
    }
}
```

**View:** `resources/views/force-refresh.blade.php`

```blade
<!DOCTYPE html>
<html>
<head>
    <title>Update Required</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body {
            font-family: system-ui, -apple-system, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .container {
            background: white;
            padding: 3rem;
            border-radius: 1rem;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            max-width: 500px;
            text-align: center;
        }
        h1 { margin: 0 0 1rem; color: #1a202c; }
        p { color: #4a5568; line-height: 1.6; margin: 1rem 0; }
        button {
            background: #667eea;
            color: white;
            border: none;
            padding: 1rem 2rem;
            border-radius: 0.5rem;
            font-size: 1rem;
            cursor: pointer;
            margin-top: 1rem;
        }
        button:hover { background: #5a67d8; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔄 Update Required</h1>
        <p>You've been using an outdated version for {{ $days }} days.</p>
        <p>Please refresh to get the latest updates and improvements.</p>
        <p><strong>Version:</strong> {{ $version }}</p>
        <button onclick="window.location.reload()">Refresh Now</button>
    </div>
</body>
</html>
```

### Phase 4 Acceptance Criteria

- [ ] Track version endpoint records user views
- [ ] Frontend automatically tracks dismissals
- [ ] Analytics class provides adoption statistics
- [ ] Forced refresh middleware works after N days
- [ ] Analytics accessible via Artisan command or API
- [ ] No performance impact on normal requests

---

## Phase 5: Testing & Documentation

### Overview

**Objective:** Comprehensive test coverage and production-ready documentation.

### 5.1 Unit Tests

**Target:** `tests/Unit/`

#### VersionDetectors Tests

**File:** `tests/Unit/VersionDetectors/FileVersionDetectorTest.php`

```php
<?php

use Montopolis\LaravelVersionNotifier\Support\VersionDetectors\FileVersionDetector;

it('detects version from file', function () {
    // Create test version file
    $path = public_path('version.html');
    file_put_contents($path, "abc123de\n2025-01-21 14:30:00");

    $detector = new FileVersionDetector();

    expect($detector->isAvailable())->toBeTrue();
    expect($detector->detect())->toContain('abc123de');

    unlink($path);
});

it('returns null when file does not exist', function () {
    $detector = new FileVersionDetector();

    if (file_exists(public_path('version.html'))) {
        unlink(public_path('version.html'));
    }

    expect($detector->isAvailable())->toBeFalse();
    expect($detector->detect())->toBeNull();
});
```

**File:** `tests/Unit/VersionDetectors/GitVersionDetectorTest.php`

```php
<?php

use Montopolis\LaravelVersionNotifier\Support\VersionDetectors\GitVersionDetector;

it('detects version from git', function () {
    $detector = new GitVersionDetector();

    if (!$detector->isAvailable()) {
        $this->markTestSkipped('Git not available');
    }

    $version = $detector->detect();

    expect($version)->toBeString();
    expect($version)->toMatch('/[a-f0-9]{7,8}/');
})->skip(!is_dir('.git'), 'Not a git repository');
```

**File:** `tests/Unit/VersionDetectors/ChainVersionDetectorTest.php`

```php
<?php

use Montopolis\LaravelVersionNotifier\Support\VersionDetectors\ChainVersionDetector;
use Montopolis\LaravelVersionNotifier\Support\VersionDetectors\ConfigVersionDetector;
use Montopolis\LaravelVersionNotifier\Support\VersionDetectors\FileVersionDetector;

it('tries detectors in order', function () {
    $detectors = [
        new FileVersionDetector(),
        new ConfigVersionDetector(),
    ];

    $chain = new ChainVersionDetector($detectors);

    $version = $chain->detect();

    expect($version)->toBeString();
});
```

#### VersionManager Tests

**File:** `tests/Unit/VersionManagerTest.php`

```php
<?php

use Montopolis\LaravelVersionNotifier\Support\VersionManager;

it('returns version string', function () {
    $manager = app('version-notifier');

    expect($manager)->toBeInstanceOf(VersionManager::class);
    expect($manager->get())->toBeString();
});

it('broadcasts version update', function () {
    Event::fake();

    app('version-notifier')->broadcast('test-version');

    Event::assertDispatched(\Montopolis\LaravelVersionNotifier\Events\AppVersionUpdated::class);
});
```

### 5.2 Feature Tests

**Target:** `tests/Feature/`

#### Broadcasting Tests

**File:** `tests/Feature/BroadcastingTest.php`

```php
<?php

use Montopolis\LaravelVersionNotifier\Events\AppVersionUpdated;

it('broadcasts version update event', function () {
    Event::fake();

    $this->artisan('version:broadcast');

    Event::assertDispatched(AppVersionUpdated::class);
});

it('broadcasts test version with --test flag', function () {
    Event::fake();

    $this->artisan('version:broadcast --test');

    Event::assertDispatched(AppVersionUpdated::class, function ($event) {
        return str_starts_with($event->version, 'test-');
    });
});
```

#### HTTP Endpoint Tests

**File:** `tests/Feature/VersionEndpointTest.php`

```php
<?php

it('returns version via API endpoint', function () {
    $response = $this->get('/api/version');

    $response->assertStatus(200);
    $response->assertJsonStructure(['version']);
});

it('throttles version endpoint', function () {
    for ($i = 0; $i < 61; $i++) {
        $response = $this->get('/api/version');
    }

    $response->assertStatus(429);
});
```

#### User Tracking Tests

**File:** `tests/Feature/UserTrackingTest.php`

```php
<?php

use App\Models\User;

it('tracks user version', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post('/api/version/track', ['version' => '1.0.0-abc123de']);

    expect($user->fresh()->last_seen_version)->toBe('1.0.0-abc123de');
});
```

### 5.3 Integration Tests

**File:** `tests/Feature/FullFlowTest.php`

```php
<?php

it('completes full version notification flow', function () {
    // 1. Check initial version
    $initialResponse = $this->get('/api/version');
    $initialVersion = $initialResponse->json('version');

    // 2. Broadcast update
    Event::fake();
    $this->artisan('version:broadcast --test');
    Event::assertDispatched(AppVersionUpdated::class);

    // 3. Verify new version available
    $this->assertTrue(true); // Browser interaction tested manually
});
```

### 5.4 Documentation

**Files to Create:**

1. **README.md** (Enhanced)
   - Installation
   - Quick start
   - Configuration options
   - Usage examples
   - Troubleshooting

2. **docs/installation.md**
   - Step-by-step installation
   - Laravel version compatibility
   - Deployment setup

3. **docs/configuration.md**
   - All config options explained
   - Environment variables
   - Examples for common scenarios

4. **docs/version-detection.md**
   - Detector types explained
   - Custom detector creation
   - Best practices

5. **docs/broadcasting.md**
   - Reverb setup
   - Pusher setup
   - Testing WebSocket connections

6. **docs/frontend-integration.md**
   - Vite integration
   - Webpack integration
   - Vanilla JS usage
   - Custom UI examples

7. **docs/error-suppression.md**
   - Sentry integration
   - Bugsnag integration
   - Custom suppression logic

8. **docs/deployment.md**
   - Laravel Forge
   - Laravel Envoyer
   - GitHub Actions
   - Manual deployment

9. **docs/api-reference.md**
   - PHP API documentation
   - JavaScript API documentation
   - Configuration reference

10. **CHANGELOG.md**
    - Version history
    - Breaking changes
    - Migration guides

### 5.5 Demo Application

**Objective:** Reference implementation showing all features.

**Repository:** `montopolis/laravel-version-notifier-demo`

**Includes:**
- Fresh Laravel 11 installation
- Package installed and configured
- All features demonstrated:
  - WebSocket broadcasting
  - HTTP polling fallback
  - Chunk error detection
  - Custom UI examples
  - User tracking
  - Error suppression
- Deployment scripts
- Docker setup for local testing

### Phase 5 Acceptance Criteria

- [ ] Unit test coverage >80%
- [ ] All feature tests passing
- [ ] Integration tests cover full flow
- [ ] README comprehensive and clear
- [ ] All docs pages created
- [ ] API reference complete
- [ ] Demo app functional and documented
- [ ] CHANGELOG.md started

---

## Phase 6: Open Source Preparation (Future)

### Overview

**Objective:** Prepare package for potential public release on Packagist.

**Note:** Only proceed with this phase if/when decision is made to open source.

### 6.1 Community Standards

**Files to Create:**

1. **LICENSE**

```
MIT License

Copyright (c) 2025 Montopolis

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

[... full MIT license text ...]
```

2. **CONTRIBUTING.md**

```markdown
# Contributing to Laravel Version Notifier

Thank you for considering contributing!

## Code of Conduct

Please read and follow our Code of Conduct.

## Development Setup

1. Clone the repository
2. Install dependencies: `composer install && npm install`
3. Run tests: `vendor/bin/pest`

## Pull Request Process

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Ensure all tests pass
6. Submit pull request

## Coding Standards

- PSR-12 for PHP
- ESLint/Prettier for JavaScript
- Run `composer format` before committing
```

3. **CODE_OF_CONDUCT.md**

Use standard Contributor Covenant.

4. **SECURITY.md**

```markdown
# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability, please email security@montopolis.com.

Do not open a public issue.

We will respond within 48 hours.
```

### 6.2 CI/CD Pipeline

**File:** `.github/workflows/tests.yml`

```yaml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        php: [8.2, 8.3]
        laravel: [11.*, 12.*]

    steps:
      - uses: actions/checkout@v3

      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: ${{ matrix.php }}
          extensions: dom, curl, libxml, mbstring, zip

      - name: Install dependencies
        run: |
          composer require "laravel/framework:${{ matrix.laravel }}" --no-interaction --no-update
          composer install --prefer-dist --no-interaction

      - name: Run tests
        run: vendor/bin/pest

  static-analysis:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: 8.2

      - name: Install dependencies
        run: composer install

      - name: Run PHPStan
        run: vendor/bin/phpstan analyse

  code-style:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: 8.2

      - name: Install dependencies
        run: composer install

      - name: Check code style
        run: vendor/bin/pint --test
```

### 6.3 Static Analysis

**Add PHPStan:**

```bash
composer require --dev phpstan/phpstan
```

**File:** `phpstan.neon`

```neon
parameters:
    level: 5
    paths:
        - src
    excludePaths:
        - tests
```

**Add Laravel Pint:**

```bash
composer require --dev laravel/pint
```

**File:** `pint.json`

```json
{
    "preset": "laravel"
}
```

### 6.4 Packagist Submission

1. **Ensure package is public on GitHub**
2. **Submit to Packagist:** https://packagist.org/packages/submit
3. **Configure auto-update webhook**
4. **Add badge to README:**

```markdown
[![Latest Version](https://img.shields.io/packagist/v/montopolis/laravel-version-notifier.svg)](https://packagist.org/packages/montopolis/laravel-version-notifier)
[![Tests](https://github.com/montopolis/laravel-version-notifier/actions/workflows/tests.yml/badge.svg)](https://github.com/montopolis/laravel-version-notifier/actions)
```

### 6.5 Marketing & Promotion

1. **Laravel News Submission**
   - Write announcement article
   - Submit to Laravel News: https://laravel-news.com/submit-a-package

2. **Social Media**
   - Twitter/X thread demonstrating features
   - LinkedIn post for professional network
   - Dev.to article with technical details

3. **Community Engagement**
   - Reddit /r/laravel post
   - Laravel Discord announcement
   - Laracasts forum post

4. **Blog Post**
   - Technical deep-dive on Montopolis blog
   - Explain problem solved
   - Show before/after
   - Include code examples

5. **Video Tutorial**
   - YouTube walkthrough
   - Installation and setup
   - All features demonstrated
   - Real-world use case

### Phase 6 Acceptance Criteria

- [ ] MIT License added
- [ ] CONTRIBUTING.md complete
- [ ] CODE_OF_CONDUCT.md added
- [ ] SECURITY.md added
- [ ] GitHub Actions CI/CD functional
- [ ] PHPStan passing at level 5
- [ ] Pint code style passing
- [ ] Packagist submission approved
- [ ] Laravel News article published
- [ ] Social media announcements posted

---

## Notes

### Implementation Philosophy

- **Private package first**: No open source overhead
- **Minimal docs**: README with installation only
- **Focus on extraction**: Get working package first, optimize later
- **Optional features**: User tracking and error suppression are opt-in
- **Zero-config default**: Polling + default UI work out of box

### Post-Implementation Checklist

After package is functional:

1. **Test in real Laravel app** (aliada-ui or aliada-support)
   - Install package
   - Configure broadcasting
   - Test all detection methods
   - Verify production deployment workflow

2. **Verify all detection methods work**
   - WebSocket immediate notification
   - HTTP polling fallback
   - Chunk error detection
   - Version detection chain (file → git → config)

3. **Document gotchas or edge cases**
   - Broadcasting configuration requirements
   - Vite vs Webpack compatibility
   - Private browsing localStorage fallback
   - Timezone handling in timestamps

4. **Consider basic unit tests for VersionDetectors**
   - FileVersionDetector reads correctly
   - GitVersionDetector executes commands
   - ChainVersionDetector tries in order
   - VersionManager facade works

5. **Create demo app or video tutorial for team**
   - Show installation process
   - Demonstrate all features
   - Explain deployment integration
   - Share best practices

---

## Timeline Estimate

**Phase 1 (Core Package):** 2-3 days
- Package structure: 2-4 hours
- Version detectors: 4-6 hours
- Broadcasting/HTTP/Command: 2-3 hours
- Service provider & config: 2-3 hours

**Phase 2 (Frontend):** 1-2 days
- JavaScript extraction: 3-4 hours
- Build system setup: 2-3 hours
- UI component: 2-3 hours
- Testing & refinement: 2-3 hours

**Total for Phases 1-2:** 3-5 days

**Additional phases (if needed):**
- Phase 3 (Error Suppression): 1 day
- Phase 4 (User Tracking): 0.5 day
- Phase 5 (Testing & Docs): 2-3 days
- Phase 6 (Open Source Prep): 1-2 days

**Complete Package with Documentation:** 8-12 days

---

## Appendix

### Configuration Reference

See `config/version-notifier.php` for complete configuration options.

### API Reference

#### PHP API

```php
// Get version
app_version();
app_version(false); // without timestamp

// Facade
VersionNotifier::get();
VersionNotifier::broadcast();
VersionNotifier::detect();

// Service container
app('version-notifier')->get();
```

#### JavaScript API

```javascript
// Initialize
window.VersionNotifier.init();

// Check status
window.VersionNotifier.hasUpdate();
window.VersionNotifier.getInitialVersion();
window.VersionNotifier.getNewVersion();

// Actions
window.VersionNotifier.refresh();
window.VersionNotifier.dismiss();
```

### Troubleshooting

**Issue: Banner doesn't appear**
- Check browser console for errors
- Verify `window.context.version` is set
- Test with `php artisan version:broadcast --test`
- Check Alpine.js is loaded

**Issue: WebSocket not working**
- Verify broadcasting driver configured
- Check Reverb/Pusher running
- Confirm Echo connected: `window.Echo`
- Check channel name matches config

**Issue: Polling not working**
- Check endpoint returns JSON: `/api/version`
- Verify throttle middleware not blocking
- Check network tab for 429 errors
- Test endpoint manually: `curl http://app.test/api/version`

**Issue: Version detection fails**
- Check `public/version.html` exists (production)
- Verify Git available (development)
- Confirm `config/app.php` has version
- Test detector chain: `app('version-notifier')->detect()`

### Contact & Support

For questions or issues:
- Internal: Montopolis development team
- Repository: (private, link TBD)

---

**Document Version:** 1.0
**Last Updated:** 2025-01-21
**Epic ID:** e-f44bf8
