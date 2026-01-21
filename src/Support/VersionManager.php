<?php

namespace Montopolis\LaravelVersionNotifier\Support;

use Carbon\Carbon;
use Illuminate\Contracts\Config\Repository;
use Illuminate\Contracts\Foundation\Application;
use Illuminate\Support\Arr;
use Montopolis\LaravelVersionNotifier\Events\AppVersionUpdated;

class VersionManager
{
    public function __construct(
        protected Application $app,
        protected Repository $config,
    ) {}

    public function get(bool $includeTimestamp = true): string
    {
        return $this->detect($includeTimestamp);
    }

    public function detect(bool $includeTimestamp = true): string
    {
        $appVersion = $this->config->get('app.version', '1.0.0');

        // Try file-based version detection first (production)
        $fileWithCommitHash = $this->app->basePath('/public/version.html');

        if (file_exists($fileWithCommitHash)) {
            $values = explode("\n", file_get_contents($fileWithCommitHash));
            $commit = Arr::get($values, '0', 'unknown');
            if ($commitTime = Arr::get($values, '1')) {
                $commitTime = new Carbon($commitTime);
            } else {
                $commitTime = null;
            }
        } else {
            // Fall back to Git commands (development)
            $commit = trim((string) @exec('git log --pretty="%h" -n1 HEAD'));
            if ($commit) {
                $commitTimeStr = trim((string) @exec('git log -n1 --pretty=%ci HEAD'));
                if ($commitTimeStr) {
                    $commitTime = new Carbon($commitTimeStr);
                    $commitTime->setTimezone('UTC');
                } else {
                    $commitTime = null;
                }
            } else {
                $commitTime = null;
            }
        }

        $commit = ! empty($commit) ? $commit : 'unknown';
        $commitTimeFormatted = $commitTime instanceof Carbon ? $commitTime->format('Y-m-d H:i:s') : 'unknown';

        return "{$appVersion}-{$commit}".($includeTimestamp ? " ({$commitTimeFormatted})" : '');
    }

    public function broadcast(?string $version = null): void
    {
        broadcast(new AppVersionUpdated($version ?? $this->get(false)));
    }
}
