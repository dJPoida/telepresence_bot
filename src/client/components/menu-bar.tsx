import React, { useContext, useState } from 'react';
import { Button } from './button';
import { Icon } from './icon';
import { ICON } from '../const/icon.constant';
import { SocketContext } from '../providers/socket.provider';
import { StatusIndicator } from './status-indicator';

export type MenuBarProps = {
  className?: string,
};

export const MenuBar: React.FC<MenuBarProps> = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { connected } = useContext(SocketContext);

  return (
    <div className="menu-bar">
      <div className="menu-button-wrapper">
        <Button
          active={menuOpen}
          className="primary"
          square
        >
          <Icon icon={ICON.MENU_HAMBURGER} />
        </Button>
      </div>
      <div className="status-indicator-wrapper">
        <StatusIndicator
          value={connected.toString()}
          items={{
            false: 'disconnected',
            true: 'connected',
          }}
          icons={{
            false: ICON.WIFI_OFF,
            true: ICON.WIFI,
          }}
        />
      </div>
    </div>
  );
};
