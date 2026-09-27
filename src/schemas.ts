/**
 * Collection Schemas
 *
 * All collections with columns and RBAC permissions.
 * Single source of truth — imported by both worker and frontend.
 *
 * Add schemas by creating a file in src/schemas/ and importing it here.
 */

import type { CollectionSchema } from 'deepspace/schema'
import { usersSchema } from './schemas/users-schema'
import { spacesSchema } from './schemas/spaces-schema'
import { loreDropsSchema } from './schemas/lore-drops-schema'

export const schemas: CollectionSchema[] = [
  usersSchema,
  spacesSchema,
  loreDropsSchema,
]
