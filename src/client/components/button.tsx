import React, { forwardRef, ReactNode } from 'react';
import classNames from 'classnames';

export type ButtonProps = {
  children: ReactNode,
  className?: string,
  active?: boolean,
  disabled?: boolean,
  square?: boolean,
  noPadding?: boolean,
  noBorder?: boolean,

  onClick?: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void,
};

export type Ref = HTMLButtonElement;

export const Button = forwardRef<Ref, ButtonProps>(function Button({
  active,
  children,
  className,
  disabled,
  square,
  noPadding,
  noBorder,
  onClick,
}, ref) {
  return (
    <button
      ref={ref}
      type="button"
      className={classNames(
        'btn',
        className,
        {
          active,
          square,
          'no-padding': noPadding,
          'no-border': noBorder,
        },
      )}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
});
