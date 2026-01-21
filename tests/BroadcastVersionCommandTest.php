<?php

use Illuminate\Support\Facades\Event;
use Montopolis\LaravelVersionNotifier\Events\AppVersionUpdated;

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
