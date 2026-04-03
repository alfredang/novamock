/**
 * Personal Income Tax Calculator
 * Computes Singapore resident & non-resident individual income tax
 */
(() => {
  // State
  let residency = "resident";
  let selectedYA = "YA 2026";

  // --- DOM references ---
  const $ = (id) => document.getElementById(id);

  const incomeFields = [
    "employment-income",
    "bonus-income",
    "trade-income",
    "rental-income",
    "other-income",
  ];

  const reliefFields = [
    "cpf-relief",
    "spouse-relief",
    "child-relief",
    "parent-relief",
    "course-fees",
    "srs-relief",
    "nsf-relief",
    "life-insurance",
    "other-deductions",
  ];

  // --- Residency Tab Toggle ---
  document.querySelectorAll("[data-residency]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("[data-residency]").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      residency = btn.dataset.residency;

      const reliefCard = $("reliefs-card");
      const nonResNotice = $("non-resident-notice");
      if (residency === "non-resident") {
        reliefCard.style.display = "none";
        nonResNotice.style.display = "flex";
      } else {
        reliefCard.style.display = "";
        nonResNotice.style.display = "none";
      }
      recalculate();
    });
  });

  // --- YA Select ---
  $("ya-select").addEventListener("change", (e) => {
    selectedYA = e.target.value;
    recalculate();
  });

  // --- Input listeners for real-time recalculation ---
  const debouncedRecalc = Utils.debounce(recalculate, 150);

  [...incomeFields, ...reliefFields, "donations"].forEach((id) => {
    const el = $(id);
    if (el) {
      el.addEventListener("input", () => {
        Utils.validateNumericInput(el);
        debouncedRecalc();
        saveState();
      });
    }
  });

  $("earned-income-age").addEventListener("change", () => {
    recalculate();
    saveState();
  });

  // --- Sample Data ---
  $("btn-sample-data").addEventListener("click", loadSampleData);
  $("btn-reset").addEventListener("click", resetForm);

  function loadSampleData() {
    $("employment-income").value = "85000";
    $("bonus-income").value = "12000";
    $("trade-income").value = "";
    $("rental-income").value = "";
    $("other-income").value = "";
    $("cpf-relief").value = "20400";
    $("spouse-relief").value = "2000";
    $("child-relief").value = "4000";
    $("parent-relief").value = "";
    $("course-fees").value = "";
    $("srs-relief").value = "";
    $("nsf-relief").value = "3000";
    $("life-insurance").value = "";
    $("other-deductions").value = "";
    $("donations").value = "500";
    $("earned-income-age").value = "below55";
    $("sample-banner").classList.add("show");
    recalculate();
    saveState();
  }

  function resetForm() {
    [...incomeFields, ...reliefFields, "donations"].forEach((id) => {
      const el = $(id);
      if (el) el.value = "";
    });
    $("earned-income-age").value = "below55";
    $("sample-banner").classList.remove("show");
    recalculate();
    localStorage.removeItem("novamock-personal-tax");
  }

  // --- Persist to localStorage ---
  function saveState() {
    const data = {};
    [...incomeFields, ...reliefFields, "donations"].forEach((id) => {
      data[id] = $(id) ? $(id).value : "";
    });
    data["earned-income-age"] = $("earned-income-age").value;
    data.residency = residency;
    data.ya = selectedYA;
    Utils.saveFormData("personal-tax", data);
  }

  function loadState() {
    const data = Utils.loadFormData("personal-tax");
    if (!data) return;
    [...incomeFields, ...reliefFields, "donations"].forEach((id) => {
      if ($(id) && data[id]) $(id).value = data[id];
    });
    if (data["earned-income-age"]) $("earned-income-age").value = data["earned-income-age"];
    if (data.residency) {
      residency = data.residency;
      document.querySelectorAll("[data-residency]").forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.residency === residency);
      });
      if (residency === "non-resident") {
        $("reliefs-card").style.display = "none";
        $("non-resident-notice").style.display = "flex";
      }
    }
    if (data.ya) {
      selectedYA = data.ya;
      $("ya-select").value = selectedYA;
    }
    recalculate();
  }

  // --- Core Calculation ---
  function recalculate() {
    const income = getIncomeValues();
    const totalIncome = income.employment + income.bonus + income.trade + income.rental + income.other;

    let totalReliefs = 0;
    let donationDeduction = 0;
    let chargeableIncome = 0;
    let taxPayable = 0;
    let bracketDetails = [];

    if (residency === "resident") {
      // Reliefs
      const earnedIncomeAge = $("earned-income-age").value;
      let earnedRelief = 1000;
      if (earnedIncomeAge === "55to59") earnedRelief = 6000;
      else if (earnedIncomeAge === "60above") earnedRelief = 8000;
      // Only grant earned income relief if there's actual earned income
      if (income.employment + income.bonus + income.trade <= 0) earnedRelief = 0;

      const cpf = Utils.parseNumber($("cpf-relief").value);
      const spouse = Utils.parseNumber($("spouse-relief").value);
      const child = Utils.parseNumber($("child-relief").value);
      const parent = Utils.parseNumber($("parent-relief").value);
      const courses = Math.min(Utils.parseNumber($("course-fees").value), 5500);
      const srs = Utils.parseNumber($("srs-relief").value);
      const nsf = Utils.parseNumber($("nsf-relief").value);
      const lifeIns = Utils.parseNumber($("life-insurance").value);
      const otherDed = Utils.parseNumber($("other-deductions").value);

      totalReliefs = earnedRelief + cpf + spouse + child + parent + courses + srs + nsf + lifeIns + otherDed;

      const donationAmount = Utils.parseNumber($("donations").value);
      donationDeduction = donationAmount * 2.5; // 250% deduction

      chargeableIncome = Math.max(0, totalIncome - donationDeduction - totalReliefs);

      // Progressive tax
      const result = calculateProgressiveTax(chargeableIncome);
      taxPayable = result.totalTax;
      bracketDetails = result.brackets;
    } else {
      // Non-resident
      chargeableIncome = totalIncome;
      const employmentIncome = income.employment + income.bonus;
      const otherNonResIncome = income.trade + income.rental + income.other;

      // Employment: higher of 15% flat or progressive
      const flatEmploymentTax = employmentIncome * 0.15;
      const progressiveResult = calculateProgressiveTax(employmentIncome);
      const employmentTax = Math.max(flatEmploymentTax, progressiveResult.totalTax);

      // Other income: 22% flat
      const otherTax = otherNonResIncome * 0.22;

      taxPayable = employmentTax + otherTax;

      bracketDetails = [
        {
          bracket: "Employment Income",
          income: employmentIncome,
          rate: employmentTax === flatEmploymentTax ? 15 : "Progressive",
          tax: employmentTax,
        },
        { bracket: "Other Income", income: otherNonResIncome, rate: 22, tax: otherTax },
      ];
    }

    // Round to nearest dollar (IRAS rounds down)
    taxPayable = Math.floor(taxPayable);

    // Update UI
    updateSummary(totalIncome, donationDeduction, totalReliefs, chargeableIncome, taxPayable);
    updateBracketTable(bracketDetails, residency);
    updateBarChart(bracketDetails, residency);
    updateStats(totalIncome, totalReliefs + donationDeduction, chargeableIncome, taxPayable);
  }

  function getIncomeValues() {
    return {
      employment: Utils.parseNumber($("employment-income").value),
      bonus: Utils.parseNumber($("bonus-income").value),
      trade: Utils.parseNumber($("trade-income").value),
      rental: Utils.parseNumber($("rental-income").value),
      other: Utils.parseNumber($("other-income").value),
    };
  }

  function calculateProgressiveTax(chargeableIncome) {
    const brackets = TAX_DATA.personalTaxBrackets[selectedYA];
    if (!brackets) return { totalTax: 0, brackets: [] };

    let totalTax = 0;
    const details = [];

    for (const bracket of brackets) {
      if (chargeableIncome <= 0) break;
      if (chargeableIncome < bracket.min) break;

      const bracketMax = bracket.max === Infinity ? chargeableIncome : bracket.max;
      const taxableInBracket = Math.min(chargeableIncome, bracketMax) - (bracket.min - 1);
      const taxInBracket = (taxableInBracket * bracket.rate) / 100;

      if (taxableInBracket > 0) {
        details.push({
          bracket: bracket.max === Infinity
            ? `Above ${Utils.formatCurrency(bracket.min - 1)}`
            : `${Utils.formatCurrency(bracket.min === 0 ? 0 : bracket.min)} – ${Utils.formatCurrency(bracket.max)}`,
          income: taxableInBracket,
          rate: bracket.rate,
          tax: taxInBracket,
        });
        totalTax += taxInBracket;
      }
    }

    return { totalTax, brackets: details };
  }

  // --- UI Updates ---
  function updateSummary(totalIncome, donationDed, reliefs, chargeable, tax) {
    $("sum-total-income").textContent = Utils.formatCurrency(totalIncome);
    $("sum-donations").textContent = `−${Utils.formatCurrency(donationDed)}`;
    $("sum-reliefs").textContent = `−${Utils.formatCurrency(reliefs)}`;
    $("sum-chargeable").textContent = Utils.formatCurrency(chargeable);
    $("sum-tax-payable").textContent = Utils.formatCurrency(tax);

    const effectiveRate = totalIncome > 0 ? (tax / totalIncome) * 100 : 0;
    $("sum-effective-rate").textContent = Utils.formatPercent(effectiveRate);
  }

  function updateStats(totalIncome, totalDeductions, chargeable, tax) {
    $("stat-income").textContent = Utils.formatCurrency(totalIncome);
    $("stat-deductions").textContent = Utils.formatCurrency(totalDeductions);
    $("stat-chargeable").textContent = Utils.formatCurrency(chargeable);
    $("stat-tax").textContent = Utils.formatCurrency(tax);
  }

  function updateBracketTable(brackets, type) {
    const container = $("bracket-breakdown");
    if (!brackets.length) {
      container.innerHTML = '<p style="color: var(--text-tertiary); font-size: 0.9rem;">Enter your income above to see the bracket-by-bracket breakdown.</p>';
      return;
    }

    const totalTax = brackets.reduce((sum, b) => sum + b.tax, 0);

    let html = `<table class="breakdown-table">
      <thead><tr>
        <th>Bracket</th>
        <th>Taxable Amount</th>
        <th>Rate</th>
        <th>Tax</th>
      </tr></thead><tbody>`;

    for (const b of brackets) {
      const isZero = b.rate === 0;
      html += `<tr${isZero ? ' style="opacity:0.5"' : ""}>
        <td>${b.bracket}</td>
        <td>${Utils.formatCurrency(b.income)}</td>
        <td>${typeof b.rate === "number" ? b.rate + "%" : b.rate}</td>
        <td>${Utils.formatCurrency(b.tax)}</td>
      </tr>`;
    }

    html += `<tr class="highlight-row">
      <td colspan="3"><strong>Total Tax</strong></td>
      <td><strong>${Utils.formatCurrency(totalTax)}</strong></td>
    </tr>`;

    html += "</tbody></table>";
    container.innerHTML = html;
  }

  function updateBarChart(brackets, type) {
    const container = $("tax-bar-chart");
    const taxBrackets = brackets.filter((b) => b.tax > 0);

    if (!taxBrackets.length) {
      container.innerHTML = '<p style="color: var(--text-tertiary); font-size: 0.9rem;">Chart will appear once income is entered.</p>';
      return;
    }

    const maxTax = Math.max(...taxBrackets.map((b) => b.tax));

    let html = '<div class="bar-chart">';
    for (const b of taxBrackets) {
      const pct = maxTax > 0 ? (b.tax / maxTax) * 100 : 0;
      const rateLabel = typeof b.rate === "number" ? b.rate + "%" : b.rate;
      html += `<div class="bar-row">
        <span class="bar-label">${rateLabel}</span>
        <div class="bar-track"><div class="bar-fill" style="width: ${pct}%"></div></div>
        <span class="bar-value">${Utils.formatCurrency(b.tax)}</span>
      </div>`;
    }
    html += "</div>";
    container.innerHTML = html;
  }

  // --- Init ---
  loadState();
  if (!Utils.loadFormData("personal-tax")) {
    recalculate(); // ensure initial render
  }
})();
