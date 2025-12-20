import styled, { css } from "styled-components";

export const Header = styled.h1`
  font-size: 1.8rem;
  margin-bottom: 16px;
`;

export const StatusBar = styled.div<{ $status: string }>` 
  margin: 16px 0;
  padding: 10px 12px;
  border-radius: 8px;
  font-weight: 500;
  ${({ $status }) =>
    ($status === "Connecting" || $status === "RetryConnecting") &&
    css`
      background-color: #fff3cd;
      color: #856404;
    `}
  ${({ $status }) =>
    $status === "Connected" &&
    css`
      background-color: #d4edda;
      color: #155724;
    `}
  ${({ $status }) =>
    $status === "Disconnected" &&
    css`
      background-color: #f8d7da;
      color: #721c24;
    `}
`;
