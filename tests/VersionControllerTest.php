<?php

it('returns version from HTTP endpoint', function () {
    $response = $this->get('/api/version');

    $response->assertStatus(200);
    $response->assertJsonStructure(['version']);

    $version = $response->json('version');
    expect($version)->toBeString();
    expect($version)->toStartWith('1.0.0-');
});
