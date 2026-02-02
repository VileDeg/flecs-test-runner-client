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
  ButtonContainer,
  PreviewBox,
  ErrorBox,
  InfoText,
  List,
  ListItem,
} from "@theme/components";

// ComponentFields specific styled components
export const EmptyStateMessage = styled.div`
  font-style: italic;
  color: ${theme.colors.textSecondary};
`;

export const FieldRow = styled.div`
  margin-bottom: ${theme.spacing.lg};
  display: flex;
  gap: ${theme.spacing.sm};
  align-items: center;
`;

export const FieldLabel = styled.label`
  display: block;
  margin-bottom: ${theme.spacing.xs};
  font-weight: ${theme.typography.fontWeight.semibold};
  color: ${theme.colors.text};
  font-size: ${theme.typography.fontSize.sm};
  flex: 0 0 100px;
`;

export const FieldInput = styled.input`
  width: 100%;
  padding: ${theme.spacing.sm};
  border: 1px solid ${theme.colors.input.border};
  border-radius: ${theme.borderRadius.sm};
  font-size: ${theme.typography.fontSize.sm};
  box-sizing: border-box;
  background-color: ${theme.colors.input.bg};
  color: ${theme.colors.input.text};
  font-family: ${theme.typography.fontFamily.sans};
  transition: border-color ${theme.transitions.normal}, box-shadow ${theme.transitions.normal};
  flex: 1;
  
  &:focus {
    outline: none;
    border-color: ${theme.colors.input.focus};
    box-shadow: 0 0 0 1px ${theme.colors.input.focus};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

// Builder-specific components

// Two column layout for builder page
export const BuilderLayout = styled.div`
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: ${theme.spacing.xxl};
  align-items: start;

  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
`;

export const MainColumn = styled.div`
  /* Main content column */
`;

export const SideColumn = styled.div`
  position: sticky;
  top: calc(88px + ${theme.spacing.lg});
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.lg};
`;

export const StateLayout = styled.div<{stacked?: boolean}>`
  display: grid;
  grid-template-columns: ${props => props.stacked ? '1fr' : '1fr 1fr'}};
  gap: ${theme.spacing.lg};
  align-items: start;

  margin-left: calc(-${theme.spacing.lg} - ${theme.spacing.md});
  width: calc(100% + ${theme.spacing.lg} + ${theme.spacing.md});

  @media (max-width: 1400px) {
    grid-template-columns: 1fr;
    margin-left: 0;
    width: 100%;
  }
`;

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
  flex-direction: column;
  gap: ${theme.spacing.md};
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

export const ModulePathText = styled.span`
  color: ${theme.colors.textSecondary};
  font-size: ${theme.typography.fontSize.sm};
  margin-left: ${theme.spacing.sm};
`;

export const ModuleButtonGroup = styled.div`
  display: flex;
  justify-content: center;
  gap: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.lg};
`;

export const ModuleInfoText = styled.p`
  margin: 0 0 ${theme.spacing.lg} 0;
  color: ${theme.colors.text};
  opacity: 0.8;
  font-size: ${theme.typography.fontSize.sm};
`;

// Builder page specific messages and status components
export const LoadingMessage = styled.div`
  text-align: center;
  color: ${theme.colors.textSecondary};
`;

export const EmptyMessage = styled.div`
  text-align: center;
  color: ${theme.colors.textSecondary};
  font-style: italic;
`;

export const GeneratingStatusBox = styled.div`
  padding: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.lg};
  background-color: ${theme.colors.info.light};
  color: ${theme.colors.info.dark};
  border-radius: ${theme.borderRadius.sm};
  text-align: center;
  font-weight: ${theme.typography.fontWeight.medium};
`;

export const FillButtonContainer = styled.div`
  margin-bottom: ${theme.spacing.lg};
`;

export const FullWidthButton = styled(Button)`
  width: 100%;
`;
