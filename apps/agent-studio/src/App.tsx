import React from 'react';
import { ErrorBoundary } from '@airaie/ui';
import { AgentIDEShell } from '@components/ide';

export default function App() {
  return (
    <ErrorBoundary label="Agent Studio">
      <AgentIDEShell />
    </ErrorBoundary>
  );
}
