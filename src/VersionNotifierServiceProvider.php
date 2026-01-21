<?php

namespace Montopolis\LaravelVersionNotifier;

use Illuminate\Support\ServiceProvider;
use Montopolis\LaravelVersionNotifier\Commands\BroadcastVersionCommand;
use Montopolis\LaravelVersionNotifier\Support\VersionManager;

class VersionNotifierServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->mergeConfigFrom(__DIR__.'/../config/version-notifier.php', 'version-notifier');

        $this->app->singleton('version-notifier', function ($app) {
            return new VersionManager($app, $app['config']);
        });
    }

    public function boot(): void
    {
        if ($this->app->runningInConsole()) {
            $this->commands([
                BroadcastVersionCommand::class,
            ]);

            $this->publishes([
                __DIR__.'/../config/version-notifier.php' => config_path('version-notifier.php'),
            ], 'version-notifier-config');

            $this->publishes([
                __DIR__.'/../resources/views' => resource_path('views/vendor/version-notifier'),
            ], 'version-notifier-views');

            $this->publishes([
                __DIR__.'/../database/migrations/add_version_tracking_to_users_table.php.stub' => database_path('migrations/'.date('Y_m_d_His').'_add_version_tracking_to_users_table.php'),
            ], 'version-notifier-migrations');
        }

        $this->loadViewsFrom(__DIR__.'/../resources/views', 'version-notifier');

        if (config('version-notifier.endpoint.enabled', true)) {
            $this->loadRoutesFrom(__DIR__.'/../routes/version-notifier.php');
        }
    }
}
