import React from 'react';
import classNames from 'classnames';

import { Icon } from '../icon';
import { Modal, ModalProps } from '../modal';

import { ICON } from '../../const/icon.constant';
import { Button } from '../button';

export type LinksModalProps = ModalProps & {
}

export const LinksModal: React.FC<LinksModalProps> = (props) => {
  const { className } = props;

  return (
    <Modal
      {...props}
      className={classNames('links', className)}
      headerComponent={(
        <h1>
          <Icon icon={ICON.EXTERNAL_LINK} />
          <span>Links</span>
        </h1>
)}
    >
      <Button
        className="primary"
        onClick={() => { window.location.reload(); }}
      >
        <Icon icon={ICON.REFRESH} />
        <span>Reload</span>
      </Button>
      <Button
        className="primary"
        onClick={() => { window.location.pathname = '/display'; }}
      >
        <Icon icon={ICON.TELEPRESENCE_BOT} />
        <span>Bot Display</span>
      </Button>
      <Button
        className="primary"
        onClick={() => { window.location.pathname = '/config'; }}
      >
        <Icon icon={ICON.SETTINGS} />
        <span>Device Config</span>
      </Button>
    </Modal>
  );
};
