<?php

namespace Montopolis\LaravelVersionNotifier\Tests;

use Montopolis\LaravelVersionNotifier\VersionNotifierServiceProvider;
use Orchestra\Testbench\TestCase as Orchestra;

class TestCase extends Orchestra
{
    protected function getPackageProviders($app): array
    {
        return [
            VersionNotifierServiceProvider::class,
        ];
    }

    protected function getEnvironmentSetUp($app): void
    {
        $app['config']->set('app.version', '1.0.0');
    }
}
