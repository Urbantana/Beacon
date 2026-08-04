---
name: i18n dynamic key lookup
description: t(dynamicKey as any) will throw a runtime error if the key doesn't exist
---

**Rule:** Never call `t(someVariable as any)` without guaranteeing the variable is a valid TranslationKey.

**Why:** `translations[key][lang]` throws "Cannot read properties of undefined (reading 'en')" when key is missing, because `translations[key]` is undefined.

**How to apply:** Use an explicit object map or conditional:
```ts
// SAFE: explicit map
const label = cat === "all" ? t("allCategories") : cat === "boardGames" ? t("boardGames") : cat;

// UNSAFE: dynamic lookup
t(cat as any)  // crashes if cat is not a TranslationKey
```

Or create a safe wrapper: `safeT(key: string, lang: Lang) => translations[key as TranslationKey]?.[lang] ?? key`.
