# Wikini

This repository contains the source code of the actions, extensions and APIs used by the Wikini Shopify store.

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

Each action is run with a GitHub Actions workflow defined in the `.github/workflows` directory and has specific triggers and environment variables.



### Sync Collections Status

[![](https://github.com/gzeta-adv/wikini/actions/workflows/sync-collections-status.yml/badge.svg)](https://github.com/gzeta-adv/wikini/actions/workflows/sync-collections-status.yml)

The action synchronizes the publications of a Shopify collection depending on a given metafield and logs the operations in a Airtable table.

| Workflow | Environment | Schedule | Logs |
| -------- | ----------- | -------- | ---- |
| [`sync-collections-status`](.github/workflows/sync-collections-status.yml) | `AIRTABLE_API_KEY`<br>`AIRTABLE_BASE_ID`<br>`AIRTABLE_COLLECTION_STATUS_TABLE_ID`<br>`AIRTABLE_RUNS_TABLE_ID`<br>`SHOPIFY_ACCESS_TOKEN`<br>`SHOPIFY_STORE_ID` | - Every 3 hours<br>- Manually via action dispatch | [Airtable](https://airtable.com/appn0QEUHeYBOQnjc/tbliM6NaaicZx53j9) |

### Sync Products Quantity

[![](https://github.com/gzeta-adv/wikini/actions/workflows/sync-products-quantity.yml/badge.svg)](https://github.com/gzeta-adv/wikini/actions/workflows/sync-products-quantity.yml)

The action synchronizes the quantity of the products in the Wikini CMS with the quantity in the Shopify store and logs the operations in an Airtable table.

| Workflow | Environment | Schedule | Logs |
| -------- | ----------- | -------- | ---- |
| [`sync-products-quantity`](.github/workflows/sync-products-quantity.yml) | `AIRTABLE_API_KEY`<br>`AIRTABLE_BASE_ID`<br>`AIRTABLE_PRODUCT_QUANTITY_TABLE_ID`<br>`AIRTABLE_RUNS_TABLE_ID`<br>`SHOPIFY_ACCESS_TOKEN`<br>`SHOPIFY_LOCATION_ID`<br>`SHOPIFY_STORE_ID`<br>`WIKINI_API_URL`<br>`WIKINI_API_KEY`<br>`WIKINI_VERIFY_ENDPOINT` | - Every minute[*](#run-a-workflow-in-shorter-intervals)<br>- Manually via action dispatch | [Airtable](https://airtable.com/appn0QEUHeYBOQnjc/tblopaEqeBGc6rfay) |

## Notes

### Run a workflow in shorter intervals

GitHub Actions has a limit of 5 minutes for intervals between workflow runs. To run a workflow every minute, the action needs a `repository_dispatch` event, which can be triggered with the following HTTP request:

```sh
curl --request POST \
  --url 'https://api.github.com/repos/gzeta-adv/wikini/dispatches' \
  --header 'authorization: Bearer <GITHUB_ACCESS_TOKEN>' \
  --data '{ "event_type": "Sync products quantity" }'
```

The service used to send the request every minute is [Google Cloud Scheduler](https://cloud.google.com/scheduler).
