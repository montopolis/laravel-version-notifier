<?php

namespace Montopolis\LaravelVersionNotifier\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

class AppVersionUpdated implements ShouldBroadcastNow
{
    use Dispatchable;
    use InteractsWithSockets;

    public function __construct(public ?string $version = null) {}

    /**
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
        $channel = config('version-notifier.broadcasting.channel', 'app');

        return [new Channel($channel)];
    }

    /**
     * @return array<string, string>
     */
    public function broadcastWith(): array
    {
        return [
            'version' => $this->version ?? app('version-notifier')->get(false),
        ];
    }

    /**
     * Get the broadcast event name.
     *
     * By default Laravel uses the full class name (e.g., .Montopolis.LaravelVersionNotifier.Events.AppVersionUpdated)
     * This provides a clean event name that matches what the frontend JavaScript expects.
     */
    public function broadcastAs(): string
    {
        return 'AppVersionUpdated';
    }
}
