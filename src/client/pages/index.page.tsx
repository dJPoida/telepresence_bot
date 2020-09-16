import React from 'react';
import { TestComponent } from '../components/test-component';
import { SocketProvider } from '../providers/socket.provider';

export const IndexPage: React.FC = () => (
  <SocketProvider>
    <div>
      Index Page Working
      <TestComponent />
    </div>
  </SocketProvider>
);
