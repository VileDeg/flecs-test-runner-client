import styled from "styled-components";

export const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif;
  color: var(--color-text);
`;

export const Header = styled.h1`
  color: var(--color-text);
  margin-bottom: 30px;
  text-align: center;
`;

export const Section = styled.div`
  margin-bottom: 30px;
  padding: 20px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background-color: var(--color-surface);
`;

export const SectionHeader = styled.h2`
  color: var(--color-text);
  margin-bottom: 15px;
  font-size: 1.2em;
  border-bottom: 2px solid var(--color-focus);
  padding-bottom: 5px;
`;

export const FormGroup = styled.div`
  margin-bottom: 15px;
`;

export const Label = styled.label`
  display: block;
  margin-bottom: 5px;
  font-weight: 600;
  color: var(--color-text);
`;

export const Input = styled.input`
  width: 100%;
  padding: 8px;
  border: 1px solid var(--color-input-border);
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
  background-color: var(--color-input-bg);
  color: var(--color-input-text);
  
  &:focus {
    outline: none;
    border-color: var(--color-focus);
    box-shadow: 0 0 0 1px var(--color-focus);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const Select = styled.select`
  width: 100%;
  padding: 8px;
  border: 1px solid var(--color-input-border);
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
  background-color: var(--color-input-bg);
  color: var(--color-input-text);
  
  &:focus {
    outline: none;
    border-color: var(--color-focus);
    box-shadow: 0 0 0 1px var(--color-focus);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  /* Style the dropdown options to match theme */
  option {
    background-color: var(--color-dropdown-bg);
    color: var(--color-dropdown-text);
  }
`;

export const TextArea = styled.textarea`
  width: 100%;
  padding: 8px;
  border: 1px solid var(--color-input-border);
  border-radius: 4px;
  font-size: 14px;
  font-family: 'Courier New', monospace;
  resize: vertical;
  min-height: 100px;
  box-sizing: border-box;
  background-color: var(--color-input-bg);
  color: var(--color-input-text);
  
  &:focus {
    outline: none;
    border-color: var(--color-focus);
    box-shadow: 0 0 0 1px var(--color-focus);
  }
`;

export const Button = styled.button`
  padding: 10px 20px;
  background-color: #007acc;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  margin-right: 10px;
  margin-bottom: 10px;
  
  &:hover {
    background-color: #005a9e;
  }
  
  &:active {
    background-color: #004080;
  }
`;

export const AddButton = styled(Button)`
  background-color: #28a745;
  
  &:hover {
    background-color: #218838;
  }
`;

export const RemoveButton = styled(Button)`
  background-color: #dc3545;
  padding: 5px 10px;
  font-size: 12px;
  
  &:hover {
    background-color: #c82333;
  }
`;

export const SaveJsonButton = styled(Button)`
  background-color: #17a2b8;
  
  &:hover {
    background-color: #138496;
  }
`;

export const RunTestButton = styled(Button)`
  background-color: #fd7e14;
  
  &:hover {
    background-color: #e66100;
  }
`;

export const ErrorBox = styled.div`
  background-color: #f8d7da;
  color: #721c24;
  padding: 12px;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
  margin-bottom: 20px;
`;

export const SuccessBox = styled.div`
  background-color: #d4edda;
  color: #155724;
  padding: 12px;
  border: 1px solid #c3e6cb;
  border-radius: 4px;
  margin-bottom: 20px;
`;

export const SystemList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

export const SystemItem = styled.div`
  background-color: var(--color-input-bg);
  padding: 15px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  display: grid;
  grid-template-columns: 2fr 1fr auto;
  gap: 15px;
  align-items: end;
`;

export const EntityBuilder = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

export const EntityItem = styled.div`
  background-color: var(--color-input-bg);
  padding: 20px;
  border: 2px solid var(--color-border);
  border-radius: 8px;
  position: relative;
`;

export const ComponentBuilder = styled.div`
  margin-top: 15px;
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

export const ComponentItem = styled.div`
  background-color: var(--color-surface);
  padding: 15px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  margin-left: 20px;
`;

export const PreviewBox = styled.div`
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  padding: 15px;
  max-height: 400px;
  overflow-y: auto;
  text-align: left;
  
  pre {
    margin: 0;
    font-family: 'Courier New', monospace;
    font-size: 12px;
    white-space: pre-wrap;
    word-wrap: break-word;
    color: var(--color-text);
    text-align: left;
  }
`;

export const ActionButtons = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
  padding: 20px 0;
  border-top: 1px solid var(--color-border);
  margin-top: 20px;
`;

// Module Selector Styles
export const ModuleSelectorContainer = styled.div`
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
`;

export const ModuleSelectorHeader = styled.h3`
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

export const ModuleCheckbox = styled.input`
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: var(--color-focus);
`;

export const ModuleLabel = styled.label`
  cursor: pointer;
  user-select: none;
  flex: 1;
  display: flex;
  align-items: center;
  color: var(--color-text);
`;

export const ModuleButtonGroup = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
`;

export const ModuleInfoText = styled.p`
  margin: 0 0 15px 0;
  color: var(--color-text);
  opacity: 0.8;
  font-size: 0.95rem;
`;