[spreadsheet]: https://docs.google.com/spreadsheets/d/1T-2g8k8qZdEvTofj0c3ZlloUoXHy0JnwDNXcj_ONHaA
[sync-collections-status-sheet]: https://docs.google.com/spreadsheets/d/1T-2g8k8qZdEvTofj0c3ZlloUoXHy0JnwDNXcj_ONHaA?gid=1270546238#gid=1270546238
[sync-products-quantity-sheet]: https://docs.google.com/spreadsheets/d/1T-2g8k8qZdEvTofj0c3ZlloUoXHy0JnwDNXcj_ONHaA?gid=499385108#gid=499385108

# Shopify

This repository contains the source code of the actions, extensions and APIs used by the GZETA Shopify stores.

## Setup

Download the repository and install the dependencies:

```sh
pnpm install
```

Copy the `.env.example` file to `.env` and fill in the necessary environment variables depending on the actions you want to run.

## Actions

To run an action, use the command:

```sh
pnpm run action <workflow-name>
```

Each action is run with a GitHub Actions workflow defined in the `.github/workflows` directory and needs specific environment variables. All actions can be triggered manually via the `Run workflow` button in the repository Actions tab. 


### Sync Collections Status

[![](https://github.com/gzeta-adv/shopify/actions/workflows/sync-collections-status.yml/badge.svg)](https://github.com/gzeta-adv/shopify/actions/workflows/sync-collections-status.yml)

The action synchronizes the publications of a Shopify collection depending on a given metafield and logs the operations in a Google Sheets spreadsheet.

| Workflow | Environment | Schedule | Logs |
| -------- | ----------- | -------- | ---- |
| [`sync-collections-status`](.github/workflows/sync-collections-status.yml) | `GOOGLE_SHEETS_CLIENT_EMAIL`<br>`GOOGLE_SHEETS_PRIVATE_KEY`<br>`GOOGLE_SHEETS_SPREADSHEET_ID`<br>`GOOGLE_SHEETS_SYNC_COLLECTIONS_STATUS_SHEET`<br>`SHOPIFY_ACCESS_TOKEN`<br>`SHOPIFY_STORE_ID` | Every 3 hours | [Collection Status Operations][sync-collections-status-sheet] |

### Sync Products Quantity

[![](https://github.com/gzeta-adv/shopify/actions/workflows/sync-products-quantity.yml/badge.svg)](https://github.com/gzeta-adv/shopify/actions/workflows/sync-products-quantity.yml)

The action synchronizes the quantity of the products in a customer PIM with the quantity in the Shopify store and logs the operations in a Google Sheets spreadsheet.

| Workflow | Environment | Schedule | Logs |
| -------- | ----------- | -------- | ---- |
| [`sync-products-quantity`](.github/workflows/sync-products-quantity.yml) | `GOOGLE_SHEETS_CLIENT_EMAIL`<br>`GOOGLE_SHEETS_PRIVATE_KEY`<br>`GOOGLE_SHEETS_SPREADSHEET_ID`<br>`GOOGLE_SHEETS_SYNC_PRODUCTS_QUANTITY_SHEET`<br>`PIM_API_URL`<br>`PIM_API_KEY`<br>`PIM_VERIFY_ENDPOINT`<br>`RETRIES` (optional)<br>`SHOPIFY_ACCESS_TOKEN`<br>`SHOPIFY_LOCATION_ID`<br>`SHOPIFY_STORE_ID` | Every minute[*](#run-workflows-in-shorter-intervals) | [Product Quantity Operations][sync-products-quantity-sheet] |

## Notes

### Run workflows in shorter intervals

GitHub Actions has a limit of 5 minutes for intervals between workflow runs. To run a workflow every minute, the action needs a `repository_dispatch` event, which can be triggered with the following HTTP request:

```sh
curl --request POST \
  --url 'https://api.github.com/repos/gzeta-adv/shopify/dispatches' \
  --header 'authorization: Bearer <GITHUB_ACCESS_TOKEN>' \
  --data '{ "event_type": "Sync products quantity" }'
```

The service currently used to send the request every minute is [Google Cloud Scheduler](https://cloud.google.com/scheduler).
