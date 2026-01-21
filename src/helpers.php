<?php

if (! function_exists('app_version')) {
    /**
     * Get the current application version string.
     *
     * Format: `<app-version>-<hash> (<timestamp>)`
     * Example: `1.7.0-88f63ae (2025-01-21 17:17:48)`
     */
    function app_version(bool $includeTimestamp = true): string
    {
        return app('version-notifier')->get($includeTimestamp);
    }
}
