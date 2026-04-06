(function (w) {
  // Runtime environment configuration for static hosts.
  // For Render static sites you can set an API_URL build env var so the value
  // is baked into the build; this file is kept as a runtime fallback when a
  // hosting platform supports injecting runtime variables into static assets.
  // When running locally, the Angular app falls back to the BASE_URL in the
  // client service implementation.
  w.__env = w.__env || {};
  w.__env['API_URL'] = '$API_URL';
}(window));
