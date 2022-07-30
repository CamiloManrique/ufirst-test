<?php

use Bramus\Router\Router;

$router = new Router();

// Set CORS basic headers
$router->before('GET', '/.*', function() {
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Headers: *");
});

$router->get('/', function () {
    echo "Server running!";
});

$router->get('/data', function () {
    header('Cache-Control: max-age=31536000');
    header('Content-Type: application/json');

   $json = file_get_contents(__DIR__.'/../../storage/data.json');
    echo $json;
});

return $router;
