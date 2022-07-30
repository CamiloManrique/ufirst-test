<?php

use Bramus\Router\Router;

$router = new Router();

$router->get('/', function () {
    echo "Home";
});

$router->get('/data', function () {

    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Headers: *");

    header('Cache-Control: max-age=31536000');
    header('Content-Type: application/json');

   $json = file_get_contents(__DIR__.'/../../storage/data.json');
    echo $json;
});

return $router;
