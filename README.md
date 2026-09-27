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

## Screenshots

![Landing Page](<img width="1469" height="799" alt="Screenshot 2026-09-26 at 7 27 14 PM" src="https://github.com/user-attachments/assets/fab881cd-183f-4440-89c0-25948aafbe3f" />)

![Home](<img width="1469" height="799" alt="Screenshot 2026-09-26 at 7 31 22 PM" src="https://github.com/user-attachments/assets/8fc71d8c-6344-4375-9d25-c9b350cdca1d" />
)

![Lore Space](<img width="1469" height="799" alt="Screenshot 2026-09-26 at 7 28 24 PM" src="https://github.com/user-attachments/assets/007dae27-fdb7-46f7-a964-d614e1c7fbc7" />
)

![Lore Drop](
<img width="1469" height="799" alt="Screenshot 2026-09-26 at 7 31 45 PM" src="https://github.com/user-attachments/assets/e64a5a64-a443-4b68-9b1d-b72d6f97e797" />)

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
