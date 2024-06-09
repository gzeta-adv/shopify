# Wikini

This repository contains the source code of the actions, extensions and APIs used by the Wikini Shopify store.

## Setup

Download the repository to your computer and install the dependencies:

```sh
pnpm install
```

Copy the `.env.example` file to `.env` and fill in the necessary environment variables depending on the task you want to run.

## Actions

To run one of the following actions, use the command:

```sh
pnpm run action <workflow-name>
```

### Sync Collections Status

[![](https://github.com/gzeta-adv/wikini/actions/workflows/sync-collections-status.yml/badge.svg)](https://github.com/gzeta-adv/wikini/actions/workflows/sync-collections-status.yml)

The action synchronizes the publications of a Shopify collection depending on one of its metafields. The operations are logged in an Airtable table.

- **Command**: 
    ```sh
    pnpm action sync-collections-status
    ```
- **Workflow**: [`sync-collections-status`](.github/workflows/sync-collections-status.yml)
- **Environment variables**:
  - `AIRTABLE_API_KEY`
  - `AIRTABLE_BASE_ID`
  - `AIRTABLE_LOGS_TABLE_ID`
  - `SHOPIFY_ACCESS_TOKEN`
  - `SHOPIFY_STORE_ID`
- **Schedule**: every 3 hours or manually
- **Logs**: [Airtable](https://airtable.com/appn0QEUHeYBOQnjc/shrvwYpD6I6E6tHVi)
