import React from 'react';
import { DisplayInterface } from '../components/display-interface';
import { ErrorBoundary } from '../components/error-boundary';
import { IosScrollFix } from '../components/ios-scroll-fix';
import { WEBRTC_CLIENT_TYPE } from '../const/webrtc-client-type.constant';
import { LocalSettingsProvider } from '../providers/local-settings.provider';
import { SocketProvider } from '../providers/socket.provider';
import { TelemetryProvider } from '../providers/telemetry.provider';
import { WebRTCProvider } from '../providers/webrtc.provider';

export const DisplayPage:React.FC = () => (
  <ErrorBoundary>
    <LocalSettingsProvider>
      <SocketProvider>
        <TelemetryProvider>
          <WebRTCProvider clientType={WEBRTC_CLIENT_TYPE.RECEIVER}>
            <IosScrollFix>
              <DisplayInterface />
            </IosScrollFix>
          </WebRTCProvider>
        </TelemetryProvider>
      </SocketProvider>
    </LocalSettingsProvider>
  </ErrorBoundary>
);
