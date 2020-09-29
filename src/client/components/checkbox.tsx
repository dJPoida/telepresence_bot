import React from 'react';
import classNames from 'classnames';

export type CheckboxProps = {
  className?: string,
  id: string,
  name?: string,
  label?: string,
  checked: boolean,
  disabled?: boolean,
  onChange?: (value: boolean) => void,
}

export const Checkbox: React.FC<CheckboxProps> = ({
  className,
  id,
  name,
  label,
  checked,
  disabled,
  onChange,
}) => (
  <div
    className={classNames('tpb-checkbox', className)}
  >
    <input
      type="checkbox"
      id={id}
      name={name}
      checked={checked}
      disabled={disabled}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
        if (onChange) onChange(e.target.checked);
      }}
    />
    {label && (
      <label htmlFor={id}>{label}</label>
    )}
  </div>
);
