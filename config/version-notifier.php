<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Broadcasting Configuration
    |--------------------------------------------------------------------------
    |
    | Configure WebSocket broadcasting for real-time version updates.
    |
    */
    'broadcasting' => [
        'enabled' => true,
        'channel' => 'app',
    ],

    /*
    |--------------------------------------------------------------------------
    | HTTP Endpoint Configuration
    |--------------------------------------------------------------------------
    |
    | Configure the HTTP endpoint for version polling.
    |
    */
    'endpoint' => [
        'enabled' => true,
        'path' => 'api/version',
        'middleware' => ['throttle:60,1'],
    ],

    /*
    |--------------------------------------------------------------------------
    | Frontend Configuration
    |--------------------------------------------------------------------------
    |
    | Configure the JavaScript frontend behavior.
    |
    */
    'frontend' => [
        'polling' => [
            'enabled' => true,
            'interval' => 300000, // 5 minutes in milliseconds
        ],
        'chunk_errors' => [
            'enabled' => true,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | UI Configuration
    |--------------------------------------------------------------------------
    |
    | Configure the default notification banner UI.
    |
    */
    'ui' => [
        'enabled' => true,
        'message' => 'A new version is available. Please refresh to get the latest updates.',
    ],

    /*
    |--------------------------------------------------------------------------
    | Error Suppression
    |--------------------------------------------------------------------------
    |
    | Optionally suppress errors during version mismatches.
    |
    */
    'error_suppression' => [
        'sentry' => false,
    ],
];
