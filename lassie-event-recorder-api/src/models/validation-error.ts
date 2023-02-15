export class ValidationError {
  constructor(readonly message: string, readonly details?: Record<string, any>) {}
}