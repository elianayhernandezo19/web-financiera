# WebVisualizadorAlgoritmos

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.2.3.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

## Despliegue en Render (sugerido)

Para desplegar la interfaz en Render como un sitio estático:

1. Añade `render.yaml` (ya incluido en el repo) o crea un Web Service static en Render.
2. En Render, configura:
	- Build Command: `npm install && npm run build`
	- Publish Path / Static Path: `dist/web-visualizador-algoritmos/browser`
	- Environment Variables (opcional): `API_URL` para apuntar al backend desplegado.
3. Despliega y valida la URL pública que Render proporciona.

Si prefieres servir la aplicación con un servidor (por ejemplo nginx), crea una build con `npm run build` y sube los archivos estáticos a tu servidor o CDN.

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
