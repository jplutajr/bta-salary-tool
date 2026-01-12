#!/usr/bin/env node

const {
  stepForYear,
  computeCellValue,
  computeHealthInsuranceNet
} = require("../salary-math");

const IND_PREM_MONTH = 1479.53;
const FAM_PREM_MONTH = 3367.8;
const IND_PREM_YEAR = IND_PREM_MONTH * 12;
const FAM_PREM_YEAR = FAM_PREM_MONTH * 12;

function simulateLookup({
  scenarioChoice,
  uiParams,
  scenarios,
  baseTable,
  year,
  step,
  column,
  showHI
}) {
  const findBase = (st, col) => {
    const row = baseTable.find(r => r.step === st);
    return row ? row[col] : null;
  };

  const renderOne = (label, params) => {
    const resolvedParams = params || uiParams;
    const st = stepForYear(step, year);
    const base = findBase(st, column);
    if (base == null) return { label, error: "No data for that step/column." };
    const gross = +computeCellValue(base, year, resolvedParams).toFixed(2);
    if (!showHI) return { label, gross };
    const pct = params?.hi_contrib?.[year] ?? uiParams.hi_contrib[year];
    return {
      label,
      gross,
      indNet: computeHealthInsuranceNet(gross, pct, IND_PREM_YEAR),
      famNet: computeHealthInsuranceNet(gross, pct, FAM_PREM_YEAR)
    };
  };

  if (scenarioChoice === "A") {
    if (!scenarios.A) return { missing: ["Scenario A"], results: [] };
    return { missing: [], results: [renderOne("Scenario A", scenarios.A)] };
  }
  if (scenarioChoice === "B") {
    if (!scenarios.B) return { missing: ["Scenario B"], results: [] };
    return { missing: [], results: [renderOne("Scenario B", scenarios.B)] };
  }
  if (scenarioChoice === "both") {
    const missing = [];
    const results = [];
    if (scenarios.A) results.push(renderOne("Scenario A", scenarios.A));
    else missing.push("Scenario A");
    if (scenarios.B) results.push(renderOne("Scenario B", scenarios.B));
    else missing.push("Scenario B");
    return { missing, results };
  }
  return { missing: [], results: [renderOne("Current UI", null)] };
}

function simulateRosterExport({
  scenarioChoice,
  roster,
  baseTable,
  year,
  uiParams,
  scenarios
}) {
  const findBase = (st, col) => {
    const row = baseTable.find(r => r.step === st);
    return row ? row[col] : null;
  };
  const computeSalary = (params, st, col, fte) => {
    const base = findBase(st, col);
    if (base == null) return null;
    return +computeCellValue(base, year, params).toFixed(2) * (fte || 1);
  };
  if (scenarioChoice === "both") {
    return roster.map(r => {
      const st = stepForYear(+r.Step || 1, year);
      return {
        Salary_A: scenarios.A ? computeSalary(scenarios.A, st, r.Column, +r.FTE || 1) : null,
        Salary_B: scenarios.B ? computeSalary(scenarios.B, st, r.Column, +r.FTE || 1) : null
      };
    });
  }
  const params =
    scenarioChoice === "A" ? scenarios.A :
    scenarioChoice === "B" ? scenarios.B :
    uiParams;
  return roster.map(r => {
    const st = stepForYear(+r.Step || 1, year);
    return { Salary: computeSalary(params, st, r.Column, +r.FTE || 1) };
  });
}

function assertAlmostEqual(actual, expected, label, tolerance = 0.01) {
  const diff = Math.abs(actual - expected);
  if (diff > tolerance) {
    throw new Error(`${label}: expected ${expected}, got ${actual} (diff ${diff})`);
  }
}

function runTests() {
  const tests = [];

  tests.push(() => {
    const params = { increases: { 1: { flat: 1000, rate: 0.02 } } };
    const actual = +computeCellValue(50000, 1, params).toFixed(2);
    assertAlmostEqual(actual, 52020, "flat then percent year1");
  });

  tests.push(() => {
    const params = {
      increases: {
        1: { flat: 1000, rate: 0.02 },
        2: { flat: 500, rate: 0.03 }
      }
    };
    const actual = +computeCellValue(50000, 2, params).toFixed(2);
    assertAlmostEqual(actual, 54095.6, "flat then percent year2");
  });

  tests.push(() => {
    const actual = stepForYear(1, 1);
    assertAlmostEqual(actual, 1, "step stays year1");
  });

  tests.push(() => {
    const actual = stepForYear(20, 5);
    assertAlmostEqual(actual, 22, "step capped at 22");
  });

  tests.push(() => {
    const actual = stepForYear(22, 3);
    assertAlmostEqual(actual, 22, "step stays at max");
  });

  tests.push(() => {
    const actual = computeHealthInsuranceNet(100000, 0.19, IND_PREM_YEAR);
    assertAlmostEqual(actual, 96626.67, "HI net individual");
  });

  tests.push(() => {
    const actual = computeHealthInsuranceNet(100000, 0.19, FAM_PREM_YEAR);
    assertAlmostEqual(actual, 92321.42, "HI net family");
  });

  tests.push(() => {
    const params = { increases: { 1: { flat: 1200, rate: 0.0275 } } };
    const actual = +computeCellValue(52156, 1, params).toFixed(2);
    assertAlmostEqual(actual, 54823.29, "sample schedule cell math");
  });

  tests.push(() => {
    const baseTable = [{ step: 1, BA: 50000 }];
    const uiParams = { increases: { 1: { flat: 1000, rate: 0.02 } }, hi_contrib: { 1: 0.19 } };
    const scenarios = { A: { increases: { 1: { flat: 0, rate: 0.05 } }, hi_contrib: { 1: 0.1 } }, B: null };
    const { results } = simulateLookup({
      scenarioChoice: "ui",
      uiParams,
      scenarios,
      baseTable,
      year: 1,
      step: 1,
      column: "BA",
      showHI: false
    });
    assertAlmostEqual(results[0].gross, 52020, "lookup uses current UI by default");
  });

  tests.push(() => {
    const baseTable = [{ step: 1, BA: 50000 }];
    const uiParams = { increases: { 1: { flat: 1000, rate: 0.02 } }, hi_contrib: { 1: 0.19 } };
    const scenarios = { A: { increases: { 1: { flat: 0, rate: 0.05 } }, hi_contrib: { 1: 0.1 } }, B: null };
    const uiResult = simulateLookup({
      scenarioChoice: "ui",
      uiParams,
      scenarios,
      baseTable,
      year: 1,
      step: 1,
      column: "BA",
      showHI: true
    }).results[0];
    const aResult = simulateLookup({
      scenarioChoice: "A",
      uiParams,
      scenarios,
      baseTable,
      year: 1,
      step: 1,
      column: "BA",
      showHI: true
    }).results[0];
    assertAlmostEqual(uiResult.gross, 52020, "lookup UI gross");
    assertAlmostEqual(aResult.gross, 52500, "lookup Scenario A gross");
    assertAlmostEqual(uiResult.indNet, 48646.67, "lookup UI HI net");
    assertAlmostEqual(aResult.indNet, 50724.56, "lookup Scenario A HI net");
  });

  tests.push(() => {
    const baseTable = [{ step: 1, BA: 50000 }];
    const uiParams = { increases: { 1: { flat: 1000, rate: 0.02 } }, hi_contrib: { 1: 0.19 } };
    const scenarios = { A: { increases: { 1: { flat: 0, rate: 0.05 } }, hi_contrib: { 1: 0.1 } }, B: null };
    const { missing, results } = simulateLookup({
      scenarioChoice: "both",
      uiParams,
      scenarios,
      baseTable,
      year: 1,
      step: 1,
      column: "BA",
      showHI: false
    });
    if (missing.length !== 1 || missing[0] !== "Scenario B") {
      throw new Error("both scenario missing list incorrect");
    }
    if (results.length !== 1 || results[0].label !== "Scenario A") {
      throw new Error("both scenario results incorrect");
    }
  });

  tests.push(() => {
    const baseTable = [{ step: 1, BA: 50000 }];
    const roster = [{ Step: 1, Column: "BA", FTE: 1 }];
    const uiParams = { increases: { 1: { flat: 1000, rate: 0.02 } }, hi_contrib: { 1: 0.19 } };
    const scenarios = { A: { increases: { 1: { flat: 0, rate: 0.05 } } }, B: null };
    const result = simulateRosterExport({
      scenarioChoice: "ui",
      roster,
      baseTable,
      year: 1,
      uiParams,
      scenarios
    });
    assertAlmostEqual(result[0].Salary, 52020, "export uses current UI by default");
  });

  tests.push(() => {
    const baseTable = [{ step: 1, BA: 50000 }];
    const roster = [{ Step: 1, Column: "BA", FTE: 1 }];
    const uiParams = { increases: { 1: { flat: 1000, rate: 0.02 } } };
    const scenarios = { A: { increases: { 1: { flat: 0, rate: 0.05 } } }, B: null };
    const result = simulateRosterExport({
      scenarioChoice: "A",
      roster,
      baseTable,
      year: 1,
      uiParams,
      scenarios
    });
    assertAlmostEqual(result[0].Salary, 52500, "export Scenario A differs");
  });

  tests.push(() => {
    const baseTable = [{ step: 1, BA: 50000 }];
    const roster = [{ Step: 1, Column: "BA", FTE: 1 }];
    const uiParams = { increases: { 1: { flat: 1000, rate: 0.02 } } };
    const scenarios = { A: { increases: { 1: { flat: 0, rate: 0.05 } } }, B: null };
    const result = simulateRosterExport({
      scenarioChoice: "both",
      roster,
      baseTable,
      year: 1,
      uiParams,
      scenarios
    });
    if (!("Salary_A" in result[0]) || !("Salary_B" in result[0])) {
      throw new Error("export both missing Salary_A/Salary_B columns");
    }
    assertAlmostEqual(result[0].Salary_A, 52500, "export both salary A");
    if (result[0].Salary_B !== null) {
      throw new Error("export both salary B should be null when missing");
    }
  });

  let passed = 0;
  tests.forEach((testFn, index) => {
    try {
      testFn();
      passed += 1;
    } catch (error) {
      console.error(`Test ${index + 1} failed: ${error.message}`);
      process.exitCode = 1;
    }
  });

  if (passed === tests.length) {
    console.log(`All ${passed} tests passed.`);
  } else {
    console.log(`${passed}/${tests.length} tests passed.`);
  }
}

runTests();
