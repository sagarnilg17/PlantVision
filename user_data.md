# user_data.md
> Defines what user data is collected, stored, and how it flows. Update whenever a new data field is added.

---

## UserData Schema
Defined in `src/types/index.ts` → `UserData`

| Field         | Type                     | Stored     | Notes                          |
|---------------|--------------------------|------------|--------------------------------|
| `id`          | `string`                 | Local      | UUID generated on first launch |
| `name`        | `string`                 | Local      | Optional display name          |
| `email`       | `string`                 | Local      | Optional, no auth yet          |
| `createdAt`   | `string` (ISO)           | Local      | First launch timestamp         |
| `preferences` | `Record<string, unknown>` | Local     | Theme, language, etc.          |

---

## Message Schema
Defined in `src/types/index.ts` → `Message`

| Field       | Type              | Stored  | Notes                      |
|-------------|-------------------|---------|----------------------------|
| `id`        | `string`          | Session | `Date.now()` string        |
| `role`      | `user` \| `model` | Session | Gemini role format         |
| `text`      | `string`          | Session | Raw message content        |
| `timestamp` | `string` (ISO)    | Session | When message was sent      |

> Messages are **session-only** by default. To persist: add Zustand persist middleware with AsyncStorage.

---

## Storage Layers

| Layer           | Package                                   | What lives here           |
|-----------------|-------------------------------------------|---------------------------|
| In-memory       | Zustand                                   | Active session messages   |
| Local persistent| AsyncStorage (`@react-native-async-storage`) | User prefs, profile    |
| Remote (future) | TBD                                       | Sync, backup              |

---

## Data Sent to External APIs

| API     | What's sent                   | Retained? |
|---------|-------------------------------|-----------|
| Gemini  | Message text + chat history   | Per Gemini ToS — no training on API data by default |
| Claude  | Message text (if fallback used) | Per Anthropic ToS |

> No PII is sent unless the user types it into the chat. Do not log or store raw messages server-side without explicit consent.

---

## Privacy Checklist
- [ ] `.env` excluded from version control (add to `.gitignore`)
- [ ] No analytics SDK added yet — add opt-in consent before adding one
- [ ] Messages not persisted beyond session (safe default)
- [ ] No user ID sent to external APIs

---

## Future Fields to Consider
- `avatarUrl` — profile picture
- `sessionHistory[]` — persisted past conversations
- `subscriptionTier` — free / pro
- `lastActiveAt` — for session resumption
