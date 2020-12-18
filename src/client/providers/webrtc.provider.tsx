/* eslint-disable no-console */
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import Peer from 'peerjs';
import { A_WEBRTC_CLIENT_TYPE, WEBRTC_CLIENT_TYPE } from '../const/webrtc-client-type.constant';
import { A_WEBRTC_STATE, WEBRTC_STATE } from '../const/webrtc-state.constant';
import { SocketContext } from './socket.provider';
import { SOCKET_CLIENT_MESSAGE } from '../../shared/constants/socket-client-message.const';
import { TelemetryContext } from './telemetry.provider';

type WebRTCContext = {
  webRTCState: A_WEBRTC_STATE,
  clientType: A_WEBRTC_CLIENT_TYPE,
  devicesAvailable: boolean,
  webRTCMessage: string,
  peerId: null | string,
  authoriseMediaCapture: () => void,
  setSmallCameraElement: (element: HTMLVideoElement | null) => void,
  setLargeCameraElement: (element: HTMLVideoElement | null) => void,
  reconnectPeer: () => void,
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
  const [peer, setPeer] = useState<null | Peer>(null);
  const connection = useRef<null | Peer.DataConnection>(null);
  const call = useRef<null | Peer.MediaConnection>(null);

  const { connected: socketConnected, sendMessage } = useContext(SocketContext);
  const { network, isLocalConnection } = useContext(TelemetryContext);

  /**
   * Fired when the peer connection encounters an error
   */
  const handlePeerError = useCallback((err: Error) => {
    console.error('Peer error: ', err);
    setWebRTCState(WEBRTC_STATE.DEVICE_ERROR);
    setWebRTCMessage(err.message);
  }, []);

  /**
   * Fired when the peer connection is opened
   */
  const handlePeerOpen = useCallback((id: string) => {
    console.log('Peer connection opened.');
    setPeerId(id);
    setWebRTCState(WEBRTC_STATE.READY);
    setWebRTCMessage(clientType === WEBRTC_CLIENT_TYPE.CALLER ? 'Ready to call TPBot' : 'Ready to receive incoming call');
  }, [clientType]);

  /**
   * Fired when the peer has an incoming connection
   */
  const handlePeerConnection = useCallback((newConnection: Peer.DataConnection) => {
    console.log('Incoming Connection...');
    connection.current = newConnection;
    setWebRTCState(WEBRTC_STATE.CONNECTED);
  }, []);

  /**
   * Fired when the peer is disconnected from the server
   */
  const handlePeerDisconnected = useCallback(() => {
    console.log('Peer disconnected.');
    connection.current = null;
    setPeerId(null);
    if (webRTCState !== WEBRTC_STATE.DEVICE_ERROR) {
      setWebRTCState(WEBRTC_STATE.READY);
    }
    setPeer(null);
  }, [webRTCState]);

  /**
   * Fired when a call is incoming
   */
  const handlePeerCall = useCallback((mediaConnection: Peer.MediaConnection) => {
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
  }, []);

  /**
   * Create the peer connection to the server
   */
  const createPeer = useCallback(() => {
    console.log(`Creating peer as "${clientType}"`);
    setPeer(new Peer({
      host: window.location.hostname,
      port: (isLocalConnection ? network.internal.webrtcPort : network.public.webrtcPort) ?? undefined,
      path: '/',
      config: {
        peerIdentity: clientType,
        iceServers: [
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      },
    }));
    // TODO: handle socket disconnection
  }, [clientType, isLocalConnection, network.internal.webrtcPort, network.public.webrtcPort]);

  /**
   * Bind / Unbind the appropriate event handlers to the peer js instance
   */
  useEffect(() => {
    if (peer) {
      // On any kind of error - set the WEBRTCState to Error
      peer.on('error', handlePeerError);

      // When the peer connection to the server is opened
      peer.on('open', handlePeerOpen);

      // When a data connection is established
      peer.on('connection', handlePeerConnection);

      // When a connection is disconnected
      peer.on('disconnected', handlePeerDisconnected);

      // When a call is incoming
      peer.on('call', handlePeerCall);
    }

    return () => {
      if (peer) {
        peer.off('error', handlePeerError);
        peer.off('open', handlePeerOpen);
        peer.off('connection', handlePeerConnection);
        peer.off('disconnected', handlePeerDisconnected);
        peer.off('call', handlePeerCall);
      }
    };
  }, [peer, handlePeerError, handlePeerOpen, handlePeerDisconnected, handlePeerConnection, handlePeerCall]);

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
      setWebRTCState(WEBRTC_STATE.DEVICE_ERROR);
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
    if (
      // In there is no active peer client
      !peer
      // and the primary webSocket is connected
      && socketConnected
      // and the capture devices are available
      && (webRTCState === WEBRTC_STATE.DEVICES_AVAILABLE)
      // and we have information about the network we're connecting to
      && ((isLocalConnection && network.internal.webrtcPort) || (!isLocalConnection && network.public.webrtcPort))
    ) {
      // Create a new peer connnection
      createPeer();
    }
  }, [webRTCState, peer, createPeer, socketConnected, isLocalConnection, network]);

  /**
   * Report the Peer ID to the server so that connecting clients know who to connect to
   */
  useEffect(() => {
    if (peer) {
      console.log(`Reporting change of peerId for clientType "${clientType}" to "${peerId}"`);
      sendMessage({ type: SOCKET_CLIENT_MESSAGE.SET_PEER_ID, payload: { clientType, peerId } });
    }
  }, [clientType, peerId, peer, sendMessage]);

  /**
   * Call the host
   */
  const doCallHost = useCallback(() => {
    if (peer && localStream.current) {
      console.log('Calling the receiver...');
      setWebRTCState(WEBRTC_STATE.CALLING);
      // Connect to the inverse ID depending on this instance clientType
      call.current = peer.call(WEBRTC_CLIENT_TYPE.RECEIVER, localStream.current);
      call.current.on('stream', (stream) => {
        remoteStream.current = stream;
        setWebRTCState(WEBRTC_STATE.CONNECTED);
      });
      call.current.on('close', () => {
        setWebRTCState(WEBRTC_STATE.READY);
      });
    } else if (!peer) {
      console.error('Cannot start a call if the peer is not connected.');
      setWebRTCState(WEBRTC_STATE.DEVICE_ERROR);
      setWebRTCMessage('Cannot start a call if the peer is not connected.');
    } else if (!localStream.current) {
      console.error('Cannot start a call if there is no local stream.');
      setWebRTCState(WEBRTC_STATE.DEVICE_ERROR);
      setWebRTCMessage('Cannot start a call if there is no local stream.');
    }
  }, [peer]);

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
   * Attempt to re-connect the peer when the connection has dropped for some reason
   */
  const doReconnectPeer = useCallback(() => {
    if (!peer && webRTCState === WEBRTC_STATE.PEER_ERROR) {
      createPeer();
    }
  }, [createPeer, peer, webRTCState]);

  /**
   * Render
   */
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
      reconnectPeer: doReconnectPeer,
      callHost: doCallHost,
      endCall: doEndCall,
    }}
    >
      {children}
    </WebRTCContext.Provider>
  );
};
