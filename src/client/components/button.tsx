import React from 'react';
import classNames from 'classnames';

export type ButtonProps = {
  className?: string,
  active?: boolean,
  disabled?: boolean,
  square?: boolean,
};

export const Button:React.FC<ButtonProps> = ({
  active,
  children,
  className,
  disabled,
  square,
}) => (
  <button
    type="button"
    className={classNames(
      'btn',
      className,
      {
        active,
        square,
      },
    )}
    disabled={disabled}
  >
    {children}
  </button>
);
