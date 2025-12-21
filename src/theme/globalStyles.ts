/**
 * Global Styles
 * 
 * Application-wide global styles using styled-components createGlobalStyle.
 * Replaces the previous CSS files (App.css, index.css) for better consistency
 * and integration with the theme system.
 */

import { createGlobalStyle } from 'styled-components';
import { theme } from './theme';

export const GlobalStyles = createGlobalStyle`
  :root {
    font-family: ${theme.typography.fontFamily.sans};
    line-height: 1.5;
    font-weight: ${theme.typography.fontWeight.normal};
    
    color-scheme: light dark;
    
    /* Dark theme variables (default) */
    --color-text: rgba(255, 255, 255, 0.87);
    --color-background: #242424;
    --color-surface: #1a1a1a;
    --color-border: #3a3a3a;
    --color-input-bg: #2a2a2a;
    --color-input-text: rgba(255, 255, 255, 0.87);
    --color-input-border: #4a4a4a;
    --color-focus: #646cff;
    --color-dropdown-bg: #2a2a2a;
    --color-dropdown-text: rgba(255, 255, 255, 0.87);
    
    font-synthesis: none;
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  @media (prefers-color-scheme: light) {
    :root {
      /* Light theme variables */
      --color-text: #213547;
      --color-background: #ffffff;
      --color-surface: #f9f9f9;
      --color-border: #e0e0e0;
      --color-input-bg: #ffffff;
      --color-input-text: #213547;
      --color-input-border: #d0d0d0;
      --color-focus: #646cff;
      --color-dropdown-bg: #ffffff;
      --color-dropdown-text: #213547;
    }
  }

  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    min-width: 320px;
    min-height: 100vh;
    color: ${theme.colors.text};
    background-color: ${theme.colors.background};
  }

  #root {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  a {
    font-weight: ${theme.typography.fontWeight.medium};
    color: ${theme.colors.link.default};
    text-decoration: inherit;
    transition: color ${theme.transitions.fast};

    &:hover {
      color: ${theme.colors.link.hover};
    }
  }

  h1 {
    font-size: ${theme.typography.fontSize['3xl']};
    line-height: 1.1;
    font-weight: ${theme.typography.fontWeight.bold};
    margin: 0;
  }

  h2 {
    font-size: ${theme.typography.fontSize['2xl']};
    line-height: 1.2;
    font-weight: ${theme.typography.fontWeight.semibold};
    margin: 0;
  }

  h3 {
    font-size: ${theme.typography.fontSize.xl};
    line-height: 1.3;
    font-weight: ${theme.typography.fontWeight.semibold};
    margin: 0;
  }

  p {
    margin: 0;
  }

  button {
    font-family: inherit;
    cursor: pointer;
  }

  input, textarea, select {
    font-family: inherit;
  }
`;
