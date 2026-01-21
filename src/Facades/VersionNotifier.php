<?php

namespace Montopolis\LaravelVersionNotifier\Facades;

use Illuminate\Support\Facades\Facade;

/**
 * @method static string get(bool $includeTimestamp = true)
 * @method static string detect(bool $includeTimestamp = true)
 * @method static void broadcast(string|null $version = null)
 *
 * @see \Montopolis\LaravelVersionNotifier\Support\VersionManager
 */
class VersionNotifier extends Facade
{
    protected static function getFacadeAccessor(): string
    {
        return 'version-notifier';
    }
}
