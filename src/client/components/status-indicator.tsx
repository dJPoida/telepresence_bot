import React, { ReactElement } from 'react';
import classNames from 'classnames';
import { AN_ICON } from '../const/icon.constant';
import { Icon } from './icon';

export type StatusIndicatorProps<T extends string | number | symbol> = {
  className?: string,
  value: T,
  items: Record<T, string>,
  icons: Record<T, AN_ICON>,
};

export const StatusIndicator = <T extends string | number | symbol, >(props: StatusIndicatorProps<T>): ReactElement => {
  const {
    className,
    value,
    icons,
    items,
  } = props;

  return (
    <div
      className={classNames('status-indicator', className)}
    >
      {icons[value] && (
        <Icon icon={icons[value]} />
      )}
      {items[value] && (
        <span>{items[value]}</span>
      )}
    </div>
  );
};
