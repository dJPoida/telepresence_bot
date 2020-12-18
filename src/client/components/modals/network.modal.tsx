import React, { useContext } from 'react';
import classNames from 'classnames';

import { Icon } from '../icon';
import { Modal, ModalProps } from '../modal';

import { ICON } from '../../const/icon.constant';
import { Button } from '../button';
import { AN_APP_MODE } from '../../const/app-mode.constant';
import { TelemetryContext } from '../../providers/telemetry.provider';
import { WebRTCContext } from '../../providers/webrtc.provider';

export type NetworkModalProps = ModalProps & {
  appMode: AN_APP_MODE,
}

export const NetworkModal: React.FC<NetworkModalProps> = (props) => {
  const { className } = props;

  const { network, isLocalConnection } = useContext(TelemetryContext);
  const { peerId } = useContext(WebRTCContext);

  return (
    <Modal
      {...props}
      className={classNames('network', className)}
      headerComponent={<h1>Network</h1>}
    >
      <p>
        {`Internal Address: https://${network.internal.address}:${network.internal.httpsPort}`}
        <br />
        {`Public Address: https://${network.public.address}:${network.public.httpsPort}`}
        <br />
        {isLocalConnection ? 'Connected via local network' : 'Connected over public internet'}
        <br />
        {`PeerID: ${peerId}`}
      </p>
      <hr />
      <p>
        Download and install this CA Certificate in your devices root trust store to remedy browser trust issues.
      </p>
      <Button
        className="primary"
        onClick={() => { window.location.pathname = '/crt/tpbot.ca.crt'; }}
      >
        <Icon icon={ICON.DOWNLOAD} />
        <span>tpbot.ca.crt</span>
      </Button>
    </Modal>
  );
};
