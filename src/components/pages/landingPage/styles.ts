import styled from "styled-components";
import { theme } from "@theme/theme.ts";
import { PageContainer, ErrorBox, Button } from "@theme/components.ts";

// Re-export common components
export { ErrorBox, Button };

// Landing page container
export const Container = styled(PageContainer)``;

// Page-specific styled components
export const TestsList = styled.ul`
  text-align: left;
  background: ${theme.colors.surface};
  padding: ${theme.spacing.lg};
  border-radius: ${theme.borderRadius.lg};
  margin-top: ${theme.spacing.lg};
  list-style: none;
  border: 1px solid ${theme.colors.border};
  
  li {
    margin-bottom: ${theme.spacing.sm};
    color: ${theme.colors.text};
  }
`;
