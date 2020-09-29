import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { CLIENT_COMMAND } from '../../shared/constants/client-command.const';
import { SOCKET_SERVER_MESSAGE, SocketServerMessageMap } from '../../shared/constants/socket-server-message.const';
import { XYCoordinate } from '../../shared/types/xy-coordinate.type';
import { SocketContext } from './socket.provider';

type TelemetryContext = {
  driveInput: XYCoordinate,
  panTiltInput: XYCoordinate,
  speedInput: number,

  setDriveInput: (value: XYCoordinate) => any,
  setPanTiltInput: (value: XYCoordinate) => any,
  setSpeedInput: (value: number) => any,
};

export const TelemetryContext = createContext<TelemetryContext>(null as any);

/**
 * @description
 * Basically wraps the socket in some state management for the control inputs
 */
export const TelemetryProvider: React.FC = function TelemetryProvider({ children }) {
  const [driveInput, setDriveInput] = useState<TelemetryContext['driveInput']>({ x: 0, y: 0 });
  const [panTiltInput, setPanTiltInput] = useState<TelemetryContext['panTiltInput']>({ x: 0, y: 0 });
  const [speedInput, setSpeedInput] = useState<TelemetryContext['speedInput']>(100);

  const { connected, ws, sendCommand } = useContext(SocketContext);

  /**
   * Reset all client-side input values to their defaults
   */
  const resetInputs = useCallback(() => {
    setDriveInput({ x: 0, y: 0 });
    setPanTiltInput({ x: 0, y: 0 });
    setSpeedInput(0);
  }, [setDriveInput, setPanTiltInput, setSpeedInput]);

  /**
   * When the socket is connected to the server, setup the heartbeat to let the server
   * know that the client is alive.
   */
  useEffect(() => {
    // Respond to a full status update
    const handleBotStatusUpdate = (botStatus: SocketServerMessageMap[SOCKET_SERVER_MESSAGE['BOT_STATUS']]) => {
      setDriveInput(botStatus.drive);
      setPanTiltInput(botStatus.panTilt);
      setSpeedInput(botStatus.speed);
    };

    // Respond to a drive input status update
    const handleDriveInputStatusUpdate = ({ drive }: SocketServerMessageMap[SOCKET_SERVER_MESSAGE['DRIVE_INPUT_STATUS']]) => {
      setDriveInput(drive);
    };

    // Respond to a Pan/Tilt input status update
    const handlePanTiltInputStatusUpdate = ({ panTilt }: SocketServerMessageMap[SOCKET_SERVER_MESSAGE['PAN_TILT_INPUT_STATUS']]) => {
      setPanTiltInput(panTilt);
    };

    // Respond to a speed input status update
    const handleSpeedInputStatusUpdate = ({ speed }: SocketServerMessageMap[SOCKET_SERVER_MESSAGE['SPEED_INPUT_STATUS']]) => {
      setSpeedInput(speed);
    };

    if (!connected) {
      console.warn('No connection: resetting inputs.');
      resetInputs();
    } else {
      // Listen to incoming bot status messages
      // eslint-disable-next-line no-console
      console.log('Connected to Server');
      ws.on(SOCKET_SERVER_MESSAGE.BOT_STATUS, handleBotStatusUpdate)
        .on(SOCKET_SERVER_MESSAGE.DRIVE_INPUT_STATUS, handleDriveInputStatusUpdate)
        .on(SOCKET_SERVER_MESSAGE.PAN_TILT_INPUT_STATUS, handlePanTiltInputStatusUpdate)
        .on(SOCKET_SERVER_MESSAGE.SPEED_INPUT_STATUS, handleSpeedInputStatusUpdate);
    }

    return () => {
      // unbind socket event listeners when required
      ws.off(SOCKET_SERVER_MESSAGE.BOT_STATUS, handleBotStatusUpdate)
        .off(SOCKET_SERVER_MESSAGE.DRIVE_INPUT_STATUS, handleDriveInputStatusUpdate)
        .off(SOCKET_SERVER_MESSAGE.PAN_TILT_INPUT_STATUS, handlePanTiltInputStatusUpdate)
        .off(SOCKET_SERVER_MESSAGE.SPEED_INPUT_STATUS, handleSpeedInputStatusUpdate);
    };
  }, [ws, connected, resetInputs]);

  /**
   * Wrapper around setSpeed to invoke a message to the server
   */
  const doSetSpeed = useCallback((speed: number) => {
    if (speedInput !== speed) {
      sendCommand({ type: CLIENT_COMMAND.SET_SPEED, payload: { speed } });
      setSpeedInput(speed);
    }
  }, [setSpeedInput, sendCommand, speedInput]);

  /**
   * Wrapper around setDriveInput to invoke a message to the server
   */
  const doSetDriveInput = useCallback((drive: XYCoordinate) => {
    if (driveInput.x !== drive.x || driveInput.y !== drive.y) {
      sendCommand({ type: CLIENT_COMMAND.SET_DRIVE_INPUT, payload: { drive } });
      setDriveInput(drive);
    }
  }, [setDriveInput, sendCommand, driveInput.x, driveInput.y]);

  /**
   * Wrapper around setPanTiltInput to invoke a message to the server
   */
  const doSetPanTiltInput = useCallback((panTilt: XYCoordinate) => {
    if (panTiltInput.x !== panTilt.x || panTiltInput.y !== panTilt.y) {
      sendCommand({ type: CLIENT_COMMAND.SET_PAN_TILT_INPUT, payload: { panTilt } });
      setDriveInput(panTilt);
    }
  }, [setDriveInput, sendCommand, panTiltInput.x, panTiltInput.y]);

  return (
    <TelemetryContext.Provider value={{
      driveInput,
      panTiltInput,
      speedInput,
      setDriveInput: doSetDriveInput,
      setPanTiltInput: doSetPanTiltInput,
      setSpeedInput: doSetSpeed,
    }}
    >
      {children}
    </TelemetryContext.Provider>
  );
};
