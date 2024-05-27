import api from '@/api'

const FIELDS = `
  metafields(first: 1, keys: ["custom.obsoleta"]) {
    edges {
      node {
        key
        value
      }
    }
  }
`

export const syncCollections = async () => {
  const collections = await api.fetchAllCollections(FIELDS)
}
