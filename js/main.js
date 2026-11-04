/* Four Corners Barbers: landing page behavior
   - live "open now" badge and highlighted day in the hours table
   - price board "Book" buttons that pre-fill the booking form
   - booking form with inline validation, time slots that follow the shop hours,
     and a confirmation panel (no backend: set data-endpoint on the form to post to a service like Formspree)
*/
(function () {
  "use strict";

  /* ---------- Shop data ---------- */

  // Day index follows Date#getDay(): 0 = Sunday. Hours are [open, close] in 24h time.
  var HOURS = {
    0: null,
    1: [9, 19], 2: [9, 19], 3: [9, 19], 4: [9, 19], 5: [9, 19],
    6: [8, 17]
  };
  var DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  var MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var SLOT_MINUTES = 30;
  var LAST_START_BEFORE_CLOSE = 60;   // last appointment starts one hour before closing
  var MIN_LEAD_MINUTES = 30;          // same-day requests need 30 minutes of notice
  var MAX_DAYS_AHEAD = 90;

  var SERVICES = {
    "classic-cut": "Classic cut",
    "skin-fade": "Skin fade",
    "beard-trim": "Beard trim and line-up",
    "hot-towel-shave": "Hot-towel shave",
    "cut-and-beard": "Cut and beard",
    "kids-cut": "Kids' cut"
  };

  /* ---------- Helpers ---------- */

  function pad(n) { return n < 10 ? "0" + n : "" + n; }

  function toDateString(d) {
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }

  // Parse "YYYY-MM-DD" as a local date. new Date("YYYY-MM-DD") would be read as UTC
  // and can land on the previous day for users west of Greenwich.
  function parseDateString(str) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(str || "");
    if (!m) return null;
    var d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    if (d.getFullYear() !== Number(m[1]) || d.getMonth() !== Number(m[2]) - 1 || d.getDate() !== Number(m[3])) {
      return null;
    }
    return d;
  }

  function startOfToday() {
    var n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), n.getDate());
  }

  function formatHour(h) {
    var suffix = h >= 12 ? "PM" : "AM";
    var h12 = h % 12 === 0 ? 12 : h % 12;
    return h12 + " " + suffix;
  }

  function formatTime(totalMinutes) {
    var h = Math.floor(totalMinutes / 60);
    var m = totalMinutes % 60;
    var suffix = h >= 12 ? "PM" : "AM";
    var h12 = h % 12 === 0 ? 12 : h % 12;
    return h12 + ":" + pad(m) + " " + suffix;
  }

  function formatLongDate(d) {
    return DAY_NAMES[d.getDay()] + ", " + MONTH_NAMES[d.getMonth()] + " " + d.getDate();
  }

  /* ---------- Open now badge and hours table ---------- */

  var statusEl = document.getElementById("open-status");
  var hoursRows = document.querySelectorAll("#hours-table tbody tr");

  function updateOpenStatus() {
    var now = new Date();
    var day = now.getDay();
    var minutes = now.getHours() * 60 + now.getMinutes();
    var today = HOURS[day];
    var text, state;

    if (today && minutes >= today[0] * 60 && minutes < today[1] * 60) {
      state = "open";
      text = "Open now, until " + formatHour(today[1]);
    } else {
      state = "closed";
      if (today && minutes < today[0] * 60) {
        text = "Closed. Opens today at " + formatHour(today[0]);
      } else {
        var label = "";
        for (var i = 1; i <= 7; i++) {
          var nextDay = (day + i) % 7;
          if (HOURS[nextDay]) {
            label = (i === 1 ? "tomorrow" : DAY_NAMES[nextDay]) + " at " + formatHour(HOURS[nextDay][0]);
            break;
          }
        }
        text = "Closed. Opens " + label;
      }
    }

    statusEl.textContent = text;
    statusEl.setAttribute("data-state", state);

    for (var r = 0; r < hoursRows.length; r++) {
      if (Number(hoursRows[r].getAttribute("data-days")) === day) {
        hoursRows[r].setAttribute("aria-current", "date");
      } else {
        hoursRows[r].removeAttribute("aria-current");
      }
    }
  }

  updateOpenStatus();
  setInterval(updateOpenStatus, 60 * 1000);

  /* ---------- Booking form ---------- */

  var form = document.getElementById("booking-form");
  var summary = document.getElementById("form-errors");
  var confirmation = document.getElementById("confirmation");
  var confirmationText = document.getElementById("confirmation-text");
  var submitBtn = document.getElementById("submit-btn");
  var newRequestBtn = document.getElementById("new-request");
  var notes = document.getElementById("notes");
  var notesCount = document.getElementById("notes-count");

  var fields = {
    name: document.getElementById("name"),
    email: document.getElementById("email"),
    phone: document.getElementById("phone"),
    service: document.getElementById("service"),
    date: document.getElementById("date"),
    time: document.getElementById("time")
  };

  var LABELS = {
    name: "Full name",
    email: "Email",
    phone: "Phone",
    service: "Service",
    date: "Preferred date",
    time: "Preferred time"
  };

  var maxDate = new Date(startOfToday());
  maxDate.setDate(maxDate.getDate() + MAX_DAYS_AHEAD);
  fields.date.min = toDateString(startOfToday());
  fields.date.max = toDateString(maxDate);

  /* Time slots for a given date, as [{ value, label, disabled }] */
  function slotsFor(dateStr) {
    var d = parseDateString(dateStr);
    if (!d) return [];
    var hrs = HOURS[d.getDay()];
    if (!hrs) return [];

    var now = new Date();
    var isToday = toDateString(now) === dateStr;
    var nowMinutes = now.getHours() * 60 + now.getMinutes();

    var slots = [];
    var first = hrs[0] * 60;
    var last = hrs[1] * 60 - LAST_START_BEFORE_CLOSE;
    for (var t = first; t <= last; t += SLOT_MINUTES) {
      slots.push({
        value: pad(Math.floor(t / 60)) + ":" + pad(t % 60),
        label: formatTime(t),
        disabled: isToday && t < nowMinutes + MIN_LEAD_MINUTES
      });
    }
    return slots;
  }

  function renderTimeOptions() {
    var select = fields.time;
    var previous = select.value;
    var dateStr = fields.date.value;
    var d = parseDateString(dateStr);

    select.innerHTML = "";

    function addOption(value, label, disabled) {
      var o = document.createElement("option");
      o.value = value;
      o.textContent = label;
      if (disabled) o.disabled = true;
      select.appendChild(o);
    }

    if (!d) {
      addOption("", "Pick a date first");
      select.disabled = true;
      return;
    }

    var slots = slotsFor(dateStr);
    var available = slots.filter(function (s) { return !s.disabled; });

    if (!HOURS[d.getDay()]) {
      addOption("", "Closed on Sundays");
      select.disabled = true;
      return;
    }
    if (available.length === 0) {
      addOption("", "No times left that day");
      select.disabled = true;
      return;
    }

    addOption("", "Choose a time");
    slots.forEach(function (s) { addOption(s.value, s.label, s.disabled); });
    select.disabled = false;

    // Keep the previous choice if it is still bookable on the new date.
    var stillValid = slots.some(function (s) { return s.value === previous && !s.disabled; });
    select.value = stillValid ? previous : "";
  }

  /* Validators return an error message, or "" when the value is fine. */
  var validators = {
    name: function (v) {
      v = v.trim();
      if (!v) return "Enter your full name.";
      if (v.length < 2) return "Your name needs at least 2 characters.";
      if (!/^[\p{L}\p{M}' .\-]+$/u.test(v)) return "Use letters only in your name.";
      return "";
    },
    email: function (v) {
      v = v.trim();
      if (!v) return "Enter your email so we can confirm your appointment.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return "Enter a valid email, like name@example.com.";
      return "";
    },
    phone: function (v) {
      v = v.trim();
      if (!v) return "";
      if (!/^[0-9+()\-\s]+$/.test(v)) return "Use only numbers, spaces, + and - in your phone number.";
      var digits = v.replace(/\D/g, "");
      if (digits.length < 7 || digits.length > 15) return "Enter a phone number with 7 to 15 digits.";
      return "";
    },
    service: function (v) {
      return SERVICES[v] ? "" : "Choose a service.";
    },
    date: function (v) {
      if (!v) return "Choose a date.";
      var d = parseDateString(v);
      if (!d) return "Enter a valid date.";
      if (d < startOfToday()) return "Choose today or a future date.";
      if (d > maxDate) return "We take bookings up to " + MAX_DAYS_AHEAD + " days ahead.";
      if (!HOURS[d.getDay()]) return "We are closed on Sundays. Choose Monday to Saturday.";
      if (slotsFor(v).every(function (s) { return s.disabled; })) return "No times left that day. Choose another date.";
      return "";
    },
    time: function (v) {
      if (fields.time.disabled) return "";   // the date field already explains why
      if (!v) return "Choose a time.";
      var ok = slotsFor(fields.date.value).some(function (s) { return s.value === v && !s.disabled; });
      return ok ? "" : "That time is no longer available. Choose another.";
    }
  };

  function setError(key, message) {
    var input = fields[key];
    var holder = input.closest(".field");
    var errEl = document.getElementById(key + "-error");
    if (message) {
      errEl.textContent = message;
      errEl.hidden = false;
      holder.classList.add("has-error");
      input.setAttribute("aria-invalid", "true");
    } else {
      errEl.textContent = "";
      errEl.hidden = true;
      holder.classList.remove("has-error");
      input.removeAttribute("aria-invalid");
    }
  }

  function validateField(key) {
    var message = validators[key](fields[key].value);
    setError(key, message);
    return message;
  }

  var touched = {};

  Object.keys(fields).forEach(function (key) {
    var input = fields[key];
    input.addEventListener("blur", function () {
      touched[key] = true;
      validateField(key);
    });
    input.addEventListener("input", function () {
      if (touched[key]) validateField(key);
    });
  });

  fields.date.addEventListener("change", function () {
    renderTimeOptions();
    if (touched.time) validateField("time");
  });
  // Some browsers fire "input" but not "change" while a date is typed.
  fields.date.addEventListener("input", function () {
    renderTimeOptions();
  });

  notes.addEventListener("input", function () {
    var left = notes.maxLength - notes.value.length;
    notesCount.textContent = left + (left === 1 ? " character left" : " characters left");
  });

  /* Error summary: lists every problem and links each one to its field. */
  function showSummary(errors) {
    summary.innerHTML = "";
    var p = document.createElement("p");
    p.textContent = errors.length === 1
      ? "Fix 1 field to send your request:"
      : "Fix " + errors.length + " fields to send your request:";
    var ul = document.createElement("ul");
    errors.forEach(function (e) {
      var li = document.createElement("li");
      var a = document.createElement("a");
      a.href = "#" + fields[e.key].id;
      a.textContent = LABELS[e.key] + ": " + e.message;
      a.addEventListener("click", function (ev) {
        ev.preventDefault();
        fields[e.key].focus();
      });
      li.appendChild(a);
      ul.appendChild(li);
    });
    summary.appendChild(p);
    summary.appendChild(ul);
    summary.hidden = false;
  }

  function hideSummary() {
    summary.hidden = true;
    summary.innerHTML = "";
  }

  function collectErrors() {
    var errors = [];
    Object.keys(fields).forEach(function (key) {
      touched[key] = true;
      var message = validateField(key);
      if (message) errors.push({ key: key, message: message });
    });
    return errors;
  }

  function buildConfirmation() {
    var d = parseDateString(fields.date.value);
    var slot = slotsFor(fields.date.value).filter(function (s) { return s.value === fields.time.value; })[0];
    var first = fields.name.value.trim().split(/\s+/)[0];
    confirmationText.textContent =
      "Thanks, " + first + ". We received your request for a " + SERVICES[fields.service.value].toLowerCase() +
      " on " + formatLongDate(d) + " at " + (slot ? slot.label : fields.time.value) +
      ". We will confirm by email at " + fields.email.value.trim() + " within one business day.";
  }

  function finishSuccess() {
    buildConfirmation();
    form.hidden = true;
    hideSummary();
    confirmation.hidden = false;
    confirmation.focus();
    submitBtn.disabled = false;
    submitBtn.textContent = "Request appointment";
  }

  function finishFailure() {
    submitBtn.disabled = false;
    submitBtn.textContent = "Request appointment";
    summary.innerHTML = "";
    var p = document.createElement("p");
    p.textContent = "We could not send your request. Check your connection and try again, or call (555) 0142.";
    summary.appendChild(p);
    summary.hidden = false;
    summary.focus();
  }

  form.addEventListener("submit", function (ev) {
    ev.preventDefault();

    var errors = collectErrors();
    if (errors.length) {
      showSummary(errors);
      summary.focus();
      return;
    }
    hideSummary();

    submitBtn.disabled = true;
    submitBtn.textContent = "Sending…";

    var endpoint = form.getAttribute("data-endpoint");
    if (endpoint) {
      fetch(endpoint, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: new FormData(form)
      }).then(function (res) {
        if (res.ok) finishSuccess(); else finishFailure();
      }).catch(finishFailure);
    } else {
      // Demo mode: no backend, so pretend the request went through.
      setTimeout(finishSuccess, 600);
    }
  });

  newRequestBtn.addEventListener("click", function () {
    form.reset();
    touched = {};
    Object.keys(fields).forEach(function (key) { setError(key, ""); });
    renderTimeOptions();
    notesCount.textContent = notes.maxLength + " characters left";
    confirmation.hidden = true;
    form.hidden = false;
    fields.name.focus();
  });

  /* ---------- Price board "Book" buttons ---------- */

  document.querySelectorAll(".book-link").forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (form.hidden) newRequestBtn.click();
      fields.service.value = btn.getAttribute("data-service");
      touched.service = true;
      validateField("service");
      document.getElementById("book").scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"
      });
      fields.name.focus({ preventScroll: true });
    });
  });

  renderTimeOptions();
})();
