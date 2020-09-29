import React, { useContext } from 'react';
import classNames from 'classnames';

import { Button } from '../button';
import { Icon } from '../icon';
import { Modal, ModalProps } from '../modal';

import { ICON } from '../../const/icon.constant';
import { LocalSettingsContext } from '../../providers/local-settings.provider';
import { Checkbox } from '../checkbox';

export type SettingsModalProps = ModalProps & {
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
