export type Action = (options: ActionOptions) => Promise<void>

export enum ActionArgs {
  event = 'event',
}

export interface ActionOptions extends Record<keyof ActionArgs, any> {
  event?: ActionEvent
}

export enum ActionEvent {
  local_dispatch = 'local_dispatch',
  repository_dispatch = 'repository_dispatch',
  schedule = 'schedule',
  test = 'test',
  workflow_dispatch = 'workflow_dispatch',
}

export enum ActionStatus {
  success = 'Success',
  failed = 'Failed',
  skipped = 'Skipped',
}

export interface ActionError<T = any> {
  action: string
  records?: T
  event?: string
  errors?: any
  message?: string
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
