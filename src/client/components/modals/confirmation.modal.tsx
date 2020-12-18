import React, { ReactNode } from 'react';
import classNames from 'classnames';

import { Modal, ModalProps } from '../modal';

import { Button } from '../button';
import { AN_ICON, ICON } from '../../const/icon.constant';
import { Icon } from '../icon';

export type ConfirmationModalProps = ModalProps & {
  children?: ReactNode,
  title?: string,
  cancelLabel?: string,
  cancelIcon?: AN_ICON,
  confirmLabel?: string,
  confirmIcon?: AN_ICON,
  onCancel?: () => void,
  onConfirm?: () => void,
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = (props) => {
  const {
    children,
    className,
    title,
    cancelIcon,
    cancelLabel,
    confirmIcon,
    confirmLabel,
    onCancel,
    onConfirm,
    onCloseRequest,
  } = props;

  const footerComponent = (
    <>
      <Button
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        onClick={() => (onCancel ?? onCloseRequest ?? (() => {}))()}
      >
        <Icon icon={cancelIcon ?? ICON.CROSS} />
        <span>{cancelLabel ?? 'Cancel'}</span>
      </Button>
      <Button
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        onClick={() => (onConfirm ?? onCloseRequest ?? (() => {}))()}
      >
        <Icon icon={confirmIcon ?? ICON.CHECK} />
        <span>{confirmLabel ?? 'OK'}</span>
      </Button>
    </>
  );

  return (
    <Modal
      {...props}
      className={classNames('confirmation', className)}
      headerComponent={<h1>{title ?? 'Are you sure?'}</h1>}
      footerComponent={footerComponent}
    >
      {children}
    </Modal>
  );
};
