import { NetworkStatusDto } from './network-status.dto.type';
import { Power } from './power.type';
import { XYCoordinate } from './xy-coordinate.type';

export interface BotStatusDto {
  readonly drive: XYCoordinate;
  readonly panTilt: XYCoordinate;
  readonly power: Power;
  readonly network: NetworkStatusDto;
}
