/* AURA HAVEN — COMPLETE WEBSITE JAVASCRIPT */

document.addEventListener("DOMContentLoaded", function () {

  const menuToggle = document.getElementById("menuToggle");
  const mobileMenu = document.getElementById("mobileNavigation");
  const menuIcon = document.getElementById("menuIcon");
  const navbar = document.getElementById("navbar");
  const popup = document.getElementById("bookingPopup");
  const popupForm = document.getElementById("popupBookingForm");

  // MOBILE MENU
  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener("click", function () {
      const open = mobileMenu.classList.toggle("hidden") === false;

      menuToggle.setAttribute("aria-expanded", String(open));
      menuToggle.setAttribute(
        "aria-label",
        open ? "Close navigation" : "Open navigation"
      );

      if (menuIcon) menuIcon.textContent = open ? "✕" : "☰";
    });

    mobileMenu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", closeMobileMenu);
    });

    document.addEventListener("click", function (event) {
      if (
        !mobileMenu.contains(event.target) &&
        !menuToggle.contains(event.target)
      ) {
        closeMobileMenu();
      }
    });
  }

  function closeMobileMenu() {
    if (!mobileMenu || !menuToggle) return;

    mobileMenu.classList.add("hidden");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation");

    if (menuIcon) menuIcon.textContent = "☰";
  }

  // STICKY NAVIGATION
  function updateNavbar() {
    if (navbar) {
      navbar.classList.toggle("nav-scrolled", window.scrollY > 40);
    }
  }

  window.addEventListener("scroll", updateNavbar, { passive: true });
  updateNavbar();

  // SCROLL ANIMATIONS
  if (window.AOS) {
    AOS.init({
      duration: 850,
      easing: "ease-out-cubic",
      once: true,
      offset: 65
    });
  }

  // DATE HELPERS
  function todayString() {
    const d = new Date();

    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  function setupDatePair(checkIn, checkOut) {
    if (!checkIn || !checkOut) return;

    const today = todayString();

    checkIn.min = today;
    checkOut.min = today;

    checkIn.addEventListener("change", function () {

      if (!checkIn.value) {
        checkOut.min = today;
        return;
      }

      const next = new Date(checkIn.value + "T00:00:00");
      next.setDate(next.getDate() + 1);

      const minOut =
        `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-${String(next.getDate()).padStart(2, "0")}`;

      checkOut.min = minOut;

      if (checkOut.value && checkOut.value <= checkIn.value) {
        checkOut.value = "";
      }
    });
  }

  setupDatePair(
    document.getElementById("check_in"),
    document.getElementById("check_out")
  );

  // BOOKING POPUP
  window.openBookingPopup = function (selectedRoom = null) {

    if (!popup) return;

    popup.classList.add("active");
    popup.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    if (
      selectedRoom &&
      popupForm &&
      popupForm.elements.room_type
    ) {
      popupForm.elements.room_type.value = selectedRoom;
    }

    const nameField = document.getElementById("guest_name");

    if (nameField) {
      window.setTimeout(() => nameField.focus(), 80);
    }
  };

  window.closeBookingPopup = function () {

    if (!popup) return;

    popup.classList.remove("active");
    popup.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  };

  document.querySelectorAll(
    'a[href="#bookingPopup"], .open-booking'
  ).forEach(function (link) {

    link.addEventListener("click", function (event) {

      event.preventDefault();

      const roomType = link.getAttribute("data-room");

      window.openBookingPopup(roomType);
    });
  });

  if (popup) {
    popup.addEventListener("click", function (event) {
      if (event.target === popup) {
        window.closeBookingPopup();
      }
    });
  }

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      window.closeBookingPopup();
    }
  });

  // DISPLAY MESSAGE
  function setMessage(element, text, success) {

    if (!element) return;

    element.textContent = text;

    element.style.color = success
      ? "#f1d9a3"
      : "#ffaaaa";
  }

  // CHECK ROOM AVAILABILITY
  async function checkAvailability(form, message, button) {

    if (!form.reportValidity()) return;

    const data = new FormData(form);

    const checkIn = data.get("check_in");
    const checkOut = data.get("check_out");
    const today = todayString();

    if (
      !checkIn ||
      !checkOut ||
      checkIn < today ||
      checkOut <= checkIn
    ) {
      setMessage(
        message,
        "Please select valid dates. Check-out must be after check-in.",
        false
      );

      return;
    }

    const originalText = button ? button.textContent : "";

    if (button) {
      button.disabled = true;
      button.textContent = "Checking...";
    }

    setMessage(
      message,
      "Checking room availability...",
      true
    );

    try {

      // PREPARE FORM DATA
      const params = new URLSearchParams();

      [
        "check_in",
        "check_out",
        "guests",
        "room_type",
        "number_of_rooms"
      ].forEach(function (key) {

        const value = data.get(key);

        if (value !== null) {
          params.set(key, value);
        }
      });

      // SEND REQUEST TO PHP
      const response = await fetch("/api/availability.php", {

        method: "POST",

        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Accept": "application/json",
          "X-Requested-With": "XMLHttpRequest"
        },

        body: params.toString()
      });

      // READ PHP RESPONSE
      const responseText = await response.text();

      let result;

      try {

        result = JSON.parse(responseText);

      } catch (error) {

        console.error(
          "Invalid PHP response:",
          responseText
        );

        throw new Error(
          "PHP is not returning valid JSON. Check availability.php."
        );
      }

      if (!response.ok) {

        throw new Error(
          result.message || "Availability request failed."
        );
      }

      // DISPLAY RESULT
      if (result.available === true) {

        setMessage(
          message,
          result.message || "Rooms are available for your selected dates.",
          true
        );

      } else {

        setMessage(
          message,
          result.message || "No rooms are available for those dates.",
          false
        );
      }

    } catch (error) {

      console.error(
        "Availability check failed:",
        error
      );

      setMessage(
        message,
        error.message || "Unable to check availability. Please try again.",
        false
      );

    } finally {

      if (button) {
        button.disabled = false;
        button.textContent = originalText;
      }
    }
  }

  // POPUP AVAILABILITY BUTTON
  window.checkPopupAvailability = function () {

    const message = document.getElementById(
      "availabilityMessage"
    );

    const button = document.getElementById(
      "popupAvailabilityButton"
    );

    if (popupForm) {
      checkAvailability(popupForm, message, button);
    }
  };

  // BOOKING FORM VALIDATION
  if (popupForm) {

    popupForm.addEventListener("submit", function (event) {

      const checkIn = popupForm.elements.check_in.value;
      const checkOut = popupForm.elements.check_out.value;
      const phone = popupForm.elements.phone.value.trim();

      if (
        !checkIn ||
        !checkOut ||
        checkIn < todayString() ||
        checkOut <= checkIn
      ) {

        event.preventDefault();

        alert(
          "Please select valid check-in and check-out dates."
        );

        return;
      }

      if (!/^[0-9]{10}$/.test(phone)) {

        event.preventDefault();

        alert(
          "Please enter a valid 10-digit phone number."
        );
      }
    });
  }

  // DYNAMIC COPYRIGHT YEAR
  const year = document.getElementById("currentYear");

  if (year) {
    year.textContent = new Date().getFullYear();
  }

});
