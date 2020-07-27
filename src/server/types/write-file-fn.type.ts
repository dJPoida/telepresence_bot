import { PathLike, BaseEncodingOptions, Mode, OpenMode } from 'fs';

export interface WriteFileFn {
  (
    path: PathLike,
    data: any,
    options?: BaseEncodingOptions & { mode?: Mode, flag?: OpenMode } | BufferEncoding | null
  ): Promise<void>
}
