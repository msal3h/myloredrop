# LoreDrop

LoreDrop is a shared space for keeping track of friend-group lore: new events, stories, drama, gossip, and updates.

**Live:** https://loredrop2.app.space
## Features

- Create private Lore Spaces
- Join spaces using a unique Lore Code
- Create and view Lore Drops
- Collaborator-based access to spaces
- Persistent data across sessions
- Realtime updates between users
- Authentication

## Tech

Built on DeepSpace using:

- Authentication
- Database / Records
- Realtime subscriptions
- Record-level permissions
- Server actions

The main collections are `users`, `spaces`, and `lore-drops`. Spaces store collaborators and Lore Drops are associated with a space and author.

## Run Locally

```bash
npm install
npm run dev
