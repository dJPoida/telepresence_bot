export interface ExistsFn {
  (filePath: string): Promise<boolean>,
}
