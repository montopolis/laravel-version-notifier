<?php

namespace Montopolis\LaravelVersionNotifier\Commands;

use Illuminate\Console\Command;
use Montopolis\LaravelVersionNotifier\Events\AppVersionUpdated;

class BroadcastVersionCommand extends Command
{
    protected $signature = 'version:broadcast {--test : Send a fake version for testing}';

    protected $description = 'Broadcast a version update notification to all connected clients';

    public function handle(): int
    {
        $version = $this->option('test') ? 'test-'.time() : null;

        broadcast(new AppVersionUpdated($version));

        $displayVersion = $version ?? app('version-notifier')->get(false);
        $this->info("Version broadcast sent: {$displayVersion}");

        return self::SUCCESS;
    }
}
