import React from 'react';
import classNames from 'classnames';

import { Icon } from '../icon';
import { Modal, ModalProps } from '../modal';

import { ICON } from '../../const/icon.constant';
import { Button } from '../button';
import { AN_APP_MODE } from '../../const/app-mode.constant';

export type SecurityModalProps = ModalProps & {
  appMode: AN_APP_MODE,
}

export const SecurityModal: React.FC<SecurityModalProps> = (props) => {
  const { className } = props;

  return (
    <Modal
      {...props}
      className={classNames('security', className)}
      headerComponent={<h1>Security</h1>}
    >
      <p>
        If you are having problems with the security of your browser trusting the Telepresence Bot,
        you can download, install and manually trust these certificates into your certificate root store.
      </p>
      <Button
        className="primary"
        onClick={() => { window.location.pathname = '/crt/tpbot.ca.crt'; }}
      >
        <Icon icon={ICON.DOWNLOAD} />
        <span>tpbot.ca.crt</span>
      </Button>
    </Modal>
  );
};
