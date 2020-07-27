import express from 'express';

export interface SendFileFn {
  (res: express.Response, filePath: string, contentType?: string): void,
}
