import React from 'react';
import classNames from 'classnames';

import { Icon } from '../icon';
import { Modal, ModalProps } from '../modal';

import { ICON } from '../../const/icon.constant';
import { Button } from '../button';
import { AN_APP_MODE, APP_MODE } from '../../const/app-mode.constant';

export type LinksModalProps = ModalProps & {
  appMode: AN_APP_MODE,
}

export const LinksModal: React.FC<LinksModalProps> = (props) => {
  const { className, appMode } = props;

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
      {(appMode !== APP_MODE.DISPLAY) && (
        <Button
          className="primary"
          onClick={() => { window.location.pathname = '/display'; }}
        >
          <Icon icon={ICON.TELEPRESENCE_BOT} />
          <span>Bot Display</span>
        </Button>
      )}
      {(appMode !== APP_MODE.CONTROLLER) && (
        <Button
          className="primary"
          onClick={() => { window.location.pathname = '/'; }}
        >
          <Icon icon={ICON.TELEPRESENCE_BOT} />
          <span>Bot Control</span>
        </Button>
      )}
      {(appMode !== APP_MODE.CONFIG) && (
        <Button
          className="primary"
          onClick={() => { window.location.pathname = '/config'; }}
        >
          <Icon icon={ICON.SETTINGS} />
          <span>Device Config</span>
        </Button>
      )}
    </Modal>
  );
};
