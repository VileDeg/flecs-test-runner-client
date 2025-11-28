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

export const ToastContainer = styled.div`
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 400px;
`;

interface ToastProps {
  type: 'success' | 'error';
}

export const Toast = styled.div<ToastProps>`
  padding: 16px 20px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 300px;
  animation: slideIn 0.3s ease-out;
  background-color: ${props => props.type === 'success' ? '#4caf50' : '#f44336'};
  color: white;
  font-weight: 500;
  
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  &.fade-out {
    animation: fadeOut 0.3s ease-out forwards;
  }
  
  @keyframes fadeOut {
    from {
      opacity: 1;
      transform: translateX(0);
    }
    to {
      opacity: 0;
      transform: translateX(400px);
    }
  }
`;

export const ToastIcon = styled.span`
  font-size: 20px;
  flex-shrink: 0;
`;

export const ToastMessage = styled.span`
  flex: 1;
  word-wrap: break-word;
`;

export const ToastCloseButton = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: 20px;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.8;
  transition: opacity 0.2s;
  
  &:hover {
    opacity: 1;
  }
`;