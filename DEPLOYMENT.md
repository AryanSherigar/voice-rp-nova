# Deployment

## Dependency management

This project now uses a single dependency source: `package.json` / `package-lock.json` managed by npm.

- React and ReactDOM are bundled by Vite from npm dependencies.
- Tailwind CSS is compiled locally through PostCSS during build.
- No runtime CDN is used for React, ReactDOM, or Tailwind.

> Note: the app still loads external font stylesheets in `index.html` and `index.css`.

## Build steps

1. Install dependencies:

   ```bash
   npm ci
   ```

2. Create production build:

   ```bash
   npm run build
   ```

3. (Optional) Validate production output locally:

   ```bash
   npm run preview
   ```

The generated static assets are emitted to `dist/` by Vite and can be deployed to any static host.
