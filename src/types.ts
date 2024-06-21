/**
 * Action function signature.
 */
export type Action = (options: ActionOptions) => Promise<any>

/**
 * The available arguments to initialize an action.
 */
export enum ActionArgs {
  event = 'event',
  retries = 'retries',
  runId = 'runId',
}

/**
 * The available options to initialize an action.
 */
export interface ActionOptions extends Record<keyof ActionArgs, any> {
  event: ActionEvent
  retries: number
  runId: string
}

/**
 * The available events to trigger an action.
 */
export enum ActionEvent {
  local_dispatch = 'local_dispatch',
  repository_dispatch = 'repository_dispatch',
  schedule = 'schedule',
  test = 'test',
  workflow_dispatch = 'workflow_dispatch',
}

/**
 * The available action exit statuses.
 */
export enum ActionStatus {
  success = 'Success',
  failed = 'Failed',
  skipped = 'Skipped',
}

/**
 * Available parameters to log an action run.
 */
export interface ActionPayload {
  date?: string
  status?: ActionStatus
  event?: string
  runId?: string
  message?: string
  errors?: string
}

/**
 * Record of an action run.
 */
export interface ActionLog {
  Date: string
  Status: ActionStatus
  Source: string
  Event?: string
  'GitHub Run'?: string
  Message?: string
  Errors?: string
  Notes?: string
}

/**
 * Base object interface.
 */
export interface BaseObject extends Record<string, any> {}

/**
 * The available request methods.
 */
export enum RequestMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
}

/**
 * Array of `N` elements with pre-defined length.
 */
export type TupleOf<T, N extends number, R extends unknown[]> = R['length'] extends N ? R : TupleOf<T, N, [T, ...R]>

/**
 * Array of `T` elements with pre-defined length.
 */
export type Tuple<T, N extends number> = N extends N ? (number extends N ? T[] : TupleOf<T, N, []>) : never
