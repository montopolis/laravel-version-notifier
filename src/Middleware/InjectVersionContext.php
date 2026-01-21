<?php

namespace Montopolis\LaravelVersionNotifier\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\View;
use Montopolis\LaravelVersionNotifier\Facades\VersionNotifier;
use Symfony\Component\HttpFoundation\Response;

class InjectVersionContext
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->expectsJson()) {
            View::share('currentVersion', VersionNotifier::get());
        }

        return $next($request);
    }
}
