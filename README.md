# Laravel Version Notifier

A version notification system for Laravel applications that detects new deployments and prompts users to refresh their browser.

## Installation

```bash
composer require montopolis/laravel-version-notifier
```

## Configuration

Publish the configuration file:

```bash
php artisan vendor:publish --tag=version-notifier-config
```

## Usage

### Get Current Version

```php
use Montopolis\LaravelVersionNotifier\Facades\VersionNotifier;

// With timestamp
$version = VersionNotifier::get(); // "1.0.0-abc123 (2025-01-21 14:30:00)"

// Without timestamp
$version = VersionNotifier::get(false); // "1.0.0-abc123"

// Using helper function
$version = app_version();
```

### Broadcast Version Update

After a deployment, broadcast the new version to connected clients:

```bash
php artisan version:broadcast
```

For testing:

```bash
php artisan version:broadcast --test
```

### HTTP Endpoint

A version check endpoint is available at `/api/version` (configurable):

```bash
curl http://your-app.test/api/version
# {"version":"1.0.0-abc123"}
```

## License

Proprietary - Internal use only.
