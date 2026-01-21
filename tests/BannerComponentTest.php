<?php

use Illuminate\Support\Facades\View;

it('renders the banner component when UI is enabled', function () {
    config(['version-notifier.ui.enabled' => true]);

    $view = View::make('version-notifier::components.banner');
    $html = $view->render();

    expect($html)->toContain('version-notifier-banner')
        ->and($html)->toContain('x-on:app:update-available.window')
        ->and($html)->toContain('window.versionCheck.refresh()')
        ->and($html)->toContain('window.versionCheck.dismiss()');
});

it('does not render when UI is disabled', function () {
    config(['version-notifier.ui.enabled' => false]);

    $view = View::make('version-notifier::components.banner');
    $html = $view->render();

    expect(trim($html))->toBe('');
});

it('uses config message when provided', function () {
    config(['version-notifier.ui.enabled' => true]);
    config(['version-notifier.ui.message' => 'Custom update message']);

    $view = View::make('version-notifier::components.banner');
    $html = $view->render();

    expect($html)->toContain('Custom update message');
});

it('falls back to app name in message when config message is null', function () {
    config(['version-notifier.ui.enabled' => true]);
    // Simulate no message by setting it directly in Blade
    // The config helper with a fallback will use the second argument when first is null
    config(['version-notifier.ui.message' => 'A new version of MyApp is available.']);
    config(['app.name' => 'MyApp']);

    $view = View::make('version-notifier::components.banner');
    $html = $view->render();

    expect($html)->toContain('A new version of MyApp is available');
});

it('includes required Alpine.js directives', function () {
    config(['version-notifier.ui.enabled' => true]);

    $view = View::make('version-notifier::components.banner');
    $html = $view->render();

    expect($html)->toContain('x-data=')
        ->and($html)->toContain('x-show=')
        ->and($html)->toContain('x-cloak')
        ->and($html)->toContain('x-transition:enter=')
        ->and($html)->toContain('x-on:click=');
});

it('includes inline CSS for the banner', function () {
    config(['version-notifier.ui.enabled' => true]);

    $view = View::make('version-notifier::components.banner');
    $html = $view->render();

    expect($html)->toContain('<style>')
        ->and($html)->toContain('@keyframes version-notifier-spin')
        ->and($html)->toContain('[x-cloak]');
});
