import React from 'react';
import { IosScrollFix } from '../components/ios-scroll-fix';
import { TestComponent } from '../components/test-component';
import { SocketProvider } from '../providers/socket.provider';

export const IndexPage: React.FC = () => (
  <SocketProvider>
    <IosScrollFix>
      <TestComponent />
    </IosScrollFix>
  </SocketProvider>
);
