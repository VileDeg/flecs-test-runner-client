import styled from "styled-components";

export const Container = styled.div`
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
`;

export const Header = styled.h3`
  margin: 0 0 15px 0;
  color: var(--color-text);
  font-size: 1.25rem;
  font-weight: 600;
`;

export const ModuleList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 300px;
  overflow-y: auto;
  padding: 10px;
  background: var(--color-input-bg);
  border: 1px solid var(--color-border);
  border-radius: 4px;
`;

export const ModuleItem = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  border-radius: 4px;
  transition: background-color 0.2s;

  &:hover {
    background-color: var(--color-surface);
  }
`;

export const Checkbox = styled.input`
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: var(--color-focus);
`;

export const Label = styled.label`
  cursor: pointer;
  user-select: none;
  flex: 1;
  display: flex;
  align-items: center;
  color: var(--color-text);
`;

export const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
`;

export const Button = styled.button`
  padding: 6px 12px;
  background-color: #007acc;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s;

  &:hover {
    background-color: #005a9e;
  }

  &:active {
    background-color: #004080;
    opacity: 0.8;
  }
`;

export const InfoText = styled.p`
  margin: 0 0 15px 0;
  color: var(--color-text);
  opacity: 0.8;
  font-size: 0.95rem;
`;
