import styled from "styled-components";

export const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif;
`;

export const Header = styled.h1`
  color: #333;
  margin-bottom: 30px;
  text-align: center;
`;

export const Section = styled.div`
  margin-bottom: 30px;
  padding: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background-color: #f9f9f9;
`;

export const SectionHeader = styled.h2`
  color: #444;
  margin-bottom: 15px;
  font-size: 1.2em;
  border-bottom: 2px solid #007acc;
  padding-bottom: 5px;
`;

export const FormGroup = styled.div`
  margin-bottom: 15px;
`;

export const Label = styled.label`
  display: block;
  margin-bottom: 5px;
  font-weight: 600;
  color: #555;
`;

export const Input = styled.input`
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
  
  &:focus {
    outline: none;
    border-color: #007acc;
    box-shadow: 0 0 0 2px rgba(0, 122, 204, 0.2);
  }
  
  &:disabled {
    background-color: #f5f5f5;
    color: #666;
  }
`;

export const Select = styled.select`
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
  background-color: white;
  
  &:focus {
    outline: none;
    border-color: #007acc;
    box-shadow: 0 0 0 2px rgba(0, 122, 204, 0.2);
  }
  
  &:disabled {
    background-color: #f5f5f5;
    color: #666;
  }
`;

export const TextArea = styled.textarea`
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
  font-family: 'Courier New', monospace;
  resize: vertical;
  min-height: 100px;
  box-sizing: border-box;
  
  &:focus {
    outline: none;
    border-color: #007acc;
    box-shadow: 0 0 0 2px rgba(0, 122, 204, 0.2);
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
  background-color: white;
  padding: 15px;
  border: 1px solid #ddd;
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
  background-color: white;
  padding: 20px;
  border: 2px solid #ddd;
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
  background-color: #f8f9fa;
  padding: 15px;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  margin-left: 20px;
`;

export const PreviewBox = styled.div`
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  padding: 15px;
  max-height: 400px;
  overflow-y: auto;
  
  pre {
    margin: 0;
    font-family: 'Courier New', monospace;
    font-size: 12px;
    white-space: pre-wrap;
    word-wrap: break-word;
  }
`;

export const ActionButtons = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
  padding: 20px 0;
  border-top: 1px solid #e0e0e0;
  margin-top: 20px;
`;