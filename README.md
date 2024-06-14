# Wikini

This repository contains the source code of the actions, extensions and APIs used by the Wikini Shopify store.

## Setup

Download the repository and install the dependencies:

```sh
pnpm install
```

Copy the `.env.example` file to `.env` and fill in the necessary environment variables depending on the tasks you want to run.

## Actions

To run one of the following actions, use the command:

```sh
pnpm run action <workflow-name>
```

### Sync Collections Status

[![](https://github.com/gzeta-adv/wikini/actions/workflows/sync-collections-status.yml/badge.svg)](https://github.com/gzeta-adv/wikini/actions/workflows/sync-collections-status.yml)

The action synchronizes the publications of a Shopify collection depending on a given metafield. The operations are logged in an Airtable table.

- **Command**: 
    ```sh
    pnpm run action sync-collections-status
    ```
- **Workflow**: [`sync-collections-status`](.github/workflows/sync-collections-status.yml)
- **Environment variables**:
  - `AIRTABLE_API_KEY`
  - `AIRTABLE_BASE_ID`
  - `AIRTABLE_COLLECTION_STATUS_TABLE_ID`
  - `AIRTABLE_RUNS_TABLE_ID`
  - `SHOPIFY_ACCESS_TOKEN`
  - `SHOPIFY_STORE_ID`
- **Schedule**: every 3 hours (via schedule) or manually
- **Logs**: [Airtable](https://airtable.com/appn0QEUHeYBOQnjc/tbliM6NaaicZx53j9)

### Sync Products Quantity

[![](https://github.com/gzeta-adv/wikini/actions/workflows/sync-products-quantity.yml/badge.svg)](https://github.com/gzeta-adv/wikini/actions/workflows/sync-products-quantity.yml)

The action synchronizes the quantity of the products in the Wikini CMS with the quantity in the Shopify store. The operations are logged in a specific Airtable table.

- **Command**: 
    ```sh
    pnpm run action sync-products-quantity
    ```
- **Workflow**: [`sync-products-quantity`](.github/workflows/sync-products-quantity.yml)
- **Environment variables**:
  - `AIRTABLE_API_KEY`
  - `AIRTABLE_BASE_ID`
  - `AIRTABLE_PRODUCT_QUANTITY_TABLE_ID`
  - `AIRTABLE_RUNS_TABLE_ID`
  - `SHOPIFY_ACCESS_TOKEN`
  - `SHOPIFY_LOCATION_ID`
  - `SHOPIFY_STORE_ID`
  - `WIKINI_API_URL`
  - `WIKINI_API_KEY`
  - `WIKINI_VERIFY_ENDPOINT`
- **Schedule**: every minute (via repository dispatch) or manually
- **Logs**: [Airtable](https://airtable.com/appn0QEUHeYBOQnjc/tblopaEqeBGc6rfay)
