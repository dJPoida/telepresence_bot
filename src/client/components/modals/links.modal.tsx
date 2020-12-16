import React from 'react';
import classNames from 'classnames';

import { Icon } from '../icon';
import { Modal, ModalProps } from '../modal';

import { ICON } from '../../const/icon.constant';

export type LinksModalProps = ModalProps & {
}

export const LinksModal: React.FC<LinksModalProps> = (props) => {
  const { className } = props;

  return (
    <Modal
      {...props}
      className={classNames('links', className)}
      headerComponent={<h1>Links</h1>}
    >
      <a href="/">
        <Icon icon={ICON.REFRESH} />
        <span>Reload</span>
      </a>
      <a href="/display">
        <Icon icon={ICON.TELEPRESENCE_BOT} />
        <span>Go to Display Page</span>
      </a>
      <a href="/config">
        <Icon icon={ICON.SETTINGS} />
        <span>Go to Config Page</span>
      </a>
    </Modal>
  );
};
