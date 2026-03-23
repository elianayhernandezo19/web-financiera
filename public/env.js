// Runtime environment configuration.
// At container start-up, docker-entrypoint.sh runs envsubst which replaces the
// $API_URL literal below with the value of the API_URL environment variable.
// When running locally outside Docker, the fallback in api.service.ts is used.
(function (w) {
  w.__env = w.__env || {};
  w.__env['API_URL'] = '$API_URL';
}(window));
