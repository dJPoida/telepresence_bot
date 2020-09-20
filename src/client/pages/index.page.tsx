import React from 'react';
import { IosScrollFix } from '../components/ios-scroll-fix';
import { ControlPanel } from '../components/control-panel';
import { SocketProvider } from '../providers/socket.provider';

export const IndexPage: React.FC = () => (
  <SocketProvider>
    <IosScrollFix>
      <ControlPanel />
    </IosScrollFix>
  </SocketProvider>
);
