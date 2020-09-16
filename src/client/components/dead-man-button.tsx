import React, { useContext } from 'react';
import { SocketContext } from '../providers/socket.provider';

export type DeadManButtonProps = {
  disabled?: boolean,
}

export const DeadManButton: React.FC<DeadManButtonProps> = (props) => {
  const { connected, sendCommand } = useContext(SocketContext);

  const handleMouseDown = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    event.preventDefault();
    console.log('down');
  };

  const handleMouseUp = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    event.preventDefault();
    console.log('up');
  };

  return (
    <button
      type="button"
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      {...props}
    >
      Test!
    </button>
  );
};
