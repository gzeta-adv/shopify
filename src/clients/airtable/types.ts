import { FieldSet as AirtableFieldSet, Record as AirtableRecord, Query as AirtableQuery } from 'airtable'
import { ActionStatus } from '@/types'

export interface FieldSet extends AirtableFieldSet {}
export interface Record<T extends FieldSet = FieldSet> extends AirtableRecord<T> {}
export interface Records<T extends FieldSet = FieldSet> extends Array<Record<T>> {}
export interface Query<T extends FieldSet = FieldSet> extends AirtableQuery<T> {}

export interface ActionRunRecord extends FieldSet {
  Date: string
  Status: ActionStatus
  Action: string
  Operations?: string
  Source: string
  Event?: string
  Errors?: string
  Message?: string
  Notes?: string
}

export interface ActionRunPayload {
  status: ActionStatus
  date?: string
  action?: string
  operations?: string
  source?: string
  event?: string
  errors?: string
  message?: string
  notes?: string
}
