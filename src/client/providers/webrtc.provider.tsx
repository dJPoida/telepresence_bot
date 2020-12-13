/* eslint-disable no-console */
import React, { createContext, useCallback, useEffect, useRef, useState } from 'react';
import Peer from 'peerjs';
import { A_WEBRTC_CLIENT_TYPE, WEBRTC_CLIENT_TYPE } from '../const/webrtc-client-type.constant';
import { A_WEBRTC_STATE, WEBRTC_STATE } from '../const/webrtc-state.constant';
import { global } from '../const/global.constant';

type WebRTCContext = {
  webRTCState: A_WEBRTC_STATE,
  clientType: A_WEBRTC_CLIENT_TYPE,
  devicesAvailable: boolean,
  webRTCMessage: string,
  peerId: null | string,
  authoriseMediaCapture: () => void,
  setSmallCameraElement: (element: HTMLVideoElement | null) => void,
  setLargeCameraElement: (element: HTMLVideoElement | null) => void,
  callHost: () => void,
  endCall: () => void,
};

export const WebRTCContext = createContext<WebRTCContext>(null as never);

export type WebRTCProviderProps = {
  clientType: A_WEBRTC_CLIENT_TYPE,
}

/**
 * @description
 * Basically wraps the usermedia functions and peerjs functionality
 */
export const WebRTCProvider: React.FC<WebRTCProviderProps> = function WebRTCProvider({ clientType, children }) {
  const [webRTCState, setWebRTCState] = useState<A_WEBRTC_STATE>(WEBRTC_STATE.INITIALISING);
  const [devicesAvailable, setDevicesAvailable] = useState(false);
  const [webRTCMessage, setWebRTCMessage] = useState('Initialising...');
  const [peerId, setPeerId] = useState<null | string>(null);
  const largeCameraElement = useRef<null | HTMLVideoElement>(null);
  const smallCameraElement = useRef<null | HTMLVideoElement>(null);
  const remoteStream = useRef<null | MediaStream>(null);
  const localStream = useRef<null | MediaStream>(null);
  const peer = useRef<null | Peer>(null);
  const connection = useRef<null | Peer.DataConnection>(null);
  const call = useRef<null | Peer.MediaConnection>(null);

  /**
   * Call the host
   */
  const doCallHost = useCallback(() => {
    if (peer.current && localStream.current) {
      console.log('Calling the receiver...');
      setWebRTCState(WEBRTC_STATE.CALLING);
      // Connect to the inverse ID depending on this instance clientType
      call.current = peer.current.call(WEBRTC_CLIENT_TYPE.RECEIVER, localStream.current);
      call.current.on('stream', (stream) => {
        remoteStream.current = stream;
        setWebRTCState(WEBRTC_STATE.CONNECTED);
      });
      call.current.on('close', () => {
        setWebRTCState(WEBRTC_STATE.READY);
      });
    } else if (!peer.current) {
      console.error('Cannot start a call if the peer is not connected.');
      setWebRTCState(WEBRTC_STATE.ERROR);
      setWebRTCMessage('Cannot start a call if the peer is not connected.');
    } else if (!localStream.current) {
      console.error('Cannot start a call if there is no local stream.');
      setWebRTCState(WEBRTC_STATE.ERROR);
      setWebRTCMessage('Cannot start a call if there is no local stream.');
    }
  }, []);

  /**
   * Terminate the connection attempt or call in progress
   */
  const doEndCall = useCallback(() => {
    if (connection.current) {
      connection.current.close();
    }
  }, []);

  /**
   * Set the reference for the small camera element
   */
  const doSetSmallCameraElement = useCallback((element: HTMLVideoElement | null) => {
    smallCameraElement.current = element;
  }, []);

  /**
   * Set the reference for the large camera element
   */
  const doSetLargeCameraElement = useCallback((element: HTMLVideoElement | null) => {
    largeCameraElement.current = element;
  }, []);

  /**
   * Create the peer connection to the server
   */
  const createPeer = useCallback(() => {
    console.log(`Creating peer as "${clientType}"`);
    peer.current = new Peer(clientType, {
      host: window.location.host,
      port: global.WEB_RTC_PORT,
      path: '/',
      config: {
        peerIdentity: clientType,
      },
    });

    // On any kind of error - set the WEBRTCState to Error
    peer.current.on('error', (err) => {
      setWebRTCState(WEBRTC_STATE.ERROR);
      setPeerId(null);
      setWebRTCMessage(err.message);
      console.error('Peer error: ', err);
    });

    // When the peer connection to the server can be established - set the WebRTCState to READY
    peer.current.on('open', () => {
      console.log('Peer connection opened.');
      setWebRTCState(WEBRTC_STATE.READY);
      setWebRTCMessage(clientType === WEBRTC_CLIENT_TYPE.CALLER ? 'Ready to call TPBot' : 'Ready to receive incoming call');
    });

    // When a call is established - set the WebRTCState to CONNECTED
    peer.current.on('connection', (newConnection) => {
      console.log('Incoming Connection...');
      connection.current = newConnection;
      setPeerId(newConnection.peer);
      setWebRTCState(WEBRTC_STATE.CONNECTED);
    });

    // When a call is disconnected, reset the connection state to READY
    peer.current.on('disconnected', () => {
      console.log('Peer disconnected.');
      connection.current = null;
      setPeerId(null);
      setWebRTCState(WEBRTC_STATE.READY);
    });

    // When a call is incoming
    peer.current.on('call', (mediaConnection: Peer.MediaConnection) => {
      console.log('Call incoming...');

      // Only answer the call if there is a local stream
      if (localStream.current) {
        mediaConnection.answer(localStream.current);
        console.log('Answering call');

        // Receive data
        mediaConnection.on('stream', (stream) => {
          console.log('Remote stream received');
          // Store a global reference of the other user stream
          remoteStream.current = stream;
          setWebRTCState(WEBRTC_STATE.CONNECTED);
        });
      }
    });
  }, [clientType]);

  /**
   * If devices become available and the camera elements have been set, assign the feed
   * to the HTMLVideoElements
   */
  useEffect(() => {
    // Connected to remote host and there is a remote stream
    if (largeCameraElement.current && remoteStream.current && (webRTCState === WEBRTC_STATE.CONNECTED)) {
      largeCameraElement.current.srcObject = remoteStream.current;
    }
    // Not connected to the remote host and there is a local stream
    else if (largeCameraElement.current && localStream.current && (webRTCState !== WEBRTC_STATE.CONNECTED)) {
      largeCameraElement.current.srcObject = localStream.current;
    }
    // There is no local stream
    else if (largeCameraElement.current && !localStream.current) {
      largeCameraElement.current.srcObject = null;
    }

    // Connected to the remote host and there is a local stream
    if (smallCameraElement.current && localStream.current && (webRTCState === WEBRTC_STATE.CONNECTED)) {
      smallCameraElement.current.srcObject = localStream.current;
    }
    // There is no local stream
    else if (smallCameraElement.current && !localStream.current) {
      smallCameraElement.current.srcObject = null;
    }
  }, [devicesAvailable, webRTCState, localStream, remoteStream, smallCameraElement, largeCameraElement]);

  /**
   * Request the use of the video and audio capture devices
   */
  const authoriseMediaCapture = useCallback(async () => {
    try {
      localStream.current = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
      });
      setDevicesAvailable(true);
      setWebRTCState(WEBRTC_STATE.DEVICES_AVAILABLE);
    } catch (error) {
      console.error('Failed to authorise use of the webcam and/or microphone!', error);
      setWebRTCMessage(`Failed to authorise use of the webcam and/or microphone!\n${error.message}`);
      setDevicesAvailable(false);
      setWebRTCState(WEBRTC_STATE.ERROR);
    }
  }, []);

  /**
   * When the component is mounted, authorise the use of the user's local media capture devices
   */
  useEffect(() => {
    authoriseMediaCapture();
  }, [authoriseMediaCapture]);

  /**
   * When the devices are available and the peer connection has not been established,
   * attempt to connect a peerjs connection to the host
   */
  useEffect(() => {
    // If webRTC is ready for a connection, start a peerjs connection
    if ((webRTCState === WEBRTC_STATE.DEVICES_AVAILABLE) && !peer.current) {
      createPeer();
    }
  }, [webRTCState, peer, createPeer]);

  return (
    <WebRTCContext.Provider value={{
      webRTCState,
      clientType,
      devicesAvailable,
      webRTCMessage,
      peerId,
      authoriseMediaCapture,
      setSmallCameraElement: doSetSmallCameraElement,
      setLargeCameraElement: doSetLargeCameraElement,
      callHost: doCallHost,
      endCall: doEndCall,
    }}
    >
      {children}
    </WebRTCContext.Provider>
  );
};
