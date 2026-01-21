<?php

use Illuminate\Broadcasting\Channel;
use Illuminate\Support\Facades\Event;
use Montopolis\LaravelVersionNotifier\Events\AppVersionUpdated;

it('event uses correct broadcast name for WebSocket compatibility', function () {
    $event = new AppVersionUpdated('test-version');

    expect($event->broadcastAs())->toBe('AppVersionUpdated');
});

it('event broadcasts on configured channel', function () {
    $event = new AppVersionUpdated('test-version');
    $channels = $event->broadcastOn();

    expect($channels)->toHaveCount(1);
    expect($channels[0])->toBeInstanceOf(Channel::class);
    expect($channels[0]->name)->toBe('app');
});

it('event respects custom channel configuration', function () {
    config(['version-notifier.broadcasting.channel' => 'custom-updates']);

    $event = new AppVersionUpdated('test-version');
    $channels = $event->broadcastOn();

    expect($channels[0]->name)->toBe('custom-updates');
});

it('event broadcasts with version data', function () {
    $event = new AppVersionUpdated('1.2.3-abc123');
    $data = $event->broadcastWith();

    expect($data)->toHaveKey('version');
    expect($data['version'])->toBe('1.2.3-abc123');
});

it('can run the version:broadcast command', function () {
    Event::fake();

    $this->artisan('version:broadcast')
        ->expectsOutputToContain('Version broadcast sent:')
        ->assertExitCode(0);

    Event::assertDispatched(AppVersionUpdated::class);
});

it('can run the version:broadcast command with --test flag', function () {
    Event::fake();

    $this->artisan('version:broadcast', ['--test' => true])
        ->expectsOutputToContain('Version broadcast sent: test-')
        ->assertExitCode(0);

    Event::assertDispatched(AppVersionUpdated::class, function ($event) {
        return str_starts_with($event->version, 'test-');
    });
});
