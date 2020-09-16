import React, { useContext } from 'react';
import { SocketContext } from '../providers/socket.provider';
import { DeadManButton } from './dead-man-button';

export const TestComponent: React.FC = () => {
  const { connected } = useContext(SocketContext);

  return (
    <DeadManButton
      disabled={!connected}
    >
      Test!
    </DeadManButton>
  );
};
