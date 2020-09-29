import React from 'react';
import { IosScrollFix } from '../components/ios-scroll-fix';
import { ControllerInterface } from '../components/controller-interface';
import { SocketProvider } from '../providers/socket.provider';
import { TelemetryProvider } from '../providers/telemetry.provider';
import { LocalSettingsProvider } from '../providers/local-settings.provider';

export const ControllerPage: React.FC = () => (
  <LocalSettingsProvider>
    <SocketProvider>
      <TelemetryProvider>
        <IosScrollFix>
          <ControllerInterface />
        </IosScrollFix>
      </TelemetryProvider>
    </SocketProvider>
  </LocalSettingsProvider>
);
