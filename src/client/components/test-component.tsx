import React, { useContext } from 'react';
import { SocketContext } from '../providers/socket.provider';
import { DeadManButton } from './dead-man-button';
import { Joystick } from './joystick';

export const TestComponent: React.FC = () => {
  const { connected } = useContext(SocketContext);

  return (
    <>
      <DeadManButton
        disabled={!connected}
        onUpdate={() => console.log('pressing')}
        repeatRate={250}
      >
        Test!
      </DeadManButton>
      <div
        style={{
          width: '200px',
          height: '200px',
          backgroundColor: '#FF6D00',
          position: 'relative',
        }}
      >
        <Joystick
          verboseUpdate
          // onUpdate={(position) => console.log(`x: ${position.x} / y: ${position.y}`)}
        />
      </div>
    </>
  );
};
