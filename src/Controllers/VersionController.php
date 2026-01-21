<?php

namespace Montopolis\LaravelVersionNotifier\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;

class VersionController extends Controller
{
    public function __invoke(): JsonResponse
    {
        return response()->json([
            'version' => app('version-notifier')->get(false),
        ]);
    }
}
