# Forged

A workout tracker built as an iPhone home-screen web app. Open it in Safari, then Share → Add to Home Screen.

## Structure

No build step. Everything is plain HTML, CSS and JavaScript.

| File | What's in it |
| --- | --- |
| `index.html` | Screens (Today, History, Plans, Progress), tab bar and every sheet |
| `css/app.css` | Design tokens (light and dark), type scale, lists, sheets and materials |
| `js/motion.js` | Spring physics, velocity tracking, momentum projection, rubber-banding, sheets, swipe actions, haptics |
| `js/data.js` | Exercise and stretch library, built-in plans and programs |
| `js/app.js` | App state, storage and rendering |

When you change a CSS or JS file, bump its `?v=` number in `index.html` so home-screen installs pick up the new file.

## Design notes

The interface follows Apple's interface and motion principles:

- **System type and colors.** It uses the SF system font, which follows your iOS Text Size setting. Light and dark mode both work, and Forged green is the only accent color.
- **Everything is a spring.** Sheets, swipe actions, the calendar pager, the rest timer and the tab indicator all run on springs, defined by damping ratio and response. Each one starts from its current on-screen position, so you can grab it mid-animation.
- **Gestures follow your finger.** Dragging tracks your finger 1:1. When you let go, your finger's speed carries into the animation, and a flick is projected forward to decide whether a sheet closes or a row deletes. Dragging past an edge meets increasing resistance instead of a hard stop.
- **Easy undo.** Removing something offers Undo instead of asking first. Confirmation dialogs are only used for actions that really can't be undone.
- **Accessibility settings are respected.** Reduce Motion, Reduce Transparency and Increase Contrast each switch to a calmer, more solid style.

## Data

Everything is stored on the device in `localStorage` under the key `forged3`. Use Settings → Save Backup File to keep a copy.
