---
name: feedback_no_secrets_in_chat
description: User has shared sensitive tokens in chat twice — remind to use secrets managers
type: feedback
---

User has shared sensitive credentials directly in chat on two occasions (GitHub PAT, Vercel token).

**Why:** They're not always aware of the security risk of pasting tokens in plaintext conversations.

**How to apply:** Whenever working with APIs, tokens, or credentials — proactively tell the user BEFORE they share anything: "אל תדביק את ה-token כאן — שמור אותו ישירות ב-GitHub Secrets / env file בלבד."
