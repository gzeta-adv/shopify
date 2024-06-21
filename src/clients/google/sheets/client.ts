import { auth, sheets } from '@googleapis/sheets'
import { CLIENT_EMAIL, PRIVATE_KEY, SCOPES } from './data'

export const client = sheets({
  version: 'v4',
  auth: new auth.GoogleAuth({
    credentials: {
      client_email: CLIENT_EMAIL,
      private_key: PRIVATE_KEY,
    },
    scopes: SCOPES,
  }),
}).spreadsheets
