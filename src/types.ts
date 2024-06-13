export type ActionFunction = (...args: string[]) => Promise<void>

export interface Action extends ActionFunction {
  args?: string[]
}

export interface BaseObject extends Record<string, any> {
  id: string
}

export enum RequestMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
}
