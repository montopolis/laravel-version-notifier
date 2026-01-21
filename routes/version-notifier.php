<?php

use Illuminate\Support\Facades\Route;
use Montopolis\LaravelVersionNotifier\Controllers\VersionController;

Route::get(config('version-notifier.endpoint.path', 'api/version'), VersionController::class)
    ->middleware(config('version-notifier.endpoint.middleware', ['throttle:60,1']))
    ->name('version-notifier.check');
