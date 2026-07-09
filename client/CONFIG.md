# TechSync Mobile App Configuration

This file explains how to configure the mobile app for different environments.

## API Configuration

The API base URL is resolved in `src/config.js`.

### Local Development

By default, local development uses emulator-friendly URLs:

- Android emulator: `http://10.0.2.2:8000`
- iOS simulator / Expo web: `http://localhost:8000`

### Physical Device or Hosted API

Set `EXPO_PUBLIC_API_BASE_URL` when the default local URL is not correct:

```bash
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.100:8000 npm start
```

For production builds, this variable is required:

```bash
EXPO_PUBLIC_API_BASE_URL=https://api.yourdomain.com npx expo export
```

Expo exposes variables with the `EXPO_PUBLIC_` prefix to the bundled app at
build time. Do not put secrets in `EXPO_PUBLIC_*` values.

## Important Notes

- Make sure your backend server is reachable from the device.
- For Android emulator, use `http://10.0.2.2:8000` to access localhost.
- For iOS simulator, `http://localhost:8000` works fine.
- Production builds fail fast if `EXPO_PUBLIC_API_BASE_URL` is not set.