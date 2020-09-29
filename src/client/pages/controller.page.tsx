import React from 'react';
import { IosScrollFix } from '../components/ios-scroll-fix';
import { ControllerInterface } from '../components/controller-interface';
import { SocketProvider } from '../providers/socket.provider';
import { TelemetryProvider } from '../providers/telemetry.provider';

export const ControllerPage: React.FC = () => (
  <SocketProvider>
    <TelemetryProvider>
      <IosScrollFix>
        <ControllerInterface />
      </IosScrollFix>
    </TelemetryProvider>
  </SocketProvider>
);
