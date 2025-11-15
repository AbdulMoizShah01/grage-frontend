import { extendTheme, ThemeConfig, StyleFunctionProps } from '@chakra-ui/react';

const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: false,
  disableTransitionOnChange: false
};

export const theme = extendTheme({
  config,
  fonts: {
    heading: `'Inter', -apple-system, BlinkMacSystemFont, sans-serif`,
    body: `'Inter', -apple-system, BlinkMacSystemFont, sans-serif`,
    mono: `'JetBrains Mono', 'Fira Code', monospace`
  },
  styles: {
    global: (props: StyleFunctionProps) => ({
      body: {
        bg: props.colorMode === 'dark' ? '#050505' : 'gray.50',
        color: props.colorMode === 'dark' ? 'gray.100' : 'gray.800',
        transition: 'background-color 0.3s ease, color 0.3s ease',
        lineHeight: '1.6',
        fontFeatureSettings: "'cv11', 'ss01'",
        fontVariationSettings: "'opsz' 32"
      },
      '*::selection': {
        background: props.colorMode === 'dark' ? 'whiteAlpha.400' : 'brand.100'
      },
      '*::-webkit-scrollbar': {
        width: '8px',
      },
      '*::-webkit-scrollbar-track': {
        bg: props.colorMode === 'dark' ? 'whiteAlpha.50' : 'gray.100'
      },
      '*::-webkit-scrollbar-thumb': {
        bg: props.colorMode === 'dark' ? 'whiteAlpha.300' : 'gray.300',
        borderRadius: 'full',
        '&:hover': {
          bg: props.colorMode === 'dark' ? 'whiteAlpha.400' : 'gray.400'
        }
      },
      '.glass-effect': {
        backdropFilter: 'blur(12px) saturate(180%)',
        bg: props.colorMode === 'dark' ? 'whiteAlpha.50' : 'whiteAlpha.800',
        border: '1px solid',
        borderColor: props.colorMode === 'dark' ? 'whiteAlpha.200' : 'whiteAlpha.300'
      }
    })
  },
  semanticTokens: {
    colors: {
      // Surface colors
      'surface.base': { default: 'white', _dark: '#111111' },
      'surface.elevated': { default: 'white', _dark: '#181818' },
      'surface.muted': { default: 'gray.50', _dark: '#050505' },
      'surface.hovered': { default: 'gray.50', _dark: '#1a1a1a' },
      'surface.pressed': { default: 'gray.100', _dark: '#222222' },
      
      // Border colors
      'border.subtle': { default: 'gray.100', _dark: 'whiteAlpha.200' },
      'border.moderate': { default: 'gray.200', _dark: 'whiteAlpha.300' },
      'border.strong': { default: 'gray.300', _dark: 'whiteAlpha.400' },
      
      // Text colors
      'text.primary': { default: 'gray.900', _dark: 'gray.50' },
      'text.secondary': { default: 'gray.600', _dark: 'gray.400' },
      'text.tertiary': { default: 'gray.500', _dark: 'gray.500' },
      'text.muted': { default: 'gray.400', _dark: 'gray.600' },
      'text.inverse': { default: 'white', _dark: 'gray.900' },
      
      // Status colors
      'status.success': { default: 'green.500', _dark: 'green.400' },
      'status.error': { default: 'red.500', _dark: 'red.400' },
      'status.warning': { default: 'orange.500', _dark: 'orange.400' },
      'status.info': { default: 'blue.500', _dark: 'blue.400' },
      
      // Brand colors with semantic tokens
      'brand.primary': { default: 'brand.500', _dark: 'brand.400' },
      'brand.surface': { default: 'brand.50', _dark: 'brand.900' },
      'brand.muted': { default: 'brand.100', _dark: 'brand.800' }
    }
  },
  colors: {
    brand: {
      50: '#f0f7ff',
      100: '#e0effe',
      200: '#bae0fd',
      300: '#7cc6fc',
      400: '#38a8f8',
      500: '#1f6fe6', // Primary brand color
      600: '#1556b4',
      700: '#0c3d82',
      800: '#072959',
      900: '#021a3f'
    },
    gray: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a'
    }
  },
  shadows: {
    xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    base: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    md: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    lg: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    xl: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    'brand-sm': '0 1px 3px 0 rgb(31 111 230 / 0.2), 0 1px 2px -1px rgb(31 111 230 / 0.2)',
    'brand-md': '0 4px 6px -1px rgb(31 111 230 / 0.2), 0 2px 4px -2px rgb(31 111 230 / 0.2)'
  },
  radii: {
    sm: '4px',
    base: '6px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    '2xl': '20px',
    '3xl': '24px'
  },
  components: {
    Button: {
      defaultProps: {
        colorScheme: 'brand',
        size: 'md'
      },
      variants: {
        solid: (props: StyleFunctionProps) => ({
          bg: 'brand.primary',
          color: 'white',
          fontWeight: '600',
          borderRadius: 'lg',
          transition: 'all 0.2s ease-in-out',
          _hover: {
            bg: props.colorMode === 'dark' ? 'brand.300' : 'brand.600',
            transform: 'translateY(-1px)',
            shadow: 'md'
          },
          _active: {
            bg: props.colorMode === 'dark' ? 'brand.200' : 'brand.700',
            transform: 'translateY(0)'
          },
          _focusVisible: {
            ring: '2px',
            ringColor: 'brand.200',
            ringOffset: '2px',
            ringOffsetColor: props.colorMode === 'dark' ? 'gray.900' : 'white'
          }
        }),
        outline: (props: StyleFunctionProps) => ({
          border: '2px solid',
          borderColor: 'border.moderate',
          color: 'text.primary',
          bg: 'transparent',
          borderRadius: 'lg',
          transition: 'all 0.2s ease-in-out',
          _hover: {
            bg: props.colorMode === 'dark' ? 'whiteAlpha.100' : 'gray.50',
            borderColor: 'brand.primary',
            transform: 'translateY(-1px)'
          },
          _active: {
            bg: props.colorMode === 'dark' ? 'whiteAlpha.200' : 'gray.100'
          }
        }),
        ghost: (props: StyleFunctionProps) => ({
          color: 'text.primary',
          borderRadius: 'lg',
          transition: 'all 0.2s ease-in-out',
          _hover: {
            bg: props.colorMode === 'dark' ? 'whiteAlpha.100' : 'gray.50',
            transform: 'translateY(-1px)'
          },
          _active: {
            bg: props.colorMode === 'dark' ? 'whiteAlpha.200' : 'gray.100'
          }
        })
      },
      sizes: {
        md: {
          h: '44px',
          px: '24px',
          fontSize: 'md'
        }
      }
    },
    Card: {
      baseStyle: (props: StyleFunctionProps) => ({
        container: {
          bg: 'surface.base',
          border: '1px solid',
          borderColor: 'border.subtle',
          borderRadius: '2xl',
          boxShadow: 'sm',
          transition: 'all 0.3s ease-in-out',
          _hover: {
            boxShadow: 'md'
          }
        }
      }),
      variants: {
        elevated: (props: StyleFunctionProps) => ({
          container: {
            bg: 'surface.elevated',
            boxShadow: 'md',
            _hover: {
              boxShadow: 'lg'
            }
          }
        }),
        muted: (props: StyleFunctionProps) => ({
          container: {
            bg: 'surface.muted',
            borderColor: 'transparent',
            boxShadow: 'none'
          }
        }),
        brand: (props: StyleFunctionProps) => ({
          container: {
            bg: 'brand.surface',
            borderColor: 'brand.200',
            _dark: {
              borderColor: 'brand.800'
            }
          }
        })
      },
      defaultProps: {
        variant: 'elevated'
      }
    },
    Modal: {
      baseStyle: (props: StyleFunctionProps) => ({
        dialog: {
          bg: 'surface.elevated',
          borderRadius: '3xl',
          boxShadow: 'xl',
          border: '1px solid',
          borderColor: 'border.subtle'
        },
        overlay: {
          bg: 'blackAlpha.600',
          backdropFilter: 'blur(4px)'
        },
        header: {
          fontSize: 'xl',
          fontWeight: '700',
          color: 'text.primary',
          px: 8,
          pt: 8,
          pb: 4
        },
        body: {
          px: 8,
          py: 4,
          color: 'text.secondary'
        },
        footer: {
          px: 8,
          pb: 8,
          pt: 4
        }
      })
    },
    Drawer: {
      baseStyle: (props: StyleFunctionProps) => ({
        dialog: {
          bg: 'surface.elevated'
        }
      })
    },
    Input: {
      defaultProps: {
        variant: 'outline',
        size: 'md'
      },
      variants: {
        outline: (props: StyleFunctionProps) => ({
          field: {
            bg: props.colorMode === 'dark' ? 'whiteAlpha.50' : 'white',
            border: '2px solid',
            borderColor: 'border.subtle',
            borderRadius: 'lg',
            transition: 'all 0.2s ease-in-out',
            _hover: {
              borderColor: 'border.moderate'
            },
            _focus: {
              borderColor: 'brand.primary',
              boxShadow: '0 0 0 3px var(--chakra-colors-brand-100)',
              _dark: {
                boxShadow: '0 0 0 3px var(--chakra-colors-brand-900)'
              }
            },
            _invalid: {
              borderColor: 'status.error',
              boxShadow: '0 0 0 3px var(--chakra-colors-red-100)'
            }
          }
        })
      }
    },
    Progress: {
      baseStyle: (props: StyleFunctionProps) => ({
        track: {
          borderRadius: 'full',
          bg: props.colorMode === 'dark' ? 'whiteAlpha.200' : 'gray.100'
        },
        filledTrack: {
          borderRadius: 'full',
          transition: 'all 0.3s ease-in-out'
        }
      })
    },
    Badge: {
      variants: {
        subtle: (props: StyleFunctionProps) => ({
          bg: props.colorMode === 'dark' ? 'whiteAlpha.200' : 'gray.100',
          color: 'text.primary',
          borderRadius: 'md',
          px: 2,
          py: 1,
          fontSize: 'xs',
          fontWeight: '600',
          textTransform: 'none'
        }),
        solid: (props: StyleFunctionProps) => ({
          borderRadius: 'md',
          px: 2,
          py: 1,
          fontSize: 'xs',
          fontWeight: '600',
          textTransform: 'none'
        })
      }
    },
    Stat: {
      baseStyle: (props: StyleFunctionProps) => ({
        container: {
          p: 6,
          bg: 'surface.base',
          borderRadius: '2xl',
          border: '1px solid',
          borderColor: 'border.subtle',
          position: 'relative',
          overflow: 'hidden'
        },
        label: {
          color: 'text.secondary',
          fontSize: 'sm',
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: 'wider',
          mb: 2
        },
        number: {
          color: 'text.primary',
          fontSize: '2xl',
          fontWeight: 'bold',
          lineHeight: '1.2'
        },
        helpText: {
          color: 'text.tertiary',
          fontSize: 'sm',
          mt: 1
        }
      })
    }
  },
  // Enhanced spacing scale
  space: {
    0.5: '2px',
    1: '4px',
    1.5: '6px',
    2: '8px',
    2.5: '10px',
    3: '12px',
    3.5: '14px',
    4: '16px',
    5: '20px',
    6: '24px',
    7: '28px',
    8: '32px',
    9: '36px',
    10: '40px',
    12: '48px',
    14: '56px',
    16: '64px',
    20: '80px',
    24: '96px'
  },
  // Enhanced breakpoints
  breakpoints: {
    base: '0em',   // 0px
    sm: '30em',    // 480px
    md: '48em',    // 768px
    lg: '62em',    // 992px
    xl: '80em',    // 1280px
    '2xl': '96em'  // 1536px
  }
});