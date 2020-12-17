import React, { useContext } from 'react';
import classNames from 'classnames';

import { Modal, ModalProps } from '../modal';

import { LocalSettingsContext } from '../../providers/local-settings.provider';
import { Checkbox } from '../checkbox';
import { AN_APP_MODE } from '../../const/app-mode.constant';

export type SettingsModalProps = ModalProps & {
  appMode: AN_APP_MODE,
}

export const SettingsModal: React.FC<SettingsModalProps> = (props) => {
  const { className } = props;

  const {
    showStatsOverlay,
    setShowStatsOverlay,
  } = useContext(LocalSettingsContext);

  return (
    <Modal
      {...props}
      className={classNames('settings', className)}
      headerComponent={<h1>Settings</h1>}
    >
      <Checkbox
        label="Show Stats Overlay"
        id="show_stats_overlay"
        checked={showStatsOverlay}
        onChange={setShowStatsOverlay}
      />
    </Modal>
  );
};
