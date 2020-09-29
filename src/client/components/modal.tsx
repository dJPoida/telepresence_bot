import React, { ReactNode } from 'react';
import ReactDOM from 'react-dom';
import classNames from 'classnames';

export type ModalProps = {
  className?: string,
  visible?: boolean,
  headerComponent?: ReactNode,
  footerComponent?: ReactNode,
  onCloseRequest?: () => void,
}

const portalContainer = document.getElementById('portal_root')!;
if (!portalContainer) throw new Error('Could not locate the "portal_root" DOM node!');

export const Modal: React.FC<ModalProps> = ({
  children,
  visible,
  className,
  headerComponent,
  footerComponent,
  onCloseRequest,
}) => (
  ReactDOM.createPortal(
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events
    <div
      className={classNames('modal', className, { visible: visible ?? true })}
      onClick={() => { if (onCloseRequest) { onCloseRequest(); } }}
    >
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */}
      <div
        className="modal-panel"
        onClick={(e) => { e.stopPropagation(); }}
      >
        {headerComponent && (
          <div className="modal-header">
            {headerComponent}
          </div>
        )}

        <div className="modal-body">
          {children}
        </div>

        {footerComponent && (
          <div className="modal-footer">
            {footerComponent}
          </div>
        )}
      </div>
    </div>,
    portalContainer,
  )
);
