import React, { useContext, useRef, useState } from 'react';
import classNames from 'classnames';
import { Button } from './button';
import { Icon } from './icon';
import { ICON } from '../const/icon.constant';
import { SocketContext } from '../providers/socket.provider';
import { StatusIndicator } from './status-indicator';
import { SettingsModal } from './modals/settings.modal';
import { TelemetryContext } from '../providers/telemetry.provider';
import { DropDownMenu } from './drop-down-menu';
import { NetworkModal } from './modals/network.modal';
import { AN_APP_MODE, APP_MODE } from '../const/app-mode.constant';

export type MenuBarProps = {
  className?: string,
  appMode: AN_APP_MODE,
};

export const MenuBar: React.FC<MenuBarProps> = ({
  className,
  appMode,
}) => {
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [isSettingsModalVisible, setSettingsModalVisible] = useState(false);
  const [isNetworkModalVisible, setNetworkModalVisible] = useState(false);
  const { connected, latency } = useContext(SocketContext);
  const { power: { battery }, isLocalConnection } = useContext(TelemetryContext);
  const displayBattery = battery ? `${battery}%` : '??%';
  const iconValue = battery ? Math.round(battery / 20) : 0;

  const menuButtonRef = useRef<null | HTMLButtonElement>(null);

  return (
    <div className={classNames('menu-bar', className, appMode)}>
      <div className="menu-button-wrapper">
        <Button
          ref={menuButtonRef}
          active={isMenuOpen}
          className={appMode === APP_MODE.DISPLAY ? 'transparent' : 'primary'}
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
              label: 'Local Settings',
              onClick: () => { setSettingsModalVisible(!isSettingsModalVisible); },
            },
            {
              key: 'network',
              icon: ICON.LOCK,
              label: 'Network',
              onClick: () => { setNetworkModalVisible(!isNetworkModalVisible); },
            },
            {
              key: 's1',
              separator: true,
            },
            // Only display the link to the display mode if this is a local connection
            ...((appMode !== APP_MODE.DISPLAY && isLocalConnection) ? [{
              key: 'display',
              icon: ICON.TELEPRESENCE_BOT,
              label: 'Bot Display',
              onClick: () => { window.location.pathname = '/display'; },
            }] : []),
            ...(appMode !== APP_MODE.CONTROLLER ? [{
              key: 'control',
              icon: ICON.GAMEPAD,
              label: 'Bot Control',
              onClick: () => { window.location.pathname = '/'; },
            }] : []),
            // Only display the link to the config page if this is a local connection
            ...((appMode !== APP_MODE.CONFIG && isLocalConnection) ? [{
              key: 'config',
              icon: ICON.SETTINGS,
              label: 'Bot Config',
              onClick: () => { window.location.pathname = '/config'; },
            }] : []),
            {
              key: 's2',
              separator: true,
            },
            {
              key: 'reload',
              icon: ICON.REFRESH,
              label: 'Reload',
              onClick: () => { window.location.reload(); },
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
          appMode={appMode}
        />
      )}
      {isNetworkModalVisible && (
        <NetworkModal
          visible={isNetworkModalVisible}
          onCloseRequest={() => setNetworkModalVisible(false)}
          appMode={appMode}
        />
      )}
    </div>
  );
};
