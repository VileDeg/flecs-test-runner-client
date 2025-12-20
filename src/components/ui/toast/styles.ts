import styled from "styled-components";
import { theme } from "@theme/theme.ts";

export const ToastContainer = styled.div`
  position: fixed;
  bottom: ${theme.spacing.xl};
  right: ${theme.spacing.xl};
  z-index: ${theme.zIndex.toast};
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.md};
  max-width: 400px;
`;

interface ToastProps {
  $type: 'success' | 'error';
}

export const Toast = styled.div<ToastProps>`
  padding: ${theme.spacing.lg} ${theme.spacing.xl};
  border-radius: ${theme.borderRadius.lg};
  box-shadow: ${theme.shadows.lg};
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
  min-width: 300px;
  animation: slideIn ${theme.transitions.slow} ease-out;
  background-color: ${props => props.$type === 'success' ? theme.colors.success.main : theme.colors.error.main};
  color: white;
  font-weight: ${theme.typography.fontWeight.medium};
  
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  &.fade-out {
    animation: fadeOut ${theme.transitions.slow} ease-out forwards;
  }
  
  @keyframes fadeOut {
    from {
      opacity: 1;
      transform: translateX(0);
    }
    to {
      opacity: 0;
      transform: translateX(400px);
    }
  }
`;

export const ToastIcon = styled.span`
  font-size: ${theme.typography.fontSize.xl};
  flex-shrink: 0;
`;

export const ToastMessage = styled.span`
  flex: 1;
  word-wrap: break-word;
  font-size: ${theme.typography.fontSize.sm};
`;

export const ToastCloseButton = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: ${theme.typography.fontSize.xl};
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.8;
  transition: opacity ${theme.transitions.normal};
  
  &:hover {
    opacity: 1;
  }
`;
