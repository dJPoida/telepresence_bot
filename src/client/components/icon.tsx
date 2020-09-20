import React from 'react';

export type IconProps = {
  icon: string,
};

export const Icon:React.FC<IconProps> = ({ icon }) => (
  <i className={`tbp-icon tpb-icon-${icon}`} />
);
