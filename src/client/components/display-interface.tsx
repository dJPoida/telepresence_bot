import React, { useContext } from 'react';
import classNames from 'classnames';
import { SocketContext } from '../providers/socket.provider';
import { VideoContainer } from './video-container';
import { MenuBar } from './menu-bar';

export const DisplayInterface: React.FC = () => {
  const { connected } = useContext(SocketContext);

  return (
    <div className={classNames('display-interface', { connected })}>
      <VideoContainer />

      <MenuBar />
    </div>
  );
};
