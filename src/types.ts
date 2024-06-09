export type ActionFunction = (...args: string[]) => Promise<void>

export interface Action extends ActionFunction {
  args?: string[]
}
