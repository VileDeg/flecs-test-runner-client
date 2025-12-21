import styled from "styled-components";
import { theme } from "@theme/theme";

export const DropzoneContainer = styled.div<{ $isDragActive?: boolean }>`
  border: 2px dashed ${({ $isDragActive }) => 
    $isDragActive ? theme.colors.primary.main : theme.colors.border};
  padding: ${theme.spacing.xxl};
  border-radius: ${theme.borderRadius.md};
  text-align: center;
  background-color: ${({ $isDragActive }) => 
    $isDragActive ? `${theme.colors.primary.main}10` : theme.colors.surface};
  cursor: pointer;
  transition: all ${theme.transitions.normal};

  &:hover {
    border-color: ${theme.colors.primary.light};
    background-color: ${theme.colors.surface};
  }
`;

export const DropzoneText = styled.p`
  margin: 0;
  color: ${theme.colors.text};
  font-size: ${theme.typography.fontSize.base};
`;

export const ErrorMessage = styled.p`
  margin: ${theme.spacing.md} 0 0 0;
  color: ${theme.colors.error.main};
  font-size: ${theme.typography.fontSize.sm};
  font-weight: ${theme.typography.fontWeight.medium};
`;
