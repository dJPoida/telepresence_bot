import React, { useContext, useState } from 'react';
import classNames from 'classnames';
import { Button } from './button';
import { Icon } from './icon';
import { ICON } from '../const/icon.constant';
import { SocketContext } from '../providers/socket.provider';
import { StatusIndicator } from './status-indicator';
import { SettingsModal } from './modals/settings.modal';
import { TelemetryContext } from '../providers/telemetry.provider';

export type MenuBarProps = {
  className?: string,
};

export const MenuBar: React.FC<MenuBarProps> = () => {
  const [isSettingsModalOpen, setSettingsModalOpen] = useState(false);
  const { connected, latency } = useContext(SocketContext);
  const {power: {battery}} = useContext(TelemetryContext);
  const displayBattery = battery ? `${battery}%` : '??%';
  const iconValue = battery ? Math.round(battery / 20) : 0;

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
      {isSettingsModalOpen && (
        <SettingsModal
          visible={isSettingsModalOpen}
          onCloseRequest={() => setSettingsModalOpen(false)}
        />
      )}
    </div>
  );
};
