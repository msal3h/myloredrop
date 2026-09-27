import type { CollectionSchema } from 'deepspace/schema'

export const spacesSchema: CollectionSchema = {
  name: 'spaces',
  columns: [
    { name: 'title', storage: 'text', interpretation: 'plain', required: true },
    { name: 'description', storage: 'text', interpretation: 'plain' },
    { name: 'creatorNickname', storage: 'text', interpretation: 'plain', required: true },
    { name: 'inviteCode', storage: 'text', interpretation: 'plain', required: true, immutable: true },
    { name: 'visibility', storage: 'text', interpretation: { kind: 'select', options: ['private', 'public'] }, required: true },
    { name: 'collaborators', storage: 'text', interpretation: { kind: 'json' }, required: true },
  ],
  uniqueOn: ['inviteCode'],
  collaboratorsField: 'collaborators',
  visibilityField: { field: 'visibility', value: 'public' },
  permissions: {
    member: { read: 'shared', create: true, update: 'shared', delete: 'own' },
    admin: { read: true, create: true, update: true, delete: true },
  },
}
