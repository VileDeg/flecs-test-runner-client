import styled from "styled-components";
import { theme } from "./theme/theme";

// Re-export common components
export { Button, Container } from "./theme/components";

export const Output = styled.pre`
  background: rgb(0, 0, 0);
  padding: ${theme.spacing.md};
  border: 1px solid ${theme.colors.border};
  overflow-x: auto;
  border-radius: ${theme.borderRadius.sm};
  font-family: ${theme.typography.fontFamily.mono};
`;

export const Title = styled.h1`
  color: ${theme.colors.text};
  font-size: ${theme.typography.fontSize['3xl']};
  font-weight: ${theme.typography.fontWeight.semibold};
`;

export const Subtitle = styled.h2`
  color: ${theme.colors.text};
  opacity: 0.8;
  font-size: ${theme.typography.fontSize.xl};
  font-weight: ${theme.typography.fontWeight.medium};
`;

// TopBar components
export const TopBar = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: ${theme.zIndex.fixed};
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${theme.spacing.lg} ${theme.spacing.xxl};
  background-color: #2d2d2d;
  border-bottom: 1px solid #404040;
  box-shadow: ${theme.shadows.md};
`;

export const TopBarLeft = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.lg};
`;

export const TopBarRight = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
`;

export const AppTitle = styled.h1`
  margin: 0;
  font-size: ${theme.typography.fontSize['2xl']};
  font-weight: ${theme.typography.fontWeight.semibold};
  color: #e0e0e0;
`;

export const ConnectionBadge = styled.span<{ $status: string }>`
  padding: ${theme.spacing.xs} ${theme.spacing.md};
  border-radius: ${theme.borderRadius.xl};
  font-size: ${theme.typography.fontSize.sm};
  font-weight: ${theme.typography.fontWeight.medium};
  background-color: ${({ $status }) => 
    $status === "Connected" ? theme.colors.success.light : 
    ($status === "Connecting" || $status === "RetryConnecting") ? theme.colors.warning.light : theme.colors.error.light
  };
  color: ${({ $status }) => 
    $status === "Connected" ? theme.colors.success.dark : 
    ($status === "Connecting" || $status === "RetryConnecting") ? theme.colors.warning.dark : theme.colors.error.dark
  };
`;

export const NavButton = styled.button<{ $active?: boolean }>`
  padding: ${theme.spacing.sm} ${theme.spacing.lg};
  border: 1px solid ${theme.colors.primary.main};
  border-radius: ${theme.borderRadius.md};
  background-color: ${({ $active }) => $active ? theme.colors.primary.main : "transparent"};
  color: ${({ $active }) => $active ? "white" : "#e0e0e0"};
  cursor: pointer;
  font-weight: ${theme.typography.fontWeight.medium};
  transition: all ${theme.transitions.normal};

  &:hover {
    background-color: ${({ $active }) => $active ? theme.colors.primary.hover : "rgba(255,255,255,0.1)"};
    border-color: ${({ $active }) => $active ? theme.colors.primary.hover : theme.colors.primary.light};
  }
`;

export const CenteredContent = styled.div`
  font-family: ${theme.typography.fontFamily.sans};
  padding: ${theme.spacing.xxl};
  max-width: 800px;
  margin: 0 auto;
  text-align: center;
  min-height: 60vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

export const MainContent = styled.div`
  font-family: ${theme.typography.fontFamily.sans};
  padding: 88px ${theme.spacing.xxl} ${theme.spacing.xxl} ${theme.spacing.xxl};
  max-width: 800px;
  margin: 0 auto;
`;
