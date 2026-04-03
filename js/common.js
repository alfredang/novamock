/**
 * Common utility functions shared across all pages
 */
const Utils = {
  /**
   * Format number as Singapore Dollar currency
   */
  formatCurrency(amount) {
    if (isNaN(amount) || amount === null) return "$0.00";
    return new Intl.NumberFormat("en-SG", {
      style: "currency",
      currency: "SGD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  },

  /**
   * Format number with commas
   */
  formatNumber(num) {
    if (isNaN(num)) return "0";
    return new Intl.NumberFormat("en-SG").format(num);
  },

  /**
   * Format percentage
   */
  formatPercent(value) {
    return `${value.toFixed(1)}%`;
  },

  /**
   * Parse a currency/number input string to a float
   */
  parseNumber(value) {
    if (!value) return 0;
    const cleaned = String(value).replace(/[^0-9.\-]/g, "");
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  },

  /**
   * Clamp a value between min and max
   */
  clamp(val, min, max) {
    return Math.min(Math.max(val, min), max);
  },

  /**
   * Debounce function to limit rapid calls
   */
  debounce(fn, delay = 300) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  },

  /**
   * Save form data to localStorage
   */
  saveFormData(key, data) {
    try {
      localStorage.setItem(`novamock-${key}`, JSON.stringify(data));
    } catch (e) {
      console.warn("Could not save form data:", e);
    }
  },

  /**
   * Load form data from localStorage
   */
  loadFormData(key) {
    try {
      const data = localStorage.getItem(`novamock-${key}`);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  /**
   * Validate a numeric input field - highlight if invalid
   */
  validateNumericInput(input) {
    const val = input.value.trim();
    if (val === "") {
      input.classList.remove("input-error");
      return true;
    }
    const num = parseFloat(val.replace(/,/g, ""));
    if (isNaN(num) || num < 0) {
      input.classList.add("input-error");
      return false;
    }
    input.classList.remove("input-error");
    return true;
  },

  /**
   * Create a tooltip element
   */
  createTooltip(text) {
    const span = document.createElement("span");
    span.className = "tooltip-icon";
    span.setAttribute("tabindex", "0");
    span.setAttribute("aria-label", text);
    span.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
    const tip = document.createElement("span");
    tip.className = "tooltip-text";
    tip.textContent = text;
    span.appendChild(tip);
    return span;
  },

  /**
   * Animate a number from 0 to target
   */
  animateValue(element, start, end, duration = 500) {
    const range = end - start;
    const startTime = performance.now();
    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const current = start + range * eased;
      element.textContent = Utils.formatCurrency(current);
      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  },

  /**
   * Set active nav link based on current page
   */
  setActiveNav() {
    const path = window.location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll(".nav-link").forEach((link) => {
      const href = link.getAttribute("href");
      link.classList.toggle("active", href === path);
    });
  },

  /**
   * Generate printable summary
   */
  printSummary() {
    window.print();
  },

  /**
   * Initialize mobile nav toggle
   */
  initMobileNav() {
    const toggle = document.querySelector(".mobile-nav-toggle");
    const nav = document.querySelector(".nav-links");
    if (toggle && nav) {
      toggle.addEventListener("click", () => {
        nav.classList.toggle("open");
        toggle.classList.toggle("open");
      });
    }
  },
};

document.addEventListener("DOMContentLoaded", () => {
  Utils.setActiveNav();
  Utils.initMobileNav();
});
