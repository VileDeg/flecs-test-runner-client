import styled, { css } from "styled-components";
import { theme } from "@theme/theme";
import { 
  PageContainer, 
  ErrorBox, 
  Header, 
  Button,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
  StatusBadge
} from "@theme/components";

// Re-export common components
export { 
  ErrorBox, 
  Header, 
  Button,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
  StatusBadge
};

// Results page container
export const Container = styled(PageContainer)``;

// Page-specific components
export const Section = styled.div`
  margin-bottom: ${theme.spacing.xxxl};
  
  &:last-child {
    margin-bottom: 0;
  }
`;

export const SectionHeader = styled.h2<{ $status: "pending" | "passed" | "failed" }>`
  font-size: ${theme.typography.fontSize.xl};
  margin-bottom: ${theme.spacing.lg};
  text-align: left;
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
  font-weight: ${theme.typography.fontWeight.semibold};
  
  ${({ $status }) =>
    $status === "pending" &&
    css`
      color: ${theme.colors.warning.main};
    `}
  ${({ $status }) =>
    $status === "passed" &&
    css`
      color: ${theme.colors.success.bg};
    `}
  ${({ $status }) =>
    $status === "failed" &&
    css`
      color: ${theme.colors.error.bg};
    `}
`;

export const EmptyMessage = styled.p`
  color: ${theme.colors.text};
  opacity: 0.6;
  font-style: italic;
  text-align: center;
  padding: ${theme.spacing.xl};
  font-size: ${theme.typography.fontSize.sm};
`;
