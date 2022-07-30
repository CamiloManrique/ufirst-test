<?php

require __DIR__.'/vendor/autoload.php';

use App\Services\DataLoader;

// Load the data
$srcPath = __DIR__.'/epa-http.txt';
$distPath = __DIR__.'/storage/data.json';

$dataLoader = new DataLoader($srcPath, $distPath);
$dataLoader->loadFile();

# Start the router
$router = require_once __DIR__.'/app/router/router.php';
$router->run();
