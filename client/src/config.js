// API Configuration
//
// IMPORTANT: Update this URL based on your environment:
//
// 1. iOS Simulator: Use 'http://localhost:8000' (works as-is)
// 2. Android Emulator: Use 'http://10.0.2.2:8000' (Android's special IP for host)
// 3. Physical Device (same WiFi): Use your computer's local IP
//    - macOS/Linux: Run `ifconfig | grep "inet " | grep -v 127.0.0.1`
//    - Windows: Run `ipconfig` and find IPv4 Address
//    - Example: 'http://192.168.1.100:8000'
// 4. Production: Use your production API URL (e.g., 'https://api.techsync.com')
//
// You can also use environment variables or react-native-config for better configuration management

// Automatically detect platform and set appropriate URL
import { Platform } from 'react-native';

const getApiBaseUrl = () => {
  // For production, replace this entire function with your production URL
  if (__DEV__) {
    // Development mode
    if (Platform.OS === 'android') {
      // Android emulator uses special IP to access host machine
      return 'http://10.0.2.2:8000';
    } else {
      // iOS simulator can use localhost
      return 'http://localhost:8000';
    }
  } else {
    // Production mode - replace with your actual production API URL
    return 'https://api.techsync.com'; // TODO: Update this!
  }
};

export const API_BASE_URL = getApiBaseUrl();
