/**
 * Builder Page Styles
 * 
 * Refactored to use the centralized theme system.
 * Common components are re-exported from theme/components.
 * Page-specific components are defined here.
 */

import styled from "styled-components";
import { theme } from "@theme/theme";
import { Button } from "@theme/components";

// Re-export common components from theme
export {
  Container,
  Header,
  Section,
  SectionHeader,
  FormGroup,
  Label,
  Input,
  Select,
  TextArea,
  Button,
  AddButton,
  RemoveButton,
  PreviewBox,
  ErrorBox,
  InfoText,
  List,
  ListItem,
} from "@theme/components";

// Builder-specific components
export const SystemList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.md};
`;

export const SystemItem = styled.div`
  padding: ${theme.spacing.lg};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.sm};
  background-color: ${theme.colors.surface};
  display: flex;
  flex-wrap: wrap;
  gap: ${theme.spacing.md};
  align-items: center;
`;

export const EntityBuilder = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.lg};
`;

export const EntityItem = styled.div`
  padding: ${theme.spacing.lg};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  background-color: ${theme.colors.surface};
`;

export const ComponentBuilder = styled.div`
  margin-top: ${theme.spacing.md};
  padding: ${theme.spacing.md};
  background-color: ${theme.colors.input.bg};
  border-radius: ${theme.borderRadius.sm};
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.md};
`;

export const ComponentItem = styled.div`
  padding: ${theme.spacing.md};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.sm};
  background-color: ${theme.colors.surface};
`;

export const ActionButtons = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${theme.spacing.md};
  justify-content: center;
  padding: ${theme.spacing.xl} 0;
  border-top: 1px solid ${theme.colors.border};
  margin-top: ${theme.spacing.xl};
`;

export const SaveJsonButton = styled(Button).attrs({ $variant: 'info' })``;
export const RunTestButton = styled(Button).attrs({ $variant: 'warning' })``;

// Module Selector specific styles
export const ModuleSelectorContainer = styled.div`
  background: ${theme.colors.surface};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.lg};
  padding: ${theme.spacing.xl};
  margin-bottom: ${theme.spacing.xl};
`;

export const ModuleSelectorHeader = styled.h3`
  margin: 0 0 ${theme.spacing.lg} 0;
  color: ${theme.colors.text};
  font-size: ${theme.typography.fontSize.xl};
  font-weight: ${theme.typography.fontWeight.semibold};
`;

export const ModuleList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.sm};
  max-height: 300px;
  overflow-y: auto;
  padding: ${theme.spacing.md};
  background: ${theme.colors.input.bg};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.sm};
`;

export const ModuleItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
  padding: ${theme.spacing.sm};
  border-radius: ${theme.borderRadius.sm};
  transition: background-color ${theme.transitions.normal};

  &:hover {
    background-color: ${theme.colors.surface};
  }
`;

export const ModuleCheckbox = styled.input.attrs({ type: 'checkbox' })`
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: ${theme.colors.input.focus};
`;

export const ModuleLabel = styled.label`
  cursor: pointer;
  user-select: none;
  flex: 1;
  display: flex;
  align-items: center;
  color: ${theme.colors.text};
`;

export const ModuleButtonGroup = styled.div`
  display: flex;
  gap: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.lg};
`;

export const ModuleInfoText = styled.p`
  margin: 0 0 ${theme.spacing.lg} 0;
  color: ${theme.colors.text};
  opacity: 0.8;
  font-size: ${theme.typography.fontSize.sm};
`;
