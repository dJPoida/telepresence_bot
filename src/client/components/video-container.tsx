import { connected } from 'process';
import React, { createRef, useContext, useEffect } from 'react';
import { connect } from 'socket.io-client';
import { WEBRTC_CLIENT_TYPE } from '../const/webrtc-client-type.constant';
import { WEBRTC_STATE } from '../const/webrtc-state.constant';
import { WebRTCContext } from '../providers/webrtc.provider';
import { Button } from './button';
import { TVStatic } from './tv-static';

export type VideoContainerProps = {
};

export const VideoContainer: React.FC<VideoContainerProps> = () => {
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
  } = useContext(WebRTCContext);

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
        muted={webRTCState !== WEBRTC_STATE.CONNECTED}
        className="mx-auto d-block"
      />

      <video
        id="small-video"
        ref={smallVideoRef}
        width="300"
        height="300"
        autoPlay
        muted
        className="mx-auto d-block"
      />

      { !devicesAvailable && (
        <TVStatic />
      )}

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
              Call TP Bot
            </Button>
          </div>
        )}

        {/* Calling */}
        { ((clientType === WEBRTC_CLIENT_TYPE.CALLER) && (webRTCState === WEBRTC_STATE.CALLING)) && (
          <div className="message">
            <span>Calling...</span>
          </div>
        )}

      </div>

    </div>
  );
};
