// Dockerfile removed — this project deploys static assets to Render or a CDN.
// Docker artifacts were deprecated and neutralized.
FROM scratch

WORKDIR /app

# Copy manifests first so Docker caches the install layer separately.
# Re-runs npm ci only when package.json / package-lock.json change.
COPY package.json package-lock.json ./

# --ignore-scripts  → prevents arbitrary lifecycle hooks (security)
# --no-audit        → skips network call to npm registry in CI
# --no-fund         → suppresses funding messages
RUN npm ci --ignore-scripts --no-audit --no-fund

# Copy the rest of the source after node_modules to preserve cache layer
COPY . .

# Production build: full tree-shaking, minification, output filename hashing
RUN npm run build -- --configuration=production

# =============================================================================
# Stage 2 — Serve
# Only the compiled static files are copied; the 700 MB node_modules are left
# behind in the builder stage, keeping the final image tiny (~25 MB).
# =============================================================================
FROM nginx:1.27-alpine AS runner

# gettext provides envsubst — used in the entrypoint to replace $API_URL at
# container start-up. apk cache is purged immediately to save space.
RUN apk add --no-cache gettext \
 && rm -rf /var/cache/apk/*

# Remove the default nginx site so only our config is active
RUN rm /etc/nginx/conf.d/default.conf

# Supply our hardened, non-root nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Angular output (hashed filenames, brotli/gzip-ready)
COPY --from=builder /app/dist/web-visualizador-algoritmos/browser /usr/share/nginx/html

# Entrypoint script that injects API_URL into env.js before nginx starts
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Fix ownership so the non-root nginx user can read/write what it needs.
# The pid file, temp paths and log targets are handled in nginx.conf via /tmp.
RUN chown -R nginx:nginx /usr/share/nginx/html \
 && chown -R nginx:nginx /var/cache/nginx \
 && chown -R nginx:nginx /var/log/nginx

# ── Security: drop root permanently ──────────────────────────────────────────
# Built-in "nginx" user (uid 101) — no shell, no home directory.
USER nginx

# Ports < 1024 require root. 8080 is safe for non-root processes.
EXPOSE 8080

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
