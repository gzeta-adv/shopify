import { FieldSet as AirtableFieldSet, Record as AirtableRecord, Records as AirtableRecords } from 'airtable'

export interface FieldSet extends AirtableFieldSet {}
export interface Record<T extends FieldSet> extends AirtableRecord<T> {}
export interface Records<T extends FieldSet> extends AirtableRecords<T> {}
