/**
 * Design System Theme
 * 
 * Centralized theme configuration following best practices:
 * - Single source of truth for design tokens
 * - Semantic naming for easy understanding
 * - Consistent spacing, colors, and typography
 * - Easy to extend and customize
 */

export const theme = {
  // Colors - semantic naming for intent-based usage
  colors: {
    // Primary brand colors
    primary: {
      main: '#007acc',
      hover: '#005a9e',
      active: '#004080',
      light: '#4da3ff',
    },
    
    // Semantic colors
    success: {
      main: '#4caf50',
      light: '#d4edda',
      dark: '#155724',
      bg: '#28a745',
      hover: '#218838',
    },
    error: {
      main: '#f44336',
      light: '#fdecea',
      dark: '#721c24',
      bg: '#dc3545',
      hover: '#c82333',
    },
    warning: {
      main: '#fd7e14',
      light: '#fff3cd',
      dark: '#856404',
      hover: '#e66100',
    },
    info: {
      main: '#17a2b8',
      light: '#e3f2fd',
      dark: '#1976d2',
      hover: '#138496',
    },
    
    // Neutral colors (referenced from CSS variables)
    text: 'var(--color-text)',
    textSecondary: '#666',
    link: {
      default: '#646cff',
      hover: '#535bf2',
    },
    background: 'var(--color-background)',
    surface: 'var(--color-surface)',
    border: 'var(--color-border)',
    
    // Input colors
    input: {
      bg: 'var(--color-input-bg)',
      text: 'var(--color-input-text)',
      border: 'var(--color-input-border)',
      focus: 'var(--color-focus)',
    },
    
    // Dropdown colors
    dropdown: {
      bg: 'var(--color-dropdown-bg)',
      text: 'var(--color-dropdown-text)',
    },
  },
  
  // Spacing scale - consistent spacing throughout the app
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    xxl: '24px',
    xxxl: '30px',
  },
  
  // Typography
  typography: {
    fontFamily: {
      // Modern system font stack - native UI fonts optimized for each platform
      // Uses the same fonts as GitHub, Bootstrap 5, and other modern design systems
      sans: [
        'system-ui',
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        '"Helvetica Neue"',
        'Arial',
        'sans-serif',
        '"Apple Color Emoji"',
        '"Segoe UI Emoji"',
      ].join(', '),
      
      // Monospace font stack for code and technical content
      // Prioritizes modern, highly legible coding fonts
      mono: [
        'ui-monospace',
        '"Cascadia Code"',
        '"Source Code Pro"',
        'Menlo',
        'Monaco',
        'Consolas',
        '"Courier New"',
        'monospace',
      ].join(', '),
    },
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '2rem',    // 32px
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.1,
      normal: 1.5,
      relaxed: 1.75,
    },
  },
  
  // Border radius
  borderRadius: {
    sm: '4px',
    md: '6px',
    lg: '8px',
    xl: '16px',
    round: '50%',
  },
  
  // Shadows
  shadows: {
    sm: '0 1px 3px rgba(0, 0, 0, 0.12)',
    md: '0 2px 8px rgba(0, 0, 0, 0.15)',
    lg: '0 4px 12px rgba(0, 0, 0, 0.15)',
    xl: '0 8px 16px rgba(0, 0, 0, 0.2)',
  },
  
  // Transitions
  transitions: {
    fast: '0.15s',
    normal: '0.2s',
    slow: '0.3s',
  },
  
  // Z-index scale
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
    toast: 9999,
  },
  
  // Breakpoints for responsive design
  breakpoints: {
    xs: '320px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
} as const;

// Type exports for TypeScript
export type Theme = typeof theme;
export type ThemeColors = typeof theme.colors;
export type ThemeSpacing = typeof theme.spacing;
