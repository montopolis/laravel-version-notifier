<?php

use Montopolis\LaravelVersionNotifier\Facades\VersionNotifier;

it('can get the current version', function () {
    $version = VersionNotifier::get(false);

    expect($version)->toBeString();
    expect($version)->toStartWith('1.0.0-');
});

it('can get version via helper function', function () {
    $version = app_version(false);

    expect($version)->toBeString();
    expect($version)->toStartWith('1.0.0-');
});

it('can get version with timestamp', function () {
    $version = VersionNotifier::get(true);

    expect($version)->toBeString();
    expect($version)->toContain('(');
    expect($version)->toContain(')');
});

it('resolves version-notifier from container', function () {
    $manager = app('version-notifier');

    expect($manager)->toBeInstanceOf(\Montopolis\LaravelVersionNotifier\Support\VersionManager::class);
});
