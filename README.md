# UFirst Assignment 

This repository contains the source code for the UFirst test assignment. The project contains both the backend and the frontend

## Backend:

For processing the data, I wrote a PHP web application. The backend folder contains a Dockerfile as well, which deploys the app using an Apache container. It also
includes a `docker-compose.yml` file which builds the container and exposes the web server on `localhost:8000` and mounts a volume
within the `src` folder.

## Frontend:

For displaying the analysis I just used an HTML file and some CSS and JS files (no webserver). However, the JS source code uses ESM modules, and includes a webpack build configuration. The
`package.json` contains 2 scripts, one for development, which makes API requests to `localhost:8000`, and the other builds and minifies the JS assets
and uses a Google Cloud URL for the API requests.
