import { extendTheme, ThemeConfig, StyleFunctionProps } from '@chakra-ui/react';

const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: false
};

export const theme = extendTheme({
  config,
  fonts: {
    heading: `'Inter', sans-serif`,
    body: `'Inter', sans-serif`
  },
  styles: {
    global: (props: StyleFunctionProps) => ({
      body: {
        bg: props.colorMode === 'dark' ? '#050505' : 'gray.50',
        color: props.colorMode === 'dark' ? 'gray.100' : 'gray.800',
        transition: 'background-color 0.2s ease, color 0.2s ease'
      },
      '*::selection': {
        background: props.colorMode === 'dark' ? 'whiteAlpha.400' : 'brand.100'
      }
    })
  },
  semanticTokens: {
    colors: {
      'surface.base': { default: 'white', _dark: '#111111' },
      'surface.elevated': { default: 'white', _dark: '#181818' },
      'surface.muted': { default: 'gray.50', _dark: '#050505' },
      'border.subtle': { default: 'gray.100', _dark: 'whiteAlpha.200' },
      'text.primary': { default: 'gray.800', _dark: 'gray.100' },
      'text.muted': { default: 'gray.600', _dark: 'gray.400' }
    }
  },
  colors: {
    brand: {
      50: '#e3f2ff',
      100: '#b9d8ff',
      200: '#8ebeff',
      300: '#63a3ff',
      400: '#3889ff',
      500: '#1f6fe6',
      600: '#1556b4',
      700: '#0c3d82',
      800: '#022351',
      900: '#000a21'
    }
  },
  components: {
    Button: {
      defaultProps: {
        colorScheme: 'brand'
      }
    },
    Modal: {
      baseStyle: {
        dialog: {
          bg: 'surface.elevated'
        }
      }
    },
    Drawer: {
      baseStyle: {
        dialog: {
          bg: 'surface.elevated'
        }
      }
    }
  }
});
