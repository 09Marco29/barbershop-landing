# Four Corners Barbers: landing page

A responsive landing page for a fictional barbershop, built with plain HTML, CSS and JavaScript (no frameworks, no build step). It has a live "open now" badge, a price board that fills in the booking form, and a booking form with inline validation.

**Live demo:** `https://<your-github-username>.github.io/barbershop-landing/`

> Four Corners Barbers is a made-up business. The address, phone number and prices are placeholders.

## What it does

- **Open-now badge.** Reads the visitor's clock and shows "Open now, until 7 PM", "Closed. Opens Monday at 9 AM" and so on. Today's row in the hours table is highlighted.
- **Price board.** Six services. Each "Book" button selects that service in the form, scrolls to it and puts the cursor in the first field.
- **Booking form.**
  - Validates name, email, phone (optional), service, date and time, with an error under each field and a summary at the top that links to every problem.
  - Time slots follow the shop hours: weekdays 9:00 AM to 6:00 PM, Saturdays 8:00 AM to 4:00 PM, Sundays closed. Same-day requests need 30 minutes of notice.
  - Bookings can be made up to 90 days ahead.
  - Shows a confirmation panel after sending, and a retry message if sending fails.
- **Responsive.** Works from 320 px phones to wide desktop screens.
- **Accessible.** Skip link, labelled fields, visible keyboard focus, error messages linked to their fields, text contrast of at least 4.5:1, and the barber pole animation stops when the visitor asks for reduced motion.
- **Light.** About 100 KB in total, including fonts (served from the project, no third-party requests).

## Run it

Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8765
# then open http://localhost:8765
```

## Deploy to GitHub Pages

1. Push this folder to a GitHub repository.
2. In the repository, go to **Settings > Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**, pick `main` and `/ (root)`, and save.
4. After a minute the site is live at `https://<your-github-username>.github.io/<repository-name>/`.

## Connect the form to a real inbox

The form works in demo mode (no backend). To receive real requests, create a free form endpoint (for example on [Formspree](https://formspree.io)) and put its URL in the form tag in `index.html`:

```html
<form id="booking-form" novalidate data-endpoint="https://formspree.io/f/your-form-id">
```

The script then sends the data with `fetch`, shows the confirmation on success, and shows a retry message on failure.

## Project structure

```
index.html          page markup
css/styles.css      design tokens (colors, type) and all styles
js/main.js          open-now badge, price board buttons, form validation and slots
assets/fonts/       Rozha One and Schibsted Grotesk (SIL Open Font License)
```

## Design notes

- The barber pole in the hero is pure CSS: a striped gradient that slides along the tube, with a shading layer on top to make it look round.
- Colors come from the pole itself: navy, red and blue on a cool white.
- Type pairs Rozha One (headlines) with Schibsted Grotesk (text).

## Tested

This page has its own QA project with 44 test cases, an automated Playwright suite and a bug report: see `qa-test-plan-barbershop`.

## Possible next steps

- Set the shop's time zone for the open-now badge instead of using the visitor's clock.
- Add real photos of the shop and the barbers.
- Spanish version with a language switch.

## Credits

Fonts: Rozha One and Schibsted Grotesk, used under the SIL Open Font License (licenses in `assets/fonts/`). Built by Marco Ruiz.
