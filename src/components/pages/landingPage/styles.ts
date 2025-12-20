import styled from "styled-components";

export const Container = styled.div`
  font-family: "Inter", sans-serif;
  padding: 24px;
  max-width: 800px;
  margin: 0 auto;
  text-align: center;
`;

export const ErrorBox = styled.div`
  background-color: #fdecea;
  color: #b71c1c;
  border-radius: 8px;
  padding: 10px 15px;
  margin-bottom: 16px;
  text-align: left;
  white-space: pre-line;
`;

export const TestsList = styled.ul`
  text-align: left;
  background: #f7f7f7;
  padding: 16px;
  border-radius: 8px;
  margin-top: 16px;
  li {
    margin-bottom: 8px;
  }
`;

export const RunButton = styled.button`
  background-color: #007bff;
  color: white;
  border: none;
  padding: 10px 18px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  margin-top: 16px;
  transition: background-color 0.2s;
  &:hover {
    background-color: #0056b3;
  }
`;
