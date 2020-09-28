import React from 'react';
import { AN_ICON } from '../const/icon.constant';

export type IconProps = {
  icon: AN_ICON,
};

export const Icon:React.FC<IconProps> = ({ icon }) => (
  <i className={`tbp-icon tpb-icon-${icon}`} />
);
