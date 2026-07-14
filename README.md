# Pulse 💜

A personal expense tracker built with **Expo (React Native)**. Log expenses in two taps, keep an eye on your monthly and weekly budgets, and let recurring bills log themselves. Everything is stored **locally on the device** with AsyncStorage — no account, no server, works offline.

<p align="center">
  <img src="assets/images/pulse.png" alt="Pulse logo" width="120" />
</p>

## Features

### Core (bottom navigation)

| Tab | What it does |
|---|---|
| **Dashboard** | Monthly budget card with animated progress, over/near-budget warning banner, 7-day spending chart, top categories, recent history |
| **Modules** | Hub for all add-ons, each with an enable/disable switch |
| **Add** (center button) | Log an expense or add money (income) — animated amount display, 3-column keypad with haptics, category chips, details field |
| **Settings** | Dark mode, budgets, currency, daily reminder with custom time, Gemini API key, reset |
| **Profile** | Name, budgets, and lifetime stats (entries logged, total tracked, todos done) |

### Modules (add-ons)

- **Expense Folders** — spending organized visually into folders per category. The 8 default folders are always there; create your own with a custom name, icon, and color. Long-press a custom folder to delete it (its expenses move to *Other*).
- **Todo Lists** — money tasks with a progress bar. Give a task an amount and checking it off **automatically logs it as an expense**; unchecking removes that expense again.
- **Calendar** — tap any day to plan a future expense in a modal. Planned days show a dot; all upcoming plans are listed below the grid.
- **AI Chatbot ("Penny")** — ask about your spending, budget, todos, and plans. Works fully offline with a built-in assistant; add a **Gemini API key** in Settings and Penny answers with Google Gemini instead, grounded in your actual data (with automatic fallback if the key fails or you're offline).
- **Recurring Expenses** — add rent, subscriptions, and bills once with a due day (1–31); Pulse auto-logs them each month when the day arrives. Never double-logs, and clamps day 31 to shorter months.
- **Reports & Export** — pick any month: total spent, change vs the previous month, daily average, biggest expense, money added, and a per-folder breakdown. Includes a tappable 6-month trend chart and **CSV export** of all entries via the native share sheet.

### Other behavior worth knowing

- **Onboarding** — first launch asks for your name, currency (`$ ₱ € £ ¥`), monthly budget, and weekly budget (suggested from the monthly one).
- **Budget warnings** — at 80% of the monthly budget a pulsing amber banner appears on the dashboard; going over turns it red. Saving an expense that pushes you over budget also raises an alert.
- **Daily reminder** — a local notification at any time you pick (12-hour format, native time picker).
- **Themes** — light and dark, both purple-accented, persisted across launches. Category colors come from a colorblind-safe validated palette.

## Getting started

Prerequisites: Node.js 18+, and the [Expo Go](https://expo.dev/go) app on your phone (or an Android/iOS simulator).

```bash
npm install
npx expo start
```

Then scan the QR code with Expo Go (Android) or the Camera app (iOS), or press `a` / `i` / `w` for Android emulator, iOS simulator, or web.

> **Tip:** after installing any new package, restart the dev server with `npx expo start -c` to clear Metro's cache — otherwise you may see "Unable to resolve module" errors pointing into `node_modules`.

## Enabling the Gemini AI (optional)

The chatbot works out of the box with a rule-based assistant. To upgrade it:

1. Open [aistudio.google.com](https://aistudio.google.com) and sign in with a Google account
2. Click **Get API key** → **Create API key**
3. In Pulse: **Settings → AI Assistant → Gemini API key**, paste the key, save

The key is stored only on the device and sent only to Google's Gemini API (`gemini-2.5-flash`). Remove it any time to go back to the built-in assistant.

## Project structure

```
app/                    # expo-router file-based routes
  _layout.tsx           #   root: providers (Theme, App data, Alerts) + stack
  (tabs)/               #   the 5 bottom-nav screens
    _layout.tsx         #     tab config + onboarding redirect
    index.tsx           #     Dashboard
    modules.tsx         #     Modules hub
    add.tsx             #     Add expense / add money
    settings.tsx        #     Settings
    profile.tsx         #     Profile
  onboarding.tsx        #   first-run setup
  folders.tsx           #   folder grid + create-folder modal
  folder/[id].tsx       #   expenses inside one folder
  todos.tsx             #   todo lists
  calendar.tsx          #   planning calendar
  chatbot.tsx           #   Penny (AI chat)
  recurring.tsx         #   recurring expenses
  reports.tsx           #   monthly reports + CSV export
components/             # Header, BottomNav, AppModal (swipe-to-dismiss),
                        # cards, charts, progress bar, warning banner
contexts/               # ThemeContext, AppContext (all data + persistence),
                        # AlertContext (custom in-app alerts)
constants/              # theme colors, categories + validated palette
utils/                  # dates, money formatting, chatbot logic, Gemini
                        # client, notifications
```

## How data is stored

All state lives in AsyncStorage under `@expenso/*` keys (profile, expenses, planned, todos, settings, categories, recurring, theme). There is no backend; **Settings → Reset all data** wipes everything, and the CSV export in Reports doubles as a backup.

Income is stored as an expense record with `type: "income"` and is excluded from spending totals, folders, and charts. Recurring items track a `lastLoggedMonth` so a bill is logged at most once per month, on app launch.

## Platform notes

- **Notifications**: local daily reminders work in Expo Go on Android and iOS. Not available on web.
- **CSV export**: mobile only (uses the native share sheet).
- **Remote push notifications** are not supported in Expo Go since SDK 53 — not needed for Pulse's local reminders.
- **Home-screen widgets** would require a development build (`eas build`) with native modules like `react-native-android-widget` — not possible in Expo Go.

## Tech stack

- [Expo SDK 54](https://docs.expo.dev/versions/v54.0.0/) · React Native 0.81 · React 19 · TypeScript (strict)
- [expo-router](https://docs.expo.dev/router/introduction/) v6 (typed routes) — file-based navigation
- react-native-reanimated 4 — all animations (fades/slides, no bounce)
- @react-native-async-storage/async-storage — persistence
- expo-notifications · expo-file-system · expo-sharing · @react-native-community/datetimepicker
- Google Gemini API (optional, user-supplied key)

## Scripts

```bash
npm start          # expo start
npm run android    # expo start --android
npm run ios        # expo start --ios
npm run web        # expo start --web
npm run lint       # eslint (expo config)
npx tsc --noEmit   # type check
```

## Troubleshooting

| Problem | Fix |
|---|---|
| `Unable to resolve module ...` right after installing a package | Restart the dev server: `npx expo start -c` |
| Reminder toggle does nothing | Allow notifications for Expo Go in system settings; not supported on web |
| Chatbot says Gemini couldn't be reached | Check the API key in Settings and your internet connection — it falls back to the built-in assistant automatically |
| Stale route types after adding/renaming files in `app/` | Start the dev server once — typed routes regenerate on `expo start` |
