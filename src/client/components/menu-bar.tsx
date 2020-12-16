import React, { createRef, useContext, useRef, useState } from 'react';
import classNames from 'classnames';
import { Button } from './button';
import { Icon } from './icon';
import { ICON } from '../const/icon.constant';
import { SocketContext } from '../providers/socket.provider';
import { StatusIndicator } from './status-indicator';
import { SettingsModal } from './modals/settings.modal';
import { TelemetryContext } from '../providers/telemetry.provider';
import { DropDownMenu } from './drop-down-menu';
import { LinksModal } from './modals/links.modal';

export type MenuBarProps = {
  className?: string,
};

export const MenuBar: React.FC<MenuBarProps> = () => {
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [isSettingsModalVisible, setSettingsModalVisible] = useState(false);
  const [isLinksModalVisible, setLinksModalVisible] = useState(false);
  const { connected, latency } = useContext(SocketContext);
  const { power: { battery } } = useContext(TelemetryContext);
  const displayBattery = battery ? `${battery}%` : '??%';
  const iconValue = battery ? Math.round(battery / 20) : 0;

  const menuButtonRef = useRef<null | HTMLButtonElement>(null);

  return (
    <div className="menu-bar">
      <div className="menu-button-wrapper">
        <Button
          ref={menuButtonRef}
          active={isMenuOpen}
          className="primary"
          square
          onClick={() => { setMenuOpen(!isMenuOpen); }}
        >
          <Icon icon={ICON.MENU_HAMBURGER} />
        </Button>
        <DropDownMenu
          parentElement={menuButtonRef.current ?? undefined}
          open={isMenuOpen}
          onCloseRequest={() => setMenuOpen(false)}
          items={[
            {
              key: 'settings',
              icon: ICON.SETTINGS,
              label: 'Settings',
              onClick: () => { setSettingsModalVisible(!isSettingsModalVisible); },
            },
            {
              key: 'links',
              icon: ICON.ADD_CIRCLE,
              label: 'Links',
              onClick: () => { setLinksModalVisible(!isLinksModalVisible); },
            },
          ]}
        />
      </div>
      <div className="status-indicator-wrapper">
        <StatusIndicator
          className={classNames({
            danger: iconValue === 0,
            warning: iconValue === 1 || iconValue === 2,
          })}
          value={`battery-${iconValue}`}
          items={{
            'battery-0': '0',
            'battery-1': '1',
            'battery-2': '2',
            'battery-3': '3',
            'battery-4': '4',
            'battery-5': '5',
          }}
          icons={{
            'battery-0': ICON.BATTERY_0,
            'battery-1': ICON.BATTERY_1,
            'battery-2': ICON.BATTERY_2,
            'battery-3': ICON.BATTERY_3,
            'battery-4': ICON.BATTERY_4,
            'battery-5': ICON.BATTERY_5,
          }}
          displayValue={displayBattery}
        />
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
          displayValue={latency === null ? undefined : `${latency} ms`}
        />
      </div>
      {isSettingsModalVisible && (
        <SettingsModal
          visible={isSettingsModalVisible}
          onCloseRequest={() => setSettingsModalVisible(false)}
        />
      )}
      {isLinksModalVisible && (
        <LinksModal
          visible={isLinksModalVisible}
          onCloseRequest={() => setLinksModalVisible(false)}
        />
      )}
    </div>
  );
};
