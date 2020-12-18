import React, { createRef, useContext, useEffect, useState } from 'react';
import classNames from 'classnames';
import { ICON } from '../const/icon.constant';
import { WEBRTC_CLIENT_TYPE } from '../const/webrtc-client-type.constant';
import { A_WEBRTC_STATE, WEBRTC_STATE } from '../const/webrtc-state.constant';
import { WebRTCContext } from '../providers/webrtc.provider';
import { Icon } from './icon';
import { TVStatic } from './tv-static';
import { ConfirmationModal } from './modals/confirmation.modal';
import { AN_APP_MODE, APP_MODE } from '../const/app-mode.constant';
import { LocalSettingsContext } from '../providers/local-settings.provider';
import { Button } from './button';

export type VideoContainerProps = {
  appMode: AN_APP_MODE,
};

export const VideoContainer: React.FC<VideoContainerProps> = ({
  appMode,
}) => {
  const {
    clientType,
    webRTCState,
    devicesAvailable,
    webRTCMessage,
    authoriseMediaCapture,
    setSmallCameraElement,
    setLargeCameraElement,
    callHost,
    endCall,
    reconnectPeer,
  } = useContext(WebRTCContext);

  const {
    setMicMuted,
    micMuted,
    setAudioMuted,
    audioMuted,
  } = useContext(LocalSettingsContext);

  const [isConfirmHangupModalVisible, setConfirmHangupModalVisible] = useState<boolean>(false);

  const largeVideoRef = createRef<HTMLVideoElement>();
  const smallVideoRef = createRef<HTMLVideoElement>();

  useEffect(() => {
    setLargeCameraElement(largeVideoRef.current);
  }, [largeVideoRef, setLargeCameraElement]);

  useEffect(() => {
    setSmallCameraElement(smallVideoRef.current);
  }, [setSmallCameraElement, smallVideoRef]);

  return (
    <div className="video-container">

      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video
        id="large-video"
        ref={largeVideoRef}
        autoPlay
        muted={(webRTCState !== WEBRTC_STATE.CONNECTED) || audioMuted}
        className="mx-auto d-block large-video"
      />

      <video
        id="small-video"
        ref={smallVideoRef}
        width="300"
        height="300"
        autoPlay
        muted
        className="mx-auto d-block small-video"
      />

      { !devicesAvailable && (
        <TVStatic />
      )}

      <div className="call-controls">
        {/* Mute Mic Button */}
        <Button
          square
          className={classNames(
            'call',
            {
              red: micMuted,
            },
          )}
          onClick={() => setMicMuted(!micMuted)}
        >
          <Icon icon={micMuted ? ICON.MIC_OFF : ICON.MIC} />
        </Button>

        {/* Mute Button */}
        <Button
          square
          className={classNames(
            'call',
            {
              red: audioMuted,
            },
          )}
          onClick={() => setAudioMuted(!audioMuted)}
        >
          <Icon icon={audioMuted ? ICON.VOLUME_OFF : ICON.VOLUME_UP} />
        </Button>

        {/* Hangup Button */}
        {appMode === APP_MODE.CONTROLLER && (
          <Button
            square
            className={
              classNames(
                'call',
                {
                  red: ([WEBRTC_STATE.CALLING, WEBRTC_STATE.CONNECTED] as A_WEBRTC_STATE[]).includes(webRTCState),
                },
              )
            }
            disabled={!([WEBRTC_STATE.CALLING, WEBRTC_STATE.CONNECTED] as A_WEBRTC_STATE[]).includes(webRTCState)}
            onClick={() => { setConfirmHangupModalVisible(!isConfirmHangupModalVisible); }}
          >
            <Icon icon={ICON.CALL_END} />
          </Button>
        )}
      </div>

      <div className="overlay-wrapper">
        {/* Capture devices could not be initialised */}
        { (webRTCState === WEBRTC_STATE.DEVICE_ERROR) && (
          <div className="message error">
            <span>{webRTCMessage}</span>
            <Button
              onClick={authoriseMediaCapture}
            >
              Retry
            </Button>
          </div>
        )}

        {/* Peer connection has failed for some reason */}
        { (webRTCState === WEBRTC_STATE.PEER_ERROR) && (
          <div className="message error">
            <span>{webRTCMessage}</span>
            <Button
              onClick={reconnectPeer}
            >
              Retry
            </Button>
          </div>
        )}

        {/* WEBRTC Call Failed or Disconnected */}
        { (webRTCState === WEBRTC_STATE.CALL_ERROR) && (
          <div className="message error">
            <span>{webRTCMessage}</span>
            <Button
              onClick={callHost}
            >
              Retry
            </Button>
          </div>
        )}

        {/* Call Host */}
        { ((clientType === WEBRTC_CLIENT_TYPE.CALLER) && (webRTCState === WEBRTC_STATE.READY)) && (
          <div className="message">
            <span>Everything appears ready to go.</span>
            <Button
              onClick={callHost}
            >
              <Icon icon={ICON.CALL} />
              <span>Call TP Bot</span>
            </Button>
          </div>
        )}

        {/* Waiting for TP Bot */}
        { ((clientType === WEBRTC_CLIENT_TYPE.CALLER) && (webRTCState === WEBRTC_STATE.NO_REMOTE_AVAILABLE)) && (
          <div className="message">
            <span>Searching for the Telepresence Bot...</span>
          </div>
        )}

        {/* Calling */}
        { ((clientType === WEBRTC_CLIENT_TYPE.CALLER) && (webRTCState === WEBRTC_STATE.CALLING)) && (
          <div className="message">
            <span>Calling...</span>
          </div>
        )}

      </div>

      {isConfirmHangupModalVisible && (
        <ConfirmationModal
          visible={isConfirmHangupModalVisible}
          onCloseRequest={() => setConfirmHangupModalVisible(false)}
          onConfirm={() => { setConfirmHangupModalVisible(false); endCall(); }}
          confirmIcon={ICON.CALL_END}
          confirmLabel="End Call"
        >
          <p>
            Are you sure you want to hang up?
          </p>
        </ConfirmationModal>
      )}

    </div>
  );
};
