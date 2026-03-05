Quick setup

1. Install dependencies:

```bash
npm install
```

2. Run locally:

```bash
npm start
# or for auto-reload during development:
npm run dev
```

3. (Optional) Obfuscate + minify front-end JS:

```bash
npm run build:obfuscate
```

Notes:
- This repo moves sensitive logic (count increment, name, speed) to server-side endpoints in `server.js` so client can't read core logic from the front-end code.
- Obfuscation step requires `javascript-obfuscator` and `terser` (installed via `npm install`).
- For production, replace in-memory store with a DB and enable proper auth/CORS.
