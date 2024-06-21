import { FieldSet as AirtableFieldSet, Record as AirtableRecord, Query as AirtableQuery } from 'airtable'

export interface FieldSet extends AirtableFieldSet {}
export interface Record<T extends FieldSet = FieldSet> extends AirtableRecord<T> {}
export interface Records<T extends FieldSet = FieldSet> extends Array<Record<T>> {}
export interface Query<T extends FieldSet = FieldSet> extends AirtableQuery<T> {}
