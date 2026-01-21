<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\View;
use Montopolis\LaravelVersionNotifier\Middleware\InjectVersionContext;

it('shares current version with views for HTML requests', function () {
    $middleware = new InjectVersionContext;
    $request = Request::create('/test', 'GET');

    $middleware->handle($request, fn () => response('OK'));

    expect(View::shared('currentVersion'))->toContain('1.0.0');
});

it('does not share version for JSON requests', function () {
    View::share('currentVersion', null);

    $middleware = new InjectVersionContext;
    $request = Request::create('/test', 'GET');
    $request->headers->set('Accept', 'application/json');

    $middleware->handle($request, fn () => response('OK'));

    expect(View::shared('currentVersion'))->toBeNull();
});

it('registers version-context middleware alias', function () {
    $router = app('router');

    expect($router->getMiddleware())->toHaveKey('version-context');
});

it('works when applied to routes via alias', function () {
    Route::middleware('version-context')->get('/test-version', function () {
        return response()->json(['shared_version' => View::shared('currentVersion')]);
    });

    $response = $this->get('/test-version');

    $response->assertStatus(200);
    expect($response->json('shared_version'))->toContain('1.0.0');
});
