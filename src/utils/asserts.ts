export function assertBoolean(bool: boolean, error: string): void {
  if (!bool) {
    throw new Error(error);
  }
}
