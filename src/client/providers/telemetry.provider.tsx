import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { CLIENT_COMMAND } from '../../shared/constants/client-command.const';
import { SOCKET_SERVER_MESSAGE, SocketServerMessageMap } from '../../shared/constants/socket-server-message.const';
import { Power } from '../../shared/types/power.type';
import { XYCoordinate } from '../../shared/types/xy-coordinate.type';
import { SocketContext } from './socket.provider';

type TelemetryContext = {
  initialised: boolean,
  power: Power,
  driveInput: XYCoordinate,
  panTiltInput: XYCoordinate,
  speedInput: number,

  setDriveInput: (value: XYCoordinate) => unknown,
  setPanTiltInput: (value: XYCoordinate) => unknown,
  setSpeedInput: (value: number) => unknown,
};

export const TelemetryContext = createContext<TelemetryContext>(null as never);

/**
 * @description
 * Basically wraps the socket in some state management for the control inputs
 */
export const TelemetryProvider: React.FC = function TelemetryProvider({ children }) {
  const [initialised, setInitialised] = useState(false);
  const [power, setPower] = useState<TelemetryContext['power']>({ current: null, voltage: null });
  const [driveInput, setDriveInput] = useState<TelemetryContext['driveInput']>({ x: 0, y: 0 });
  const [panTiltInput, setPanTiltInput] = useState<TelemetryContext['panTiltInput']>({ x: 0, y: 0 });
  const [speedInput, setSpeedInput] = useState<TelemetryContext['speedInput']>(100);

  const { connected, ws, sendCommand } = useContext(SocketContext);

  /**
   * Reset all client-side input values to their defaults
   */
  const resetInputs = useCallback(() => {
    setInitialised(false);
    setDriveInput({ x: 0, y: 0 });
    setPanTiltInput({ x: 0, y: 0 });
    setSpeedInput(0);
  }, [setDriveInput, setPanTiltInput, setSpeedInput]);

  /**
   * When the socket is connected to the server, setup the heartbeat to let the server
   * know that the client is alive.
   */
  useEffect(() => {
    // Respond to a full status update sent when the connection is established
    const handleBotStatusUpdate = (botStatus: SocketServerMessageMap[SOCKET_SERVER_MESSAGE['BOT_STATUS']]) => {
      setInitialised(true);

      setPower(botStatus.power);
      setDriveInput(botStatus.drive);
      setPanTiltInput(botStatus.panTilt);
      setSpeedInput(botStatus.speed);
    };

    // Respond to a drive input status update
    const handleDriveInputStatusUpdate = ({ drive: newDrive }: SocketServerMessageMap[SOCKET_SERVER_MESSAGE['DRIVE_INPUT_STATUS']]) => {
      setDriveInput(newDrive);
    };

    // Respond to a Pan/Tilt input status update
    const handlePanTiltInputStatusUpdate = ({ panTilt: newPanTilt }: SocketServerMessageMap[SOCKET_SERVER_MESSAGE['PAN_TILT_INPUT_STATUS']]) => {
      setPanTiltInput(newPanTilt);
    };

    // Respond to a speed input status update
    const handleSpeedInputStatusUpdate = ({ speed: newSpeed }: SocketServerMessageMap[SOCKET_SERVER_MESSAGE['SPEED_INPUT_STATUS']]) => {
      setSpeedInput(newSpeed);
    };

    // Respond to a power status update
    const handlePowerStatusUpdate = ({ power: newPower }: SocketServerMessageMap[SOCKET_SERVER_MESSAGE['POWER_STATUS']]) => {
      setPower(newPower);
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
        .on(SOCKET_SERVER_MESSAGE.SPEED_INPUT_STATUS, handleSpeedInputStatusUpdate)
        .on(SOCKET_SERVER_MESSAGE.POWER_STATUS, handlePowerStatusUpdate);
    }

    return () => {
      // unbind socket event listeners when required
      ws.off(SOCKET_SERVER_MESSAGE.BOT_STATUS, handleBotStatusUpdate)
        .off(SOCKET_SERVER_MESSAGE.DRIVE_INPUT_STATUS, handleDriveInputStatusUpdate)
        .off(SOCKET_SERVER_MESSAGE.PAN_TILT_INPUT_STATUS, handlePanTiltInputStatusUpdate)
        .off(SOCKET_SERVER_MESSAGE.SPEED_INPUT_STATUS, handleSpeedInputStatusUpdate)
        .off(SOCKET_SERVER_MESSAGE.POWER_STATUS, handlePowerStatusUpdate);
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
      initialised,
      power,
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
