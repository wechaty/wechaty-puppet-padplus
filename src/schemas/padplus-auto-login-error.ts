import { PadplusAutoLoginErrorType, PadplusErrorType } from './padplus-enums'
import { PadplusError } from './padplus-error'

export class PadplusAutoLoginError extends PadplusError {

  public readonly subType: PadplusAutoLoginErrorType

  constructor (
    subType: PadplusAutoLoginErrorType,
    message: string
  ) {
    super (
      PadplusErrorType.LOGIN,
      message,
    )
    this.subType = subType
  }

  protected toSubString () {
    return `${PadplusErrorType.LOGIN} ${this.subType} ${this.message}`
  }

}
