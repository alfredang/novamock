/**
 * Corporate Income Tax Calculator
 * Computes Singapore corporate tax at 17% flat rate
 * with Start-Up Tax Exemption, Partial Tax Exemption, and CIT Rebate
 */
(() => {
  let selectedScheme = "partial";
  let selectedYA = "YA 2026";

  const $ = (id) => document.getElementById(id);

  // --- Scheme Tabs ---
  document.querySelectorAll("#exemption-tabs .tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("#exemption-tabs .tab-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      selectedScheme = btn.dataset.scheme;
      document.querySelectorAll(".scheme-info").forEach((el) => (el.style.display = "none"));
      $(`scheme-${selectedScheme}`).style.display = "";
      recalculate();
      saveState();
    });
  });

  // --- YA Select ---
  $("corp-ya-select").addEventListener("change", (e) => {
    selectedYA = e.target.value;
    updateRebateInfo();
    recalculate();
    saveState();
  });

  // --- Income Input ---
  const debouncedRecalc = Utils.debounce(recalculate, 150);
  $("chargeable-income").addEventListener("input", () => {
    Utils.validateNumericInput($("chargeable-income"));
    debouncedRecalc();
    saveState();
  });

  // --- Rebate Toggle ---
  $("apply-rebate").addEventListener("change", () => {
    recalculate();
    saveState();
  });

  // --- Sample / Reset ---
  $("btn-corp-sample").addEventListener("click", () => {
    $("chargeable-income").value = "350000";
    $("apply-rebate").checked = true;
    $("corp-sample-banner").classList.add("show");
    recalculate();
    saveState();
  });

  $("btn-corp-reset").addEventListener("click", () => {
    $("chargeable-income").value = "";
    $("apply-rebate").checked = true;
    $("corp-sample-banner").classList.remove("show");
    selectedScheme = "partial";
    document.querySelectorAll("#exemption-tabs .tab-btn").forEach((b) => {
      b.classList.toggle("active", b.dataset.scheme === "partial");
    });
    document.querySelectorAll(".scheme-info").forEach((el) => (el.style.display = "none"));
    $("scheme-partial").style.display = "";
    recalculate();
    localStorage.removeItem("novamock-corporate-tax");
  });

  // --- Rebate info text ---
  function updateRebateInfo() {
    const rebate = TAX_DATA.citRebate[selectedYA];
    const desc = $("rebate-description");
    if (rebate) {
      desc.innerHTML = `<strong>${selectedYA}:</strong> ${rebate.rate}% CIT rebate, capped at ${Utils.formatCurrency(rebate.cap)}.`;
    } else {
      desc.innerHTML = `<strong>${selectedYA}:</strong> No CIT rebate data available.`;
    }
  }

  // --- Core Calculation ---
  function recalculate() {
    const ci = Utils.parseNumber($("chargeable-income").value);
    const applyRebate = $("apply-rebate").checked;

    // 1. Calculate exemption
    let exemptAmount = 0;
    const steps = [];

    if (selectedScheme === "startup") {
      // Start-Up Tax Exemption
      const sute = TAX_DATA.startUpExemption;
      const first100k = Math.min(ci, sute.first100k.threshold);
      const exemptFirst = first100k * (sute.first100k.exemptionRate / 100);
      const remaining = Math.max(0, ci - sute.first100k.threshold);
      const next100k = Math.min(remaining, sute.next100k.threshold);
      const exemptNext = next100k * (sute.next100k.exemptionRate / 100);
      exemptAmount = exemptFirst + exemptNext;

      steps.push({
        label: `First ${Utils.formatCurrency(sute.first100k.threshold)} @ 75% exempt`,
        amount: first100k,
        exempt: exemptFirst,
      });
      steps.push({
        label: `Next ${Utils.formatCurrency(sute.next100k.threshold)} @ 50% exempt`,
        amount: next100k,
        exempt: exemptNext,
      });
    } else if (selectedScheme === "partial") {
      // Partial Tax Exemption
      const pte = TAX_DATA.partialExemption;
      const first10k = Math.min(ci, pte.first10k.threshold);
      const exemptFirst = first10k * (pte.first10k.exemptionRate / 100);
      const remaining = Math.max(0, ci - pte.first10k.threshold);
      const next190k = Math.min(remaining, pte.next190k.threshold);
      const exemptNext = next190k * (pte.next190k.exemptionRate / 100);
      exemptAmount = exemptFirst + exemptNext;

      steps.push({
        label: `First ${Utils.formatCurrency(pte.first10k.threshold)} @ 75% exempt`,
        amount: first10k,
        exempt: exemptFirst,
      });
      steps.push({
        label: `Next ${Utils.formatCurrency(pte.next190k.threshold)} @ 50% exempt`,
        amount: next190k,
        exempt: exemptNext,
      });
    }

    // 2. Taxable income after exemption
    const taxableIncome = Math.max(0, ci - exemptAmount);

    // 3. Gross tax at 17%
    const grossTax = taxableIncome * (TAX_DATA.corporateTaxRate / 100);

    // 4. CIT Rebate
    let rebateAmount = 0;
    const rebateData = TAX_DATA.citRebate[selectedYA];
    if (applyRebate && rebateData) {
      rebateAmount = Math.min(grossTax * (rebateData.rate / 100), rebateData.cap);
    }

    // 5. Net tax
    const netTax = Math.max(0, Math.floor(grossTax - rebateAmount));

    // Update UI
    updateSummary(ci, exemptAmount, taxableIncome, grossTax, rebateAmount, netTax);
    updateBreakdown(ci, steps, exemptAmount, taxableIncome, grossTax, rebateAmount, netTax, applyRebate);
    updateBarChart(ci, exemptAmount, grossTax, rebateAmount, netTax);
    updateStats(ci, exemptAmount, rebateAmount, netTax);
  }

  function updateSummary(ci, exempt, taxable, gross, rebate, net) {
    $("corp-sum-ci").textContent = Utils.formatCurrency(ci);
    $("corp-sum-exempt").textContent = `−${Utils.formatCurrency(exempt)}`;
    $("corp-sum-taxable").textContent = Utils.formatCurrency(taxable);
    $("corp-sum-gross-tax").textContent = Utils.formatCurrency(gross);
    $("corp-sum-rebate").textContent = `−${Utils.formatCurrency(rebate)}`;
    $("corp-sum-net-tax").textContent = Utils.formatCurrency(net);

    const effectiveRate = ci > 0 ? (net / ci) * 100 : 0;
    $("corp-effective-rate").textContent = Utils.formatPercent(effectiveRate);
  }

  function updateStats(ci, exempt, rebate, net) {
    $("stat-ci").textContent = Utils.formatCurrency(ci);
    $("stat-exempt").textContent = Utils.formatCurrency(exempt);
    $("stat-rebate").textContent = Utils.formatCurrency(rebate);
    $("stat-ctax").textContent = Utils.formatCurrency(net);
  }

  function updateBreakdown(ci, steps, exempt, taxable, gross, rebate, net, applyRebate) {
    const container = $("corp-breakdown");
    if (ci <= 0) {
      container.innerHTML = '<p style="color: var(--text-tertiary); font-size: 0.9rem;">Enter chargeable income above to see the step-by-step calculation.</p>';
      return;
    }

    let html = `<table class="breakdown-table">
      <thead><tr><th>Step</th><th>Details</th><th>Amount</th></tr></thead><tbody>`;

    html += `<tr><td>Chargeable Income</td><td></td><td>${Utils.formatCurrency(ci)}</td></tr>`;

    // Exemption steps
    if (steps.length > 0) {
      for (const step of steps) {
        html += `<tr><td>${step.label}</td><td>On ${Utils.formatCurrency(step.amount)}</td><td>−${Utils.formatCurrency(step.exempt)}</td></tr>`;
      }
      html += `<tr><td><strong>Total Exemption</strong></td><td></td><td><strong>−${Utils.formatCurrency(exempt)}</strong></td></tr>`;
    }

    html += `<tr><td>Taxable Income</td><td>After exemption</td><td>${Utils.formatCurrency(taxable)}</td></tr>`;
    html += `<tr><td>Tax @ 17%</td><td>${Utils.formatCurrency(taxable)} × 17%</td><td>${Utils.formatCurrency(gross)}</td></tr>`;

    if (applyRebate && rebate > 0) {
      const rebateData = TAX_DATA.citRebate[selectedYA];
      html += `<tr><td>CIT Rebate</td><td>${rebateData.rate}% (cap ${Utils.formatCurrency(rebateData.cap)})</td><td>−${Utils.formatCurrency(rebate)}</td></tr>`;
    }

    html += `<tr class="highlight-row"><td><strong>Net Tax Payable</strong></td><td></td><td><strong>${Utils.formatCurrency(net)}</strong></td></tr>`;
    html += "</tbody></table>";

    container.innerHTML = html;
  }

  function updateBarChart(ci, exempt, gross, rebate, net) {
    const container = $("corp-bar-chart");
    if (ci <= 0) {
      container.innerHTML = '<p style="color: var(--text-tertiary); font-size: 0.9rem;">Chart will appear once income is entered.</p>';
      return;
    }

    const items = [
      { label: "Chargeable Income", value: ci },
      { label: "Exempt Amount", value: exempt },
      { label: "Gross Tax (17%)", value: gross },
      { label: "CIT Rebate", value: rebate },
      { label: "Net Tax Payable", value: net },
    ];

    const maxVal = Math.max(...items.map((i) => i.value));

    let html = '<div class="bar-chart">';
    for (const item of items) {
      const pct = maxVal > 0 ? (item.value / maxVal) * 100 : 0;
      html += `<div class="bar-row">
        <span class="bar-label">${item.label}</span>
        <div class="bar-track"><div class="bar-fill" style="width: ${pct}%"></div></div>
        <span class="bar-value">${Utils.formatCurrency(item.value)}</span>
      </div>`;
    }
    html += "</div>";
    container.innerHTML = html;
  }

  // --- Persistence ---
  function saveState() {
    Utils.saveFormData("corporate-tax", {
      ci: $("chargeable-income").value,
      scheme: selectedScheme,
      ya: selectedYA,
      rebate: $("apply-rebate").checked,
    });
  }

  function loadState() {
    const data = Utils.loadFormData("corporate-tax");
    if (!data) return;
    if (data.ci) $("chargeable-income").value = data.ci;
    if (data.scheme) {
      selectedScheme = data.scheme;
      document.querySelectorAll("#exemption-tabs .tab-btn").forEach((b) => {
        b.classList.toggle("active", b.dataset.scheme === selectedScheme);
      });
      document.querySelectorAll(".scheme-info").forEach((el) => (el.style.display = "none"));
      $(`scheme-${selectedScheme}`).style.display = "";
    }
    if (data.ya) {
      selectedYA = data.ya;
      $("corp-ya-select").value = selectedYA;
    }
    if (typeof data.rebate === "boolean") {
      $("apply-rebate").checked = data.rebate;
    }
    updateRebateInfo();
    recalculate();
  }

  // --- Init ---
  updateRebateInfo();
  loadState();
  if (!Utils.loadFormData("corporate-tax")) {
    recalculate();
  }
})();
