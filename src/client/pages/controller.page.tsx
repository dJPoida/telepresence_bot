import React from 'react';
import { IosScrollFix } from '../components/ios-scroll-fix';
import { ControllerInterface } from '../components/controller-interface';
import { SocketProvider } from '../providers/socket.provider';
import { TelemetryProvider } from '../providers/telemetry.provider';
import { LocalSettingsProvider } from '../providers/local-settings.provider';
import { WebRTCProvider } from '../providers/webrtc.provider';
import { WEBRTC_CLIENT_TYPE } from '../const/webrtc-client-type.constant';
import { ErrorBoundary } from '../components/error-boundary';

export const ControllerPage: React.FC = () => (
  <ErrorBoundary>
    <LocalSettingsProvider>
      <SocketProvider>
        <TelemetryProvider>
          <WebRTCProvider clientType={WEBRTC_CLIENT_TYPE.CALLER}>
            <IosScrollFix>
              <ControllerInterface />
            </IosScrollFix>
          </WebRTCProvider>
        </TelemetryProvider>
      </SocketProvider>
    </LocalSettingsProvider>
  </ErrorBoundary>
);
