import { useEffect, useMemo, useState } from "react";

const initialPlants = [
  {
    id: "plant-1",
    name: "Northside MSW plant",
    technology: "Municipal solid waste",
    capacityMw: 18,
    capacityUtilizationPercent: 78,
    dailyWasteTonnes: 240,
    capitalCostCrore: 140,
  },
  {
    id: "plant-2",
    name: "Riverside RDF line",
    technology: "Refuse-derived fuel",
    capacityMw: 12,
    capacityUtilizationPercent: 82,
    dailyWasteTonnes: 190,
    capitalCostCrore: 95,
  },
  {
    id: "plant-3",
    name: "East district recovery",
    technology: "Municipal solid waste",
    capacityMw: 8,
    capacityUtilizationPercent: 84,
    dailyWasteTonnes: 120,
    capitalCostCrore: 55,
  },
  {
    id: "plant-4",
    name: "South organic recovery",
    technology: "Waste recovery",
    capacityMw: 5,
    capacityUtilizationPercent: 75,
    dailyWasteTonnes: 90,
    capitalCostCrore: 32,
  },
];

const initialEstimate = {
  plantCapacityMw: 10,
  capacityUtilizationPercent: 80,
  dailyWasteTonnes: 500,
  operatingDaysPerYear: 330,
  capitalCostCrore: 100,
  grantCrore: 10,
  projectYear: 1,
  averageSbiMclrPercent: 8.5,
  matRatePercent: 15,
};

const initialLoads = [
  { id: "hospital", name: "Hospitals & clinics", type: "Critical care", priority: 5, demandMwhPerDay: 45 },
  { id: "emergency", name: "Emergency services", type: "Emergency response", priority: 4, demandMwhPerDay: 20 },
  { id: "water", name: "Water treatment", type: "Essential services", priority: 3, demandMwhPerDay: 35 },
  { id: "homes", name: "Community homes", type: "Community demand", priority: 2, demandMwhPerDay: 110 },
];

const priorityNames = {
  5: "Critical · first",
  4: "High",
  3: "Important",
  2: "Standard",
  1: "Flexible",
};

const formatNumber = (value, maximumFractionDigits = 0) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits }).format(value);

const formatCrore = (value) =>
  `₹${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 1 }).format(value)} cr`;

const formatEnergy = (value) => `${formatNumber(value)} MWh`;
const formatDailyEnergy = (value) =>
  `${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 1 }).format(value)} MWh/day`;

function Icon({ name, size = 18 }) {
  const paths = {
    leaf: <><path d="M20 4c-8 0-14 3-14 10a6 6 0 0 0 6 6c7 0 10-6 8-16Z" /><path d="M4 21c2-5 6-9 12-12" /></>,
    grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    chart: <><path d="M3 3v18h18" /><path d="m8 14 4-4 4 3 5-7" /><path d="M18 6h3v3" /></>,
    bolt: <path d="m13 2-3 8h7l-6 12 1-9H6l7-11Z" />,
    plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
    trash: <><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="m19 6-1 14H6L5 6" /><path d="M10 11v5m4-5v5" /></>,
    arrow: <><path d="M7 17 17 7" /><path d="M8 7h9v9" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    chevron: <path d="m9 18 6-6-6-6" />,
  };
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}

function Field({ label, value, onChange, suffix, min = 0, max, step = 1, hint }) {
  return (
    <label className="field">
      <span>{label}</span>
      <div className="input-shell">
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        {suffix && <span className="input-suffix">{suffix}</span>}
      </div>
      {hint && <small>{hint}</small>}
    </label>
  );
}

function App() {
  const [activeView, setActiveView] = useState("optimizer");
  const [plants, setPlants] = useState(initialPlants);
  const [capitalBudgetCrore, setCapitalBudgetCrore] = useState(180);
  const [availableWasteTonnesPerDay, setAvailableWasteTonnesPerDay] = useState(700);
  const [optimization, setOptimization] = useState(null);
  const [optimizerLoading, setOptimizerLoading] = useState(false);
  const [optimizerError, setOptimizerError] = useState("");
  const [loads, setLoads] = useState(initialLoads);
  const [streetLampWattage, setStreetLampWattage] = useState(100);
  const [streetLampHoursPerNight, setStreetLampHoursPerNight] = useState(12);
  const [dispatch, setDispatch] = useState(null);
  const [dispatchLoading, setDispatchLoading] = useState(false);
  const [dispatchError, setDispatchError] = useState("");
  const [estimateInputs, setEstimateInputs] = useState(initialEstimate);
  const [estimate, setEstimate] = useState(null);
  const [estimateLoading, setEstimateLoading] = useState(false);
  const [estimateError, setEstimateError] = useState("");

  const selectedIds = useMemo(
    () => new Set(optimization?.selectedPlants?.map((plant) => plant.id) ?? []),
    [optimization],
  );

  const updatePlant = (id, key, value) => {
    setPlants((current) =>
      current.map((plant) =>
        plant.id === id
          ? { ...plant, [key]: key === "name" || key === "technology" ? value : Number(value) }
          : plant,
      ),
    );
    setOptimization(null);
  };

  const addPlant = () => {
    if (plants.length >= 16) return;
    setPlants((current) => [
      ...current,
      {
        id: `plant-${Date.now()}`,
        name: `New recovery plant ${current.length + 1}`,
        technology: "Municipal solid waste",
        capacityMw: 5,
        capacityUtilizationPercent: 80,
        dailyWasteTonnes: 75,
        capitalCostCrore: 40,
      },
    ]);
    setOptimization(null);
  };

  const removePlant = (id) => {
    setPlants((current) => current.filter((plant) => plant.id !== id));
    setOptimization(null);
  };

  const fallbackDailyGenerationMwh = useMemo(() => {
    if (optimization?.annualGenerationMwh) {
      return optimization.annualGenerationMwh / 365;
    }
    const annual = plants.reduce(
      (sum, p) => sum + (p.capacityMw || 0) * 8766 * ((p.capacityUtilizationPercent || 0) / 100),
      0
    );
    return annual / 365;
  }, [optimization, plants]);

  const runDispatch = async (generationMwh) => {
    setDispatchLoading(true);
    setDispatchError("");
    const mwhPerDay =
      typeof generationMwh === "number" && Number.isFinite(generationMwh)
        ? generationMwh / 365
        : fallbackDailyGenerationMwh;
    try {
      const response = await fetch("/api/dispatch", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          availableGenerationMwhPerDay: mwhPerDay,
          streetLampWattage: Number(streetLampWattage),
          streetLampHoursPerNight: Number(streetLampHoursPerNight),
          loads,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not dispatch available generation.");
      setDispatch(payload);
    } catch (error) {
      setDispatch(null);
      setDispatchError(error.message || "The C++ priority queue could not be reached.");
    } finally {
      setDispatchLoading(false);
    }
  };

  const runOptimization = async (event) => {
    event.preventDefault();
    setOptimizerLoading(true);
    setOptimizerError("");
    setOptimization(null);
    try {
      const response = await fetch("/api/optimize", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ capitalBudgetCrore, availableWasteTonnesPerDay, plants }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not optimize this portfolio.");
      setOptimization(payload);
      await runDispatch(payload.annualGenerationMwh);
    } catch (error) {
      setOptimizerError(error.message || "The C++ optimizer could not be reached.");
    } finally {
      setOptimizerLoading(false);
    }
  };

  const updateLoad = (id, key, value) => {
    setLoads((current) =>
      current.map((load) =>
        load.id === id ? { ...load, [key]: Number(value) } : load,
      ),
    );
  };

  const updateEstimateInput = (key, value) => {
    setEstimateInputs((current) => ({
      ...current,
      [key]: Number(value),
    }));
  };

  const runEstimate = async (event) => {
    event.preventDefault();
    setEstimateLoading(true);
    setEstimateError("");
    try {
      const response = await fetch("/api/estimate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(estimateInputs),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not calculate the estimate.");
      setEstimate(payload);
    } catch (error) {
      setEstimateError(error.message || "The C++ backend could not be reached.");
    } finally {
      setEstimateLoading(false);
    }
  };

  useEffect(() => {
    runDispatch(optimization?.annualGenerationMwh);
  }, [streetLampWattage, streetLampHoursPerNight, loads, optimization, fallbackDailyGenerationMwh]);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#overview" onClick={() => setActiveView("optimizer")}>
          <span className="brand-mark"><Icon name="leaf" size={21} /></span>
          <span>watt<span className="brand-light">cycle</span></span>
        </a>

        <div className="workspace-label">WORKSPACE</div>
        <nav className="side-nav" aria-label="Main navigation">
          <button
            className={activeView === "optimizer" ? "nav-item active" : "nav-item"}
            aria-label="Portfolio planner"
            onClick={() => setActiveView("optimizer")}
          >
            <Icon name="grid" /><span>Portfolio planner</span>
          </button>
          <button
            className={activeView === "estimate" ? "nav-item active" : "nav-item"}
            aria-label="Project estimator"
            onClick={() => setActiveView("estimate")}
          >
            <Icon name="chart" /><span>Project estimator</span>
          </button>
          <a className="nav-item nav-link" href="#reference">
            <Icon name="leaf" /><span>CERC reference</span><Icon name="arrow" size={15} />
          </a>
        </nav>

        <div className="sidebar-bottom">
          <div className="source-card">
            <span className="source-icon"><Icon name="bolt" size={16} /></span>
            <strong>Waste to watts</strong>
            <p>Plan cleaner power with a feedstock-aware project mix.</p>
          </div>
          <div className="engine-status"><span className="status-dot" /> C++ optimization engine</div>
          <span className="sidebar-version">CERC RE TARIFFS · 2024</span>
        </div>
      </aside>

      <main className="main-content" id="overview">
        <header className="topbar">
          <div className="breadcrumb"><span>Workspace</span><Icon name="chevron" size={14} /><strong>{activeView === "optimizer" ? "Portfolio planner" : "Project estimator"}</strong></div>
          <div className="topbar-right"><span className="live-indicator" /> Planning mode <span className="topbar-divider" /> India</div>
        </header>

        <section className="page-wrap">
          <div className="page-heading">
            <div>
              <div className="eyebrow"><span className="eyebrow-line" /> WASTE-TO-ENERGY · POWER SYSTEM PLANNING</div>
              <h1>{activeView === "optimizer" ? <>Turn waste streams<br /><span>into better power plans.</span></> : <>Know your project<br /><span>before you power it.</span></>}</h1>
              <p className="heading-copy">
                {activeView === "optimizer"
                  ? "Find the project combination that generates the most renewable electricity within your investment and feedstock limits."
                  : "Explore annual generation, eligible investment and CERC-based financial assumptions for an MSW or RDF project."}
              </p>
            </div>
            <div className="heading-stamp"><span className="stamp-spark">✳</span><span>WASTE IN.<br /><strong>POWER OUT.</strong></span></div>
          </div>

          <div className="metrics-row">
            <div className="metric-card">
              <span className="metric-icon green"><Icon name="leaf" size={17} /></span>
              <span className="metric-label">RECOGNIZED USEFUL LIFE</span>
              <strong>20 <small>years</small></strong>
              <span className="metric-foot">CERC norm for MSW / RDF</span>
            </div>
            <div className="metric-card">
              <span className="metric-icon amber"><Icon name="bolt" size={17} /></span>
              <span className="metric-label">GENERATION BASIS</span>
              <strong>8,766 <small>hours / yr</small></strong>
              <span className="metric-foot">CERC capacity factor calculation</span>
            </div>
            <div className="metric-card">
              <span className="metric-icon blue"><Icon name="grid" size={17} /></span>
              <span className="metric-label">PORTFOLIO OPTIONS</span>
              <strong>{plants.length.toString().padStart(2, "0")} <small>projects</small></strong>
              <span className="metric-foot">Edit the scenario to explore a mix</span>
            </div>
          </div>

          {activeView === "optimizer" ? (
            <div className="optimizer-view">
            <div className="planner-grid">
              <section className="panel portfolio-panel">
                <div className="panel-heading">
                  <div><span className="section-kicker">01 / DECISION VARIABLES</span><h2>Build your portfolio</h2></div>
                  <span className="editable-pill">EDITABLE SCENARIO</span>
                </div>
                <p className="panel-description">Set the system constraints, then tune each candidate plant. Sample plant values are illustrative—not CERC norms.</p>

                <form onSubmit={runOptimization}>
                  <div className="constraints-grid">
                    <Field label="Capital investment ceiling" suffix="₹ crore" value={capitalBudgetCrore} onChange={(value) => { setCapitalBudgetCrore(Number(value)); setOptimization(null); }} step={1} />
                    <Field label="Available waste supply" suffix="tonnes / day" value={availableWasteTonnesPerDay} onChange={(value) => { setAvailableWasteTonnesPerDay(Number(value)); setOptimization(null); }} step={10} />
                  </div>

                  <div className="plant-list-heading">
                    <div><strong>Candidate projects</strong><span>{plants.length} of 16 options</span></div>
                    <span className="column-hint">CAPACITY · CUF · WASTE · CAPEX</span>
                  </div>

                  <div className="plant-list">
                    {plants.map((plant, index) => (
                      <article className={`plant-row ${selectedIds.has(plant.id) ? "plant-selected" : ""}`} key={plant.id}>
                        <div className="plant-identity">
                          <span className="plant-index">{String(index + 1).padStart(2, "0")}</span>
                          <span className="plant-symbol"><Icon name={plant.technology.toLowerCase().includes("rdf") ? "bolt" : "leaf"} size={17} /></span>
                          <div className="plant-name-wrap">
                            <input
                              className="plant-name"
                              aria-label={`Plant ${index + 1} name`}
                              value={plant.name}
                              onChange={(event) => updatePlant(plant.id, "name", event.target.value)}
                              maxLength={48}
                            />
                            <select
                              aria-label={`Plant ${index + 1} technology`}
                              value={plant.technology}
                              onChange={(event) => updatePlant(plant.id, "technology", event.target.value)}
                            >
                              <option>Municipal solid waste</option>
                              <option>Refuse-derived fuel</option>
                              <option>Waste recovery</option>
                            </select>
                          </div>
                        </div>
                        <div className="plant-fields">
                          <label><span>MW</span><input aria-label={`${plant.name} capacity MW`} type="number" min="0.1" step="0.1" value={plant.capacityMw} onChange={(event) => updatePlant(plant.id, "capacityMw", event.target.value)} /></label>
                          <label><span>CUF %</span><input aria-label={`${plant.name} capacity factor`} type="number" min="0.1" max="100" step="0.1" value={plant.capacityUtilizationPercent} onChange={(event) => updatePlant(plant.id, "capacityUtilizationPercent", event.target.value)} /></label>
                          <label><span>TON / DAY</span><input aria-label={`${plant.name} waste tonnes per day`} type="number" min="0.1" step="0.1" value={plant.dailyWasteTonnes} onChange={(event) => updatePlant(plant.id, "dailyWasteTonnes", event.target.value)} /></label>
                          <label><span>₹ CR</span><input aria-label={`${plant.name} capital cost crore`} type="number" min="0.1" step="0.1" value={plant.capitalCostCrore} onChange={(event) => updatePlant(plant.id, "capitalCostCrore", event.target.value)} /></label>
                        </div>
                        <button className="remove-plant" type="button" aria-label={`Remove ${plant.name}`} onClick={() => removePlant(plant.id)}><Icon name="trash" size={16} /></button>
                      </article>
                    ))}
                  </div>

                  <div className="portfolio-actions">
                    <button className="add-button" type="button" onClick={addPlant} disabled={plants.length >= 16}>
                      <Icon name="plus" size={16} /> Add project
                    </button>
                    <button className="primary-button" type="submit" disabled={optimizerLoading}>
                      <Icon name="bolt" size={17} /> {optimizerLoading ? "Optimizing…" : "Optimize portfolio"} <Icon name="arrow" size={16} />
                    </button>
                  </div>
                </form>
                {optimizerError && <div className="error-message" role="alert">{optimizerError}</div>}
                <div className="algorithm-note"><span className="algorithm-mark">DSA</span><span><strong>0/1 knapsack dynamic programming</strong> selects a whole-plant portfolio within both the capital and waste limits. Budget is rounded down to ₹0.5 cr and feedstock to 10-tonne/day buckets for a conservative plan.</span></div>
              </section>

              <aside className="results-column">
                <section className="result-panel">
                  <div className="result-topline"><span className="section-kicker">02 / OPTIMIZED PORTFOLIO MIX</span><span className="result-spark">✳</span></div>
                  <h2>Best-fit<br />power mix<span className="period">.</span></h2>
                  {!optimization && !optimizerLoading && (
                    <div className="empty-result">
                      <div className="empty-orbit"><Icon name="bolt" size={25} /></div>
                      <strong>Your result starts here.</strong>
                      <p>Run the optimizer to find the highest-generation mix that respects your project budget and waste supply.</p>
                    </div>
                  )}
                  {optimizerLoading && <div className="loading-result"><span className="loader" /> Evaluating feasible combinations…</div>}
                  {optimization && (
                    <>
                      <div className="generation-total"><strong>{formatNumber(optimization.annualGenerationMwh)}</strong><span>MWh / year potential</span></div>
                      <div className="result-stat-grid">
                        <div><span>INVESTMENT</span><strong>{formatCrore(optimization.capitalCostCrore)}</strong></div>
                        <div><span>FEEDSTOCK</span><strong>{formatNumber(optimization.dailyWasteTonnes)} t/day</strong></div>
                      </div>
                      <div className="mix-heading"><strong>Selected projects</strong><span>{optimization.selectedPlants.length} plants</span></div>
                      {optimization.selectedPlants.length === 0 ? (
                        <div className="no-projects">No project fits both limits. Increase the budget or available waste.</div>
                      ) : (
                        <div className="selected-list">
                          {optimization.selectedPlants.map((plant) => {
                            const share = optimization.annualGenerationMwh
                              ? plant.capacityMw * 8766 * plant.capacityUtilizationPercent / 100 / optimization.annualGenerationMwh * 100
                              : 0;
                            return (
                              <div className="selected-project" key={plant.id}>
                                <div className="selected-project-line"><span className="selected-check"><Icon name="check" size={13} /></span><strong>{plant.name}</strong><span>{formatNumber(share, 1)}%</span></div>
                                <div className="share-track"><span style={{ width: `${share}%` }} /></div>
                                <small>{plant.capacityMw} MW <i /> {plant.dailyWasteTonnes} t/day <i /> {formatCrore(plant.capitalCostCrore)}</small>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      <div className="approx-note">Resource usage is rounded up per project in the DP, so selected projects remain within both stated limits.</div>
                    </>
                  )}
                  <div className="result-rule"><span>PLANNING INSIGHT</span><p>More generation is not always a bigger plant. Feedstock availability can make a smaller, efficient mix the better system choice.</p></div>
                </section>

                <section className="source-mini" id="reference">
                  <div className="source-mini-icon"><Icon name="leaf" /></div>
                  <div><span>CERC 2024 · MSW / RDF</span><strong>20-year useful life</strong><p>Retained by the Commission for municipal waste plants.</p></div>
                  <span className="source-page">SOR · PP 7, 9</span>
                </section>
              </aside>
            </div>
            <section className="panel dispatch-panel">
              <div className="dispatch-heading">
                <div>
                  <span className="section-kicker">03 / PRIORITY-BASED POWER ALLOCATION</span>
                  <h2>Power the essentials first.</h2>
                  <p className="panel-description">
                    A C++ priority queue allocates daily generation to critical loads before community demand.
                    Set each load's daily need and priority tier.
                  </p>
                </div>
                <span className="algorithm-mark">PRIORITY QUEUE</span>
              </div>

              <div className="dispatch-layout">
                <div className="dispatch-loads">
                  <div className="dispatch-column-head">
                    <span>LOAD / SERVICE</span><span>PRIORITY</span><span>NEED / DAY</span><span>ALLOCATED / DAY</span>
                  </div>
                  {(dispatch?.orderedLoads ?? [...loads].sort((a, b) => b.priority - a.priority)).map((load) => {
                    const currentLoad = loads.find((item) => item.id === load.id);
                    const allocated = dispatch?.loads?.find((item) => item.id === load.id);
                    const served = allocated?.allocatedMwhPerDay ?? 0;
                    const coverage = load.demandMwhPerDay > 0
                      ? Math.min(100, served / load.demandMwhPerDay * 100)
                      : 0;
                    return (
                      <div className="dispatch-row" key={load.id}>
                        <div className="dispatch-load-name">
                          <span className={`priority-badge tier-${currentLoad.priority}`}>T{currentLoad.priority}</span>
                          <div><strong>{currentLoad.name}</strong><small>{currentLoad.type}</small></div>
                        </div>
                        <label className="priority-control">
                          <span className="sr-only">{currentLoad.name} priority</span>
                          <select
                            aria-label={`${currentLoad.name} priority`}
                            value={currentLoad.priority}
                            onChange={(event) => updateLoad(currentLoad.id, "priority", event.target.value)}
                          >
                            {[5, 4, 3, 2, 1].map((tier) => (
                              <option value={tier} key={tier}>T{tier} · {priorityNames[tier]}</option>
                            ))}
                          </select>
                        </label>
                        <label className="demand-control">
                          <span className="sr-only">{currentLoad.name} demand MWh per day</span>
                          <input
                            type="number"
                            min="0"
                            step="0.1"
                            value={currentLoad.demandMwhPerDay}
                            onChange={(event) => updateLoad(currentLoad.id, "demandMwhPerDay", event.target.value)}
                          />
                          <span>MWh</span>
                        </label>
                        <div className="allocation-control">
                          <strong>{dispatch ? formatDailyEnergy(served) : "—"}</strong>
                          {dispatch && <div className="allocation-track"><span style={{ width: `${coverage}%` }} /></div>}
                        </div>
                      </div>
                    );
                  })}
                  {dispatchError && <div className="error-message" role="alert">{dispatchError}</div>}
                  <div className="lamp-settings">
                    <Field
                      label="Lamp power"
                      suffix="watts"
                      value={streetLampWattage}
                      min={10}
                      max={2000}
                      step={10}
                      onChange={(value) => { setStreetLampWattage(Number(value)); }}
                    />
                    <Field
                      label="Nightly operation"
                      suffix="hours"
                      value={streetLampHoursPerNight}
                      min={0.1}
                      max={24}
                      step={0.5}
                      onChange={(value) => { setStreetLampHoursPerNight(Number(value)); }}
                    />
                    <button
                      className="primary-button dispatch-button"
                      type="button"
                      onClick={() => runDispatch(optimization?.annualGenerationMwh)}
                      disabled={dispatchLoading}
                    >
                      <Icon name="bolt" size={17} />
                      {dispatchLoading ? "Allocating…" : "Apply priority queue"}
                    </button>
                  </div>
                  <p className="dispatch-note">
                    Tier 5 is served first; equal-tier loads keep their listed order. Street-lighting capacity is estimated from surplus generation based on planning assumptions.
                  </p>
                </div>

                <aside className="lamp-summary">
                  <span className="lamp-summary-kicker">STREET-LIGHTING POTENTIAL</span>
                  {dispatchLoading ? (
                    <div className="lamp-empty"><span className="loader" /> Allocating daily generation…</div>
                  ) : dispatch ? (
                    <>
                      <strong className="lamp-count">{formatNumber(dispatch.streetLampsPowered)}</strong>
                      <span className="lamp-unit">street lamps powered</span>
                      <div className="lamp-energy">
                        <span>Daily renewable generation</span>
                        <strong>{formatDailyEnergy(dispatch.availableGenerationMwhPerDay)}</strong>
                      </div>
                      <div className="lamp-energy">
                        <span>Surplus after priority loads</span>
                        <strong>{formatDailyEnergy(dispatch.remainingEnergyMwhPerDay)}</strong>
                      </div>
                      <p>
                        Based on {streetLampWattage} W per lamp for {streetLampHoursPerNight} hours each night.
                        Lamps use only the energy left after higher-priority loads.
                      </p>
                    </>
                  ) : (
                    <div className="lamp-empty">
                      <span className="loader" /> Estimating street-lighting potential…
                    </div>
                  )}
                </aside>
              </div>
            </section>
            </div>
          ) : (
            <section className="estimator-layout">
              <form className="panel estimator-panel" onSubmit={runEstimate}>
                <div className="panel-heading">
                  <div><span className="section-kicker">01 / PROJECT ASSUMPTIONS</span><h2>Estimate a project</h2></div>
                  <span className="editable-pill">CERC-ALIGNED</span>
                </div>
                <p className="panel-description">Enter project details. Regulatory norms are applied by the C++ calculation backend.</p>
                <div className="estimate-fields">
                  <Field label="Plant capacity" suffix="MW" value={estimateInputs.plantCapacityMw} onChange={(value) => updateEstimateInput("plantCapacityMw", value)} step={0.1} />
                  <Field label="Capacity utilization" suffix="%" value={estimateInputs.capacityUtilizationPercent} onChange={(value) => updateEstimateInput("capacityUtilizationPercent", value)} step={0.1} />
                  <Field label="Waste per operating day" suffix="tonnes" value={estimateInputs.dailyWasteTonnes} onChange={(value) => updateEstimateInput("dailyWasteTonnes", value)} step={1} />
                  <Field label="Operating days per year" value={estimateInputs.operatingDaysPerYear} onChange={(value) => updateEstimateInput("operatingDaysPerYear", value)} step={1} />
                  <Field label="Capital cost" suffix="₹ crore" value={estimateInputs.capitalCostCrore} onChange={(value) => updateEstimateInput("capitalCostCrore", value)} step={1} />
                  <Field label="Grant / capital subsidy" suffix="₹ crore" value={estimateInputs.grantCrore} onChange={(value) => updateEstimateInput("grantCrore", value)} step={1} />
                  <Field label="Project year" value={estimateInputs.projectYear} onChange={(value) => updateEstimateInput("projectYear", value)} step={1} />
                  <Field label="Six-month average SBI MCLR" suffix="%" value={estimateInputs.averageSbiMclrPercent} onChange={(value) => updateEstimateInput("averageSbiMclrPercent", value)} step={0.01} />
                  <Field label="Notified MAT rate" suffix="%" value={estimateInputs.matRatePercent} onChange={(value) => updateEstimateInput("matRatePercent", value)} step={0.01} />
                </div>
                <button className="primary-button estimate-submit" type="submit" disabled={estimateLoading}>
                  <Icon name="chart" /> {estimateLoading ? "Calculating…" : "Calculate estimate"} <Icon name="arrow" />
                </button>
                {estimateError && <div className="error-message" role="alert">{estimateError}</div>}
              </form>

              <section className="panel estimate-result-panel">
                <span className="section-kicker">02 / PROJECT SNAPSHOT</span>
                <h2>Numbers behind<br />the project<span className="period">.</span></h2>
                {!estimate ? (
                  <div className="empty-result">
                    <div className="empty-orbit"><Icon name="chart" size={23} /></div>
                    <strong>Estimate not calculated yet.</strong>
                    <p>Adjust the project inputs and calculate an estimate to see the CERC assumptions applied.</p>
                  </div>
                ) : (
                  <div className="estimate-result-list">
                    <div className="estimate-result-primary"><span>ANNUAL GENERATION</span><strong>{formatEnergy(estimate.annualGenerationMwh)}</strong><small>Calculated using 8,766 hours per year</small></div>
                    <div className="estimate-result-row"><span>Annual waste processed</span><strong>{formatNumber(estimate.annualWasteTonnes)} tonnes</strong></div>
                    <div className="estimate-result-row"><span>Eligible capital after grants</span><strong>{formatCrore(estimate.eligibleCapitalCostCrore)}</strong></div>
                    <div className="estimate-result-row"><span>Annual depreciation · year {estimateInputs.projectYear}</span><strong>{formatCrore(estimate.annualDepreciationCrore)}</strong></div>
                    <div className="estimate-result-row"><span>Term-loan interest norm</span><strong>{formatNumber(estimate.loanInterestRatePercent, 2)}%</strong></div>
                    <div className="estimate-result-row"><span>Working-capital interest norm</span><strong>{formatNumber(estimate.workingCapitalInterestRatePercent, 2)}%</strong></div>
                    <div className="estimate-result-row"><span>Grossed-up return on equity</span><strong>{formatNumber(estimate.grossedUpReturnOnEquityPercent, 2)}%</strong></div>
                  </div>
                )}
                <div className="estimate-disclaimer">Indicative planning estimate only—not a CERC tariff determination. Does not calculate a complete tariff, fuel costs or working-capital amounts.</div>
              </section>
            </section>
          )}

          <section className="reference-strip">
            <div className="reference-intro"><span className="section-kicker">SOURCE NOTES</span><strong>Grounded in the<br />CERC 2024 SOR.</strong><p>Reference facts are shown separately from user-provided scenario values.</p></div>
            <div className="reference-fact"><span>20 years</span><strong>MSW / RDF useful life</strong><small>SOR pp. 7, 9</small></div>
            <div className="reference-fact"><span>4.67% · 15 yr</span><strong>First-period depreciation</strong><small>10% salvage value · SOR p. 26</small></div>
            <div className="reference-fact"><span>MCLR + 200 bps</span><strong>Normative loan interest</strong><small>15-year loan tenure · SOR p. 24</small></div>
            <div className="reference-fact"><span>14% RoE</span><strong>Return on equity</strong><small>Grossed up with MAT · SOR pp. 26–28</small></div>
          </section>

          <footer className="page-footer"><span>WATTCYCLE <i>·</i> WASTE-TO-ENERGY PLANNING</span><span>Illustrative planning tool · Not a regulatory tariff order</span></footer>
        </section>
      </main>
    </div>
  );
}

export default App;
