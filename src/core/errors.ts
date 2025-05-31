/**
 * SportMonks API Error class
 */
export class SportMonksError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public apiMessage?: string,
    public errors?: any
  ) {
    super(message);
    this.name = 'SportMonksError';
  }
}
