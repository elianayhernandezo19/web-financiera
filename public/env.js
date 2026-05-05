// Runtime environment configuration.
//
// PRODUCCION (Docker): docker-entrypoint.sh ejecuta envsubst y reemplaza el
// literal `$API_URL` con el valor real de la env var API_URL.
//
// DESARROLLO (`ng serve`): no hay envsubst, asi que dejamos un valor por
// defecto apuntando al backend local en el puerto 3000.
//
// La logica en api.service.ts detecta si el placeholder no se sustituyo
// (empieza por '$') y aplica el fallback automaticamente.
(function (w) {
  w.__env = w.__env || {};
  w.__env['API_URL'] = 'http://api-financiera-ok.eba-jbfneuk2.us-east-1.elasticbeanstalk.com/api/v1';
}(window));
