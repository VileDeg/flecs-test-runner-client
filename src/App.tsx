import { useState, useEffect } from 'react'

import { FlecsConnectionProvider } from "./common/flecsConnection/flecsConnectionProvider.tsx";
import { ToastProvider } from "@ui/toast/toastProvider.tsx";

import {LandingPage} from './components/pages/landingPage/landingPage.tsx'
import {ResultsPage} from './components/pages/resultsPage/resultsPage.tsx'
import {TestBuilder} from '@pages/builderPage/builderPage.tsx'
import { type TestBuilderPersistedState } from '@hooks/useTestBuilderState.ts';

import { useFlecsConnection } from "./common/flecsConnection/useFlecsConnection.ts";

import './App.css'  

import { 
  TopBar, 
  TopBarLeft, 
  TopBarRight, 
  AppTitle, 
  ConnectionBadge, 
  NavButton, 
  CenteredContent, 
  MainContent, 
  Header,
  StatusBar 
} from './styles'
import { FLECS_PORT } from './common/constants.ts'

// Main App Component
export const App = () => {
  return (
    <FlecsConnectionProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </FlecsConnectionProvider>
  );
}

// App content with connection context
const AppContent = () => {
  const [currentPage, setCurrentPage] = useState<'landing' | 'results' | 'builder'>('builder');
  
  // Persist TestBuilder state with localStorage
  const [testBuilderState, setTestBuilderState] = useState<TestBuilderPersistedState>(() => {
    // Load from localStorage on initial mount
    const saved = localStorage.getItem('testBuilderState');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved test builder state:', e);
      }
    }
    // Default state if nothing saved
    return {
      testName: "",
      systems: [],
      initialEntities: [],
      expectedEntities: [],
      selectedModules: []
    };
  });
  
  const { status } = useFlecsConnection();
  
  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('testBuilderState', JSON.stringify(testBuilderState));
  }, [testBuilderState]);
  
  // Comes from LandingPage
  const onTestsUploaded = () => {
    setCurrentPage('results'); // Automatically switch to results page after tests are uploaded
  };

  // Navigation functions
  const goToLandingPage = () => {
    setCurrentPage('landing');
  };

  const goToResultsPage = () => {
    setCurrentPage('results');
  };

  const goToBuilderPage = () => {
    setCurrentPage('builder');
  };

  // Render the top bar when connected
  const renderTopBar = () => (
    <TopBar>
      <TopBarLeft>
        <AppTitle>Unit Test Runner</AppTitle>
        <ConnectionBadge $status={status}>
          {status === "Connected" && "✅ Connected"}
          {(status === "Connecting" || status === "RetryConnecting") && "🔄 Connecting..."}
          {status === "Disconnected" && "❌ Disconnected"}
        </ConnectionBadge>
      </TopBarLeft>
      <TopBarRight>
        <NavButton 
          $active={currentPage === 'results'} 
          onClick={goToResultsPage}
        >
          View Results
        </NavButton>
        <NavButton 
          $active={currentPage === 'builder'} 
          onClick={goToBuilderPage}
        >
          Test Builder
        </NavButton>
        <NavButton 
          $active={currentPage === 'landing'} 
          onClick={goToLandingPage}
        >
          Upload Tests
        </NavButton>
      </TopBarRight>
    </TopBar>
  );

  // Render centered content when not connected
  const renderCenteredContent = () => (
    <CenteredContent>
      <Header>Unit Test Runner</Header>
      <StatusBar $status={status}>
        {(status === "Connecting" || status === "RetryConnecting") 
            && `Trying to connect to port ${FLECS_PORT}...`}
        {status === "Connected" && `✅ Connected to port ${FLECS_PORT}`}
        {status === "Disconnected" && "❌ Connection failed"}
      </StatusBar>
    </CenteredContent>
  );

  return (
    <div style={{ display: "block" }}>
      <div>
        {status === "Connected" ? (
          <>
            {renderTopBar()}
            <MainContent>
              {currentPage === 'builder' ? (
                <TestBuilder 
                  onTestCreated={onTestsUploaded}
                  persistedState={testBuilderState}
                  onStateChange={setTestBuilderState}
                />
              ) : currentPage === 'landing' ? (
                <LandingPage onTestsUploaded={onTestsUploaded} />
              ) : (
                <ResultsPage />
              )}
            </MainContent>
          </>
        ) : (
          renderCenteredContent()
        )}
      </div>
    </div>
  );
}



