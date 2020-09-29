import React, { useContext, useState } from 'react';
import classNames from 'classnames';
import { Button } from './button';
import { Icon } from './icon';
import { ICON } from '../const/icon.constant';
import { SocketContext } from '../providers/socket.provider';
import { StatusIndicator } from './status-indicator';
import { SettingsModal } from './modals/settings.modal';

export type MenuBarProps = {
  className?: string,
};

export const MenuBar: React.FC<MenuBarProps> = () => {
  const [isSettingsModalOpen, setSettingsModalOpen] = useState(false);
  const { connected } = useContext(SocketContext);

  return (
    <div className="menu-bar">
      <div className="menu-button-wrapper">
        <Button
          active={isSettingsModalOpen}
          className="primary"
          square
          onClick={() => { setSettingsModalOpen(!isSettingsModalOpen); }}
        >
          <Icon icon={ICON.MENU_HAMBURGER} />
        </Button>
      </div>
      <div className="status-indicator-wrapper">
        <StatusIndicator
          className={classNames({
            danger: !connected,
          })}
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
      {isSettingsModalOpen && (
        <SettingsModal
          visible={isSettingsModalOpen}
          onCloseRequest={() => setSettingsModalOpen(false)}
        />
      )}
    </div>
  );
};
