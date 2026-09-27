import type { CollectionSchema } from 'deepspace/schema'

export const loreDropsSchema: CollectionSchema = {
  name: 'lore-drops',
  columns: [
    { name: 'spaceId', storage: 'text', interpretation: 'plain', required: true },
    { name: 'nickname', storage: 'text', interpretation: 'plain', required: true },
    { name: 'title', storage: 'text', interpretation: 'plain', required: true },
    { name: 'story', storage: 'text', interpretation: 'plain', required: true },
    { name: 'emoji', storage: 'text', interpretation: 'plain', required: true },
    { name: 'kind', storage: 'text', interpretation: { kind: 'select', options: ['text', 'photo', 'voice'] } },
    { name: 'mediaUrl', storage: 'text', interpretation: 'url' },
    { name: 'mediaMime', storage: 'text', interpretation: 'plain' },
    { name: 'visibility', storage: 'text', interpretation: { kind: 'select', options: ['private', 'public'] }, required: true },
    { name: 'collaborators', storage: 'text', interpretation: { kind: 'json' }, required: true },
  ],
  collaboratorsField: 'collaborators',
  visibilityField: { field: 'visibility', value: 'public' },
  permissions: {
    member: { read: 'shared', create: true, update: 'own', delete: 'own' },
    admin: { read: true, create: true, update: true, delete: true },
  },
}
