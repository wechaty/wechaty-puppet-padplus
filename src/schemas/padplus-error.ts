import { PadplusErrorType } from './padplus-enums'

export abstract class PadplusError extends Error {

  public readonly type: PadplusErrorType

  constructor (
    type: PadplusErrorType,
    message?: string,
  ) {
    super()
    this.type = type
    this.message = message || ''
  }

  public toString (): string {
    return `PADPLUS_ERROR ${this.toSubString()}`
  }

  protected abstract toSubString (): string

}
