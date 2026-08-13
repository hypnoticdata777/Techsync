import {Platform} from 'react-native';

export const colors = {
  canvas: '#f1eadf',
  surface: '#fbf4e8',
  surfaceMuted: '#eee3d2',
  border: '#d2c2aa',
  borderStrong: '#bfae94',
  ink: '#182532',
  inkMuted: '#655d52',
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
