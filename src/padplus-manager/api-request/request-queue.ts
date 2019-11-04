interface FuncObj {
  func: () => any,
  resolve: (data: any) => void,
  reject: (e: any) => void,
}

export class RequestQueue {

  private static funcQueue: FuncObj[] = []
  private static running: boolean = false

  public static async exec (func: () => any) {
    return new Promise<any>(async (resolve, reject) => {
      this.funcQueue.push({ func, reject, resolve })
      if (!this.running) {
        this.running = true
        await this.execNext()
      }
    })
  }

  private static async execNext () {
    const funcObj = this.funcQueue.shift()
    if (!funcObj) {
      throw new Error(`Can not get funcObj from funcQueue.`)
    }
    try {
      const result = await funcObj.func()
      funcObj.resolve(result)
    } catch (e) {
      funcObj.reject(e)
    }
    if (this.funcQueue.length > 0) {
      await this.execNext()
    } else {
      this.running = false
    }
  }

}
