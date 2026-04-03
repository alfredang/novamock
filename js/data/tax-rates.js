/**
 * Singapore Tax Rates Data
 * Based on official IRAS guidance
 * https://www.iras.gov.sg/taxes/individual-income-tax/basics-of-individual-income-tax/tax-residency-and-tax-rates/individual-income-tax-rates
 */

const TAX_DATA = {
  // Personal income tax - progressive rates for tax residents
  // Applicable from YA 2024 onwards
  personalTaxBrackets: {
    "YA 2024": [
      { min: 0, max: 20000, rate: 0, prevCumTax: 0 },
      { min: 20001, max: 30000, rate: 2, prevCumTax: 0 },
      { min: 30001, max: 40000, rate: 3.5, prevCumTax: 200 },
      { min: 40001, max: 80000, rate: 7, prevCumTax: 550 },
      { min: 80001, max: 120000, rate: 11.5, prevCumTax: 3350 },
      { min: 120001, max: 160000, rate: 15, prevCumTax: 7950 },
      { min: 160001, max: 200000, rate: 18, prevCumTax: 13950 },
      { min: 200001, max: 240000, rate: 19, prevCumTax: 21150 },
      { min: 240001, max: 280000, rate: 19.5, prevCumTax: 28750 },
      { min: 280001, max: 320000, rate: 20, prevCumTax: 36550 },
      { min: 320001, max: 500000, rate: 22, prevCumTax: 44550 },
      { min: 500001, max: 1000000, rate: 23, prevCumTax: 84150 },
      { min: 1000001, max: Infinity, rate: 24, prevCumTax: 199150 },
    ],
    "YA 2025": [
      { min: 0, max: 20000, rate: 0, prevCumTax: 0 },
      { min: 20001, max: 30000, rate: 2, prevCumTax: 0 },
      { min: 30001, max: 40000, rate: 3.5, prevCumTax: 200 },
      { min: 40001, max: 80000, rate: 7, prevCumTax: 550 },
      { min: 80001, max: 120000, rate: 11.5, prevCumTax: 3350 },
      { min: 120001, max: 160000, rate: 15, prevCumTax: 7950 },
      { min: 160001, max: 200000, rate: 18, prevCumTax: 13950 },
      { min: 200001, max: 240000, rate: 19, prevCumTax: 21150 },
      { min: 240001, max: 280000, rate: 19.5, prevCumTax: 28750 },
      { min: 280001, max: 320000, rate: 20, prevCumTax: 36550 },
      { min: 320001, max: 500000, rate: 22, prevCumTax: 44550 },
      { min: 500001, max: 1000000, rate: 23, prevCumTax: 84150 },
      { min: 1000001, max: Infinity, rate: 24, prevCumTax: 199150 },
    ],
    "YA 2026": [
      { min: 0, max: 20000, rate: 0, prevCumTax: 0 },
      { min: 20001, max: 30000, rate: 2, prevCumTax: 0 },
      { min: 30001, max: 40000, rate: 3.5, prevCumTax: 200 },
      { min: 40001, max: 80000, rate: 7, prevCumTax: 550 },
      { min: 80001, max: 120000, rate: 11.5, prevCumTax: 3350 },
      { min: 120001, max: 160000, rate: 15, prevCumTax: 7950 },
      { min: 160001, max: 200000, rate: 18, prevCumTax: 13950 },
      { min: 200001, max: 240000, rate: 19, prevCumTax: 21150 },
      { min: 240001, max: 280000, rate: 19.5, prevCumTax: 28750 },
      { min: 280001, max: 320000, rate: 20, prevCumTax: 36550 },
      { min: 320001, max: 500000, rate: 22, prevCumTax: 44550 },
      { min: 500001, max: 1000000, rate: 23, prevCumTax: 84150 },
      { min: 1000001, max: Infinity, rate: 24, prevCumTax: 199150 },
    ],
  },

  // Non-resident flat rate
  nonResidentRate: 22, // or 15% for employment income (whichever gives higher tax)
  nonResidentEmploymentRate: 15,

  // Corporate income tax
  corporateTaxRate: 17,

  // Start-up Tax Exemption (SUTE) - for first 3 consecutive YAs
  startUpExemption: {
    first100k: { threshold: 100000, exemptionRate: 75 }, // 75% exemption on first $100,000
    next100k: { threshold: 100000, exemptionRate: 50 },  // 50% exemption on next $100,000
  },

  // Partial Tax Exemption (PTE) - for all companies
  partialExemption: {
    first10k: { threshold: 10000, exemptionRate: 75 },  // 75% exemption on first $10,000
    next190k: { threshold: 190000, exemptionRate: 50 }, // 50% exemption on next $190,000
  },

  // CIT Rebate by Year of Assessment
  citRebate: {
    "YA 2024": { rate: 50, cap: 40000 },
    "YA 2025": { rate: 50, cap: 40000 },
    "YA 2026": { rate: 40, cap: 30000 },
  },

  // Common personal reliefs (simplified)
  personalReliefs: {
    earnedIncomeRelief: {
      below55: 1000,
      age55to59: 6000,
      age60above: 8000,
    },
    cpfRelief: {
      maxOrdinary: 37740, // max CPF contribution cap (employee)
    },
    nsfRelief: {
      nsmanSelf: 3000,
      nsmanSelfKey: 5000,
    },
    spouseRelief: 2000,
    qualifyingChildRelief: 4000,  // per child
    workingMotherChildRelief: {
      first: 15,   // % of earned income
      second: 20,
      thirdAndSub: 25,
    },
    parentRelief: {
      notLivingTogether: 5500,
      livingTogether: 9000,
    },
    handicappedParentRelief: {
      notLivingTogether: 10000,
      livingTogether: 14000,
    },
    grandparentCaregiverRelief: 3000,
    handicappedSpouseRelief: 5500,
    handicappedChildRelief: 7500,
    lifeInsuranceRelief: "capped", // capped at CPF contribution
    courseFeesRelief: 5500,
    foreignDomesticWorkerLevyRelief: "2x levy",
    donationsDeduction: 2.5, // multiplier (250% of donation)
    srsRelief: {
      citizen: 15300,
      foreigner: 35700,
    },
  },

  // Supported Years of Assessment
  supportedYears: ["YA 2024", "YA 2025", "YA 2026"],
  defaultYear: "YA 2026",
};
