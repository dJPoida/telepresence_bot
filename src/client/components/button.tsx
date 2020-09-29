import React from 'react';
import classNames from 'classnames';

export type ButtonProps = {
  className?: string,
  active?: boolean,
  disabled?: boolean,
  square?: boolean,

  onClick?: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void,
};

export const Button:React.FC<ButtonProps> = ({
  active,
  children,
  className,
  disabled,
  square,
  onClick,
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
    onClick={onClick}
  >
    {children}
  </button>
);
