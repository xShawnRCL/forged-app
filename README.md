# Forged

A workout tracker built as an iPhone home-screen web app. Open it in Safari, then Share → Add to Home Screen.

## Structure

No build step. Everything is plain HTML, CSS and JavaScript.

| File | What's in it |
| --- | --- |
| `index.html` | Screens (Today, History, Plans, Progress), tab bar and every sheet |
| `css/app.css` | Design tokens (light and dark), type scale, lists, sheets and materials |
| `js/motion.js` | Spring physics, velocity tracking, momentum projection, rubber-banding, sheets, swipe actions, haptics |
| `js/data.js` | Exercise and stretch library, muscle map, built-in plans and the program templates |
| `js/body.js` | Muscles Worked body diagram (sets per muscle over 7 or 30 days) |
| `js/app.js` | App state, storage and rendering |
| `sw.js`, `manifest.webmanifest`, `icons/` | Home-screen install and offline support |

When you change a CSS or JS file, bump its `?v=` number in `index.html` **and** the matching entries plus `CACHE` name in `sw.js`, so home-screen installs pick up the new files.

## Programs

Programs live in `PROGRAMS` in `js/data.js`. Each workout lists its exercises and optional per-exercise `targets` (sets × reps, or seconds for timed exercises). Using a program copies its workouts into your own plans (`prog-<program>-<workout>`), so edits never touch the template.

## Apple Health

Forged can't write to HealthKit directly because it's a web app. Settings → Apple Health explains how to build a one-time Shortcut called **Forged to Health**. Forged opens it with the day's body weight and workout times, and the Shortcut logs them to Health.

## Design notes

The interface follows Apple's interface and motion principles:

- **System type and colors.** It uses the SF system font, which follows your iOS Text Size setting. Light and dark mode both work, and Forged green is the only accent color.
- **Everything is a spring.** Sheets, swipe actions, the calendar pager, the rest timer and the tab indicator all run on springs, defined by damping ratio and response. Each one starts from its current on-screen position, so you can grab it mid-animation.
- **Gestures follow your finger.** Dragging tracks your finger 1:1. When you let go, your finger's speed carries into the animation, and a flick is projected forward to decide whether a sheet closes or a row deletes. Dragging past an edge meets increasing resistance instead of a hard stop.
- **Easy undo.** Removing something offers Undo instead of asking first. Confirmation dialogs are only used for actions that really can't be undone.
- **Accessibility settings are respected.** Reduce Motion, Reduce Transparency and Increase Contrast each switch to a calmer, more solid style.

## Data

Everything is stored on the device in `localStorage` under the key `forged3`. Use Settings → Save Backup File to keep a copy.
