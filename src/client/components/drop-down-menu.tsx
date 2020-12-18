import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import classNames from 'classnames';
import { AN_ICON } from '../const/icon.constant';
import { Icon } from './icon';
import { XYCoordinate } from '../../shared/types/xy-coordinate.type';

export type MenuItem = {
  separator?: undefined,
  key: string,
  label: string,
  icon?: AN_ICON,
  className?: string,
  onClick?: () => unknown,
} | {
  separator: true,
  key: string,
}

export type DropDownMenuProps = {
  items: MenuItem[],
  parentElement?: HTMLElement,
  className?: string,
  open?: boolean,
  onCloseRequest?: () => void,
}

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const portalContainer = document.getElementById('portal_root')!;
if (!portalContainer) throw new Error('Could not locate the "portal_root" DOM node!');

/**
 * TODO: this currently only handles bottom left / down direction anchoring to the parent element
 */
export const DropDownMenu: React.FC<DropDownMenuProps> = ({
  parentElement,
  className,
  open,
  items,
  onCloseRequest,
}) => {
  const [offset, setOffset] = useState<XYCoordinate>({ x: 0, y: 0 });

  /**
   * When the parent element changes, set the offset
   */
  useEffect(() => {
    if (parentElement) {
      const parentElementBoundingRect = parentElement.getBoundingClientRect();
      setOffset({ x: parentElementBoundingRect.left, y: parentElementBoundingRect.bottom });
    } else {
      setOffset({ x: 0, y: 0 });
    }
  }, [parentElement]);

  return (
    <>
      {(open ?? false) && ReactDOM.createPortal(
      // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events
        <div
          className={classNames('drop-down-menu', className)}
          onClick={() => { if (onCloseRequest) { onCloseRequest(); } }}
        >
          {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */}
          <div
            className="drop-down-menu-background"
            onClick={(e) => { e.stopPropagation(); }}
            style={{
              top: `calc(${offset.y}px + (var(--universal-padding) / 2))`,
              left: `${offset.x}px`,
            }}
          >
            {items.map((item) => (
              <React.Fragment
                key={item.key}
              >
                {item.separator && (
                  <div
                    // eslint-disable-next-line react/no-array-index-key
                    className="drop-down-menu-item separator"
                  />
                )}

                {!item.separator && (
                  // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events
                  <div
                    className={classNames('drop-down-menu-item', item.className)}
                    onClick={() => {
                      if (item.onClick) { item.onClick(); }
                      if (onCloseRequest) { onCloseRequest(); }
                    }}
                  >
                    {item.icon && (
                    <Icon icon={item.icon} />
                    )}
                    <span>{item.label}</span>
                  </div>
                )}
              </React.Fragment>
            ))}

          </div>
        </div>,
        portalContainer,
      )}
    </>
  );
};
