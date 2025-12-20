/**
 * Common Styled Components
 * 
 * Reusable styled components that follow the design system theme.
 * These should be used across the application for consistency.
 */

import styled, { css } from 'styled-components';
import { theme } from './theme';

// Container Components
export const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: ${theme.spacing.xl};
  font-family: ${theme.typography.fontFamily.sans};
  color: ${theme.colors.text};
`;

export const Section = styled.div`
  margin-bottom: ${theme.spacing.xxxl};
  padding: ${theme.spacing.xl};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.lg};
  background-color: ${theme.colors.surface};
`;

// Typography
export const Header = styled.h1`
  color: ${theme.colors.text};
  margin-bottom: ${theme.spacing.xxxl};
  text-align: center;
  font-size: ${theme.typography.fontSize['2xl']};
  font-weight: ${theme.typography.fontWeight.semibold};
`;

export const SectionHeader = styled.h2`
  color: ${theme.colors.text};
  margin-bottom: ${theme.spacing.lg};
  font-size: ${theme.typography.fontSize.xl};
  border-bottom: 2px solid ${theme.colors.input.focus};
  padding-bottom: ${theme.spacing.xs};
  font-weight: ${theme.typography.fontWeight.semibold};
`;

export const Label = styled.label`
  display: block;
  margin-bottom: ${theme.spacing.xs};
  font-weight: ${theme.typography.fontWeight.semibold};
  color: ${theme.colors.text};
  font-size: ${theme.typography.fontSize.sm};
`;

// Form Elements
export const FormGroup = styled.div`
  margin-bottom: ${theme.spacing.lg};
`;

const inputStyles = css`
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

export const Input = styled.input`
  ${inputStyles}
`;

export const Select = styled.select`
  ${inputStyles}
  
  option {
    background-color: ${theme.colors.dropdown.bg};
    color: ${theme.colors.dropdown.text};
  }
`;

export const TextArea = styled.textarea`
  ${inputStyles}
  resize: vertical;
  min-height: 100px;
  font-family: ${theme.typography.fontFamily.mono};
`;

// Button Variants
interface ButtonProps {
  $variant?: 'primary' | 'success' | 'error' | 'warning' | 'info';
  $size?: 'sm' | 'md' | 'lg';
  $fullWidth?: boolean;
}

const getButtonColors = ($variant: ButtonProps['$variant'] = 'primary') => {
  switch ($variant) {
    case 'success':
      return css`
        background-color: ${theme.colors.success.bg};
        &:hover { background-color: ${theme.colors.success.hover}; }
      `;
    case 'error':
      return css`
        background-color: ${theme.colors.error.bg};
        &:hover { background-color: ${theme.colors.error.hover}; }
      `;
    case 'warning':
      return css`
        background-color: ${theme.colors.warning.main};
        &:hover { background-color: ${theme.colors.warning.hover}; }
      `;
    case 'info':
      return css`
        background-color: ${theme.colors.info.main};
        &:hover { background-color: ${theme.colors.info.hover}; }
      `;
    default:
      return css`
        background-color: ${theme.colors.primary.main};
        &:hover { background-color: ${theme.colors.primary.hover}; }
        &:active { background-color: ${theme.colors.primary.active}; }
      `;
  }
};

const getButtonSize = ($size: ButtonProps['$size'] = 'md') => {
  switch ($size) {
    case 'sm':
      return css`
        padding: ${theme.spacing.xs} ${theme.spacing.md};
        font-size: ${theme.typography.fontSize.xs};
      `;
    case 'lg':
      return css`
        padding: ${theme.spacing.md} ${theme.spacing.xxl};
        font-size: ${theme.typography.fontSize.base};
      `;
    default:
      return css`
        padding: ${theme.spacing.md} ${theme.spacing.xl};
        font-size: ${theme.typography.fontSize.sm};
      `;
  }
};

export const Button = styled.button<ButtonProps>`
  ${props => getButtonSize(props.$size)}
  ${props => getButtonColors(props.$variant)}
  color: white;
  border: none;
  border-radius: ${theme.borderRadius.sm};
  cursor: pointer;
  font-weight: ${theme.typography.fontWeight.medium};
  transition: background-color ${theme.transitions.normal};
  width: ${props => props.$fullWidth ? '100%' : 'auto'};
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

// Specific Button Variants (for backward compatibility)
export const AddButton = styled(Button).attrs({ $variant: 'success' })``;
export const RemoveButton = styled(Button).attrs({ $variant: 'error', $size: 'sm' })``;

// List Components
export const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.md};
`;

export const ListItem = styled.div`
  padding: ${theme.spacing.md};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.sm};
  background-color: ${theme.colors.surface};
`;

// Card Component
export const Card = styled.div`
  padding: ${theme.spacing.xl};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.lg};
  background-color: ${theme.colors.surface};
  box-shadow: ${theme.shadows.sm};
`;

// Feedback Components
export const ErrorBox = styled.div`
  background-color: ${theme.colors.error.light};
  color: ${theme.colors.error.dark};
  border-radius: ${theme.borderRadius.lg};
  padding: ${theme.spacing.md} ${theme.spacing.lg};
  margin-bottom: ${theme.spacing.lg};
`;

export const SuccessBox = styled.div`
  background-color: ${theme.colors.success.light};
  color: ${theme.colors.success.dark};
  border-radius: ${theme.borderRadius.lg};
  padding: ${theme.spacing.md} ${theme.spacing.lg};
  margin-bottom: ${theme.spacing.lg};
`;

export const InfoText = styled.p`
  margin: 0 0 ${theme.spacing.lg} 0;
  color: ${theme.colors.text};
  opacity: 0.8;
  font-size: ${theme.typography.fontSize.sm};
`;

// Layout Components
export const FlexRow = styled.div<{ $gap?: keyof typeof theme.spacing; $justify?: string; $align?: string }>`
  display: flex;
  flex-direction: row;
  gap: ${props => theme.spacing[props.$gap || 'md']};
  justify-content: ${props => props.$justify || 'flex-start'};
  align-items: ${props => props.$align || 'stretch'};
`;

export const FlexCol = styled.div<{ $gap?: keyof typeof theme.spacing }>`
  display: flex;
  flex-direction: column;
  gap: ${props => theme.spacing[props.$gap || 'md']};
`;

// Preview/Code Display
export const PreviewBox = styled.div`
  background-color: ${theme.colors.input.bg};
  padding: ${theme.spacing.lg};
  border-radius: ${theme.borderRadius.sm};
  border: 1px solid ${theme.colors.border};
  max-height: 400px;
  overflow-y: auto;
  
  pre {
    margin: 0;
    font-family: ${theme.typography.fontFamily.mono};
    font-size: ${theme.typography.fontSize.xs};
    white-space: pre-wrap;
    word-wrap: break-word;
    color: ${theme.colors.text};
    text-align: left;
  }
`;

// Checkbox
export const Checkbox = styled.input.attrs({ type: 'checkbox' })`
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: ${theme.colors.input.focus};
`;

// Page Container Variant (for centered pages like landing/results)
export const PageContainer = styled(Container)`
  max-width: 900px;
  text-align: center;
  padding: ${theme.spacing.xxl};
`;

// Table Components
export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: ${theme.colors.surface};
  border-radius: ${theme.borderRadius.lg};
  overflow: hidden;
  border: 1px solid ${theme.colors.border};
`;

export const TableHead = styled.thead`
  background: ${theme.colors.input.bg};
`;

export const TableBody = styled.tbody``;

export const TableRow = styled.tr`
  border-bottom: 1px solid ${theme.colors.border};

  &:hover {
    background: ${theme.colors.input.bg};
  }

  &:last-child {
    border-bottom: none;
  }
`;

export const TableHeader = styled.th`
  padding: ${theme.spacing.md};
  text-align: left;
  font-weight: ${theme.typography.fontWeight.semibold};
  color: ${theme.colors.text};
  border-bottom: 2px solid ${theme.colors.border};
  font-size: ${theme.typography.fontSize.sm};
`;

export const TableCell = styled.td`
  padding: ${theme.spacing.md};
  color: ${theme.colors.text};
  font-size: ${theme.typography.fontSize.sm};
`;

// Status Badge Component
export const StatusBadge = styled.span<{ $status: "passed" | "failed" | "pending" }>`
  padding: ${theme.spacing.xs} ${theme.spacing.md};
  border-radius: ${theme.borderRadius.md};
  font-weight: ${theme.typography.fontWeight.semibold};
  font-size: ${theme.typography.fontSize.xs};
  color: white;
  ${({ $status }) =>
    $status === "passed" &&
    css`
      background-color: ${theme.colors.success.bg};
    `}
  ${({ $status }) =>
    $status === "failed" &&
    css`
      background-color: ${theme.colors.error.bg};
    `}
  ${({ $status }) =>
    $status === "pending" &&
    css`
      background-color: ${theme.colors.warning.main};
      color: #212529;
    `}
`;
