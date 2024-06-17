[airtable-base]: https://airtable.com/appn0QEUHeYBOQnjc/shrvwYpD6I6E6tHVi
[airtable-sync-collections-status]: https://airtable.com/appn0QEUHeYBOQnjc/shrvwYpD6I6E6tHVi/tbliM6NaaicZx53j9/viwPnBcbkh04ArnL6
[airtable-sync-products-quantity]: https://airtable.com/appn0QEUHeYBOQnjc/shrvwYpD6I6E6tHVi/tblopaEqeBGc6rfay/viwV0F3roAuh9NzCv
[airtable-runs]: https://airtable.com/appn0QEUHeYBOQnjc/shrvwYpD6I6E6tHVi/tbltT0vuYmSENHEaS/viw5LVQulRmhMDEE4

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

Each action is run with a GitHub Actions workflow defined in the `.github/workflows` directory and needs specific environment variables. All actions can be triggered manually via the `Run workflow` button in the repository Actions tab. 


### Sync Collections Status

[![](https://github.com/gzeta-adv/wikini/actions/workflows/sync-collections-status.yml/badge.svg)](https://github.com/gzeta-adv/wikini/actions/workflows/sync-collections-status.yml)

The action synchronizes the publications of a Shopify collection depending on a given metafield and logs the operations in an Airtable table.

| Workflow | Environment | Schedule | Logs |
| -------- | ----------- | -------- | ---- |
| [`sync-collections-status`](.github/workflows/sync-collections-status.yml) | `AIRTABLE_API_KEY`<br>`AIRTABLE_BASE_ID`<br>`AIRTABLE_COLLECTION_STATUS_TABLE_ID`<br>`AIRTABLE_RUNS_TABLE_ID`<br>`SHOPIFY_ACCESS_TOKEN`<br>`SHOPIFY_STORE_ID` | Every 3 hours | [Collection Status Operations][airtable-sync-collections-status] |

### Sync Products Quantity

[![](https://github.com/gzeta-adv/wikini/actions/workflows/sync-products-quantity.yml/badge.svg)](https://github.com/gzeta-adv/wikini/actions/workflows/sync-products-quantity.yml)

The action synchronizes the quantity of the products in the Wikini CMS with the quantity in the Shopify store and logs the operations in an Airtable table.

| Workflow | Environment | Schedule | Logs |
| -------- | ----------- | -------- | ---- |
| [`sync-products-quantity`](.github/workflows/sync-products-quantity.yml) | `AIRTABLE_API_KEY`<br>`AIRTABLE_BASE_ID`<br>`AIRTABLE_PRODUCT_QUANTITY_TABLE_ID`<br>`AIRTABLE_RUNS_TABLE_ID`<br>`SHOPIFY_ACCESS_TOKEN`<br>`SHOPIFY_LOCATION_ID`<br>`SHOPIFY_STORE_ID`<br>`WIKINI_API_URL`<br>`WIKINI_API_KEY`<br>`WIKINI_VERIFY_ENDPOINT` | Every minute[*](#run-a-workflow-in-shorter-intervals) | [Product Quantity Operations][airtable-sync-products-quantity] |

### Clean Airtable

[![](https://github.com/gzeta-adv/wikini/actions/workflows/clean-airtable.yml/badge.svg)](https://github.com/gzeta-adv/wikini/actions/workflows/clean-airtable.yml)

The action cleans the Airtable tables that store the logs of the actions (see [Logs](#logs)). Records older than 10 days are deleted.

| Workflow | Environment | Schedule | Logs |
| -------- | ----------- | -------- | ---- |
| [`clean-airtable`](.github/workflows/clean-airtable.yml) | `AIRTABLE_API_KEY`<br>`AIRTABLE_BASE_ID`<br>`AIRTABLE_RUNS_TABLE_ID` | Every day | [Runs][airtable-runs] |

## Notes

### Run a workflow in shorter intervals

GitHub Actions has a limit of 5 minutes for intervals between workflow runs. To run a workflow every minute, the action needs a `repository_dispatch` event, which can be triggered with the following HTTP request:

```sh
curl --request POST \
  --url 'https://api.github.com/repos/gzeta-adv/wikini/dispatches' \
  --header 'authorization: Bearer <GITHUB_ACCESS_TOKEN>' \
  --data '{ "event_type": "Sync products quantity" }'
```

The service currently used to send the request every minute is [Google Cloud Scheduler](https://cloud.google.com/scheduler).

### Logs

The logs of all actions are stored in an [Airtable base][airtable-base] that has a limit of 50.000 entries per month. For this reason, the [Runs][airtable-runs] table is **limited to the last 10 days**.
