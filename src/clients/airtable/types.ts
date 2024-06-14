import { FieldSet as AirtableFieldSet, Record as AirtableRecord, Records as AirtableRecords } from 'airtable'
import { ActionStatus } from '@/types'

export interface FieldSet extends AirtableFieldSet {}
export interface Record<T extends FieldSet = FieldSet> extends AirtableRecord<T> {}
export interface Records<T extends FieldSet = FieldSet> extends AirtableRecords<T> {}

export interface ActionRunRecord extends FieldSet {
  Date: string
  Status: ActionStatus
  Action: string
  Operations?: string
  Errors?: string
  Message?: string
  Notes?: string
}

export interface ActionRunPayload {
  status: ActionStatus
  date?: string
  errors?: string
  message?: string
  notes?: string
}
