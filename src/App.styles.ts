import styled, { css } from "styled-components";
import { theme } from "@theme/theme";

export const Header = styled.h1`
  font-size: ${theme.typography.fontSize['2xl']};
  margin-bottom: ${theme.spacing.lg};
  font-weight: ${theme.typography.fontWeight.semibold};
`;

export const StatusBar = styled.div<{ $status: string }>` 
  margin: ${theme.spacing.lg} 0;
  padding: ${theme.spacing.md} ${theme.spacing.md};
  border-radius: ${theme.borderRadius.lg};
  font-weight: ${theme.typography.fontWeight.medium};
  ${({ $status }) =>
    ($status === "Connecting" || $status === "RetryConnecting") &&
    css`
      background-color: ${theme.colors.warning.light};
      color: ${theme.colors.warning.dark};
    `}
  ${({ $status }) =>
    $status === "Connected" &&
    css`
      background-color: ${theme.colors.success.light};
      color: ${theme.colors.success.dark};
    `}
  ${({ $status }) =>
    $status === "Disconnected" &&
    css`
      background-color: ${theme.colors.error.light};
      color: ${theme.colors.error.dark};
    `}
`;
