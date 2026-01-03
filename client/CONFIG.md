# TechSync Mobile App Configuration

This file explains how to configure the mobile app for different environments.

## API Configuration

The API base URL is configured in `src/config.js`.

### Local Development (Default)

```javascript
export const API_BASE_URL = 'http://localhost:8000';
```

### Running on Physical Device

When running on a physical device, you need to use your computer's IP address instead of localhost:

1. Find your computer's local IP address:
   - **macOS/Linux**: Run `ifconfig | grep "inet "` or `ip addr show`
   - **Windows**: Run `ipconfig` and look for IPv4 Address

2. Update `src/config.js`:
```javascript
export const API_BASE_URL = 'http://192.168.1.100:8000'; // Replace with your IP
```

### Production

For production deployment, update to your production API URL:

```javascript
export const API_BASE_URL = 'https://api.yourdomain.com';
```

## Important Notes

- Make sure your backend server is accessible from the device
- For Android emulator, use `http://10.0.2.2:8000` to access localhost
- For iOS simulator, `http://localhost:8000` works fine
- Ensure firewall allows connections on port 8000
