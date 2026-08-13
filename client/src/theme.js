import {Platform} from 'react-native';

export const colors = {
  canvas: '#f7f3ea',
  surface: '#fffaf0',
  surfaceMuted: '#f3eadb',
  border: '#d8ccb9',
  borderStrong: '#c7b89f',
  ink: '#1f2933',
  inkMuted: '#746a5d',
  primary: '#2f6f9f',
  primarySoft: '#dbe9f3',
  success: '#5f8f62',
  warning: '#b98524',
  danger: '#b24a3a',
  accent: '#6f5f95',
};

export const typography = {
  body: Platform.select({
    web: '"Roboto Serif", Georgia, "Times New Roman", serif',
    default: 'serif',
  }),
  heading: Platform.select({
    web: '"Roboto Serif", Georgia, "Times New Roman", serif',
    default: 'serif',
  }),
};
