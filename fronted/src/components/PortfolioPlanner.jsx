import Field from "./Field.jsx";
import Icon from "./Icon.jsx";
import { formatCrore, formatNumber } from "../utils/formatters.js";

export default function PortfolioPlanner({
  plants,
  selectedPlantIds,
  capitalBudgetCrore,
  availableWasteTonnesPerDay,
  updateCapitalBudget,
  updateWasteSupply,
  updatePlant,
  addPlant,
  removePlant,
  runOptimization,
  optimizerLoading,
  optimizerError,
  optimization,
  onOpenReference,
}) {
  return (
    <div className="planner-grid">
      <PortfolioForm
        plants={plants}
        selectedPlantIds={selectedPlantIds}
        capitalBudgetCrore={capitalBudgetCrore}
        availableWasteTonnesPerDay={availableWasteTonnesPerDay}
        updateCapitalBudget={updateCapitalBudget}
        updateWasteSupply={updateWasteSupply}
        updatePlant={updatePlant}
        addPlant={addPlant}
        removePlant={removePlant}
        runOptimization={runOptimization}
        optimizerLoading={optimizerLoading}
        optimizerError={optimizerError}
      />
      <PortfolioResults
        optimization={optimization}
        optimizerLoading={optimizerLoading}
        onOpenReference={onOpenReference}
      />
    </div>
  );
}

function PortfolioForm({
  plants,
  selectedPlantIds,
  capitalBudgetCrore,
  availableWasteTonnesPerDay,
  updateCapitalBudget,
  updateWasteSupply,
  updatePlant,
  addPlant,
  removePlant,
  runOptimization,
  optimizerLoading,
  optimizerError,
}) {
  return (
    <section className="panel portfolio-panel">
      <div className="panel-heading">
        <div>
          <span className="section-kicker">01 / DECISION VARIABLES</span>
          <h2>Build your portfolio</h2>
        </div>
        <span className="editable-pill">EDITABLE SCENARIO</span>
      </div>
      <p className="panel-description">
        Set the system constraints, then tune each candidate plant. Sample plant
        values are illustrative—not CERC norms.
      </p>

      <form onSubmit={runOptimization}>
        <div className="constraints-grid">
          <Field
            label="Capital investment ceiling"
            suffix="₹ crore"
            value={capitalBudgetCrore}
            onChange={updateCapitalBudget}
            step={1}
          />
          <Field
            label="Available waste supply"
            suffix="tonnes / day"
            value={availableWasteTonnesPerDay}
            onChange={updateWasteSupply}
            step={10}
          />
        </div>

        <div className="plant-list-heading">
          <div>
            <strong>Candidate projects</strong>
            <span>{plants.length} of 16 options</span>
          </div>
          <span className="column-hint">CAPACITY · CUF · WASTE · CAPEX</span>
        </div>

        <div className="plant-list">
          {plants.map((plant, index) => (
            <PlantRow
              key={plant.id}
              plant={plant}
              index={index}
              selected={selectedPlantIds.has(plant.id)}
              onUpdate={updatePlant}
              onRemove={removePlant}
            />
          ))}
        </div>

        <div className="portfolio-actions">
          <button
            className="add-button"
            type="button"
            onClick={addPlant}
            disabled={plants.length >= 16}
          >
            <Icon name="plus" size={16} /> Add project
          </button>
          <button
            className="primary-button"
            type="submit"
            disabled={optimizerLoading}
          >
            <Icon name="bolt" size={17} />
            {optimizerLoading ? "Optimizing…" : "Optimize portfolio"}
            <Icon name="arrow" size={16} />
          </button>
        </div>
      </form>

      {optimizerError && (
        <div className="error-message" role="alert">
          {optimizerError}
        </div>
      )}
      <div className="algorithm-note">
        <span className="algorithm-mark">DSA</span>
        <span>
          <strong>0/1 knapsack dynamic programming</strong> selects a
          whole-plant portfolio within both the capital and waste limits. Budget
          is rounded down to ₹0.5 cr and feedstock to 10-tonne/day buckets for a
          conservative plan.
        </span>
      </div>
    </section>
  );
}

function PlantRow({ plant, index, selected, onUpdate, onRemove }) {
  const iconName = plant.technology.toLowerCase().includes("rdf")
    ? "bolt"
    : "leaf";

  return (
    <article className={`plant-row ${selected ? "plant-selected" : ""}`}>
      <div className="plant-identity">
        <span className="plant-index">
          {String(index + 1).padStart(2, "0")}
        </span>
        <span className="plant-symbol">
          <Icon name={iconName} size={17} />
        </span>
        <div className="plant-name-wrap">
          <input
            className="plant-name"
            aria-label={`Plant ${index + 1} name`}
            value={plant.name}
            onChange={(event) => onUpdate(plant.id, "name", event.target.value)}
            maxLength={48}
          />
          <select
            aria-label={`Plant ${index + 1} technology`}
            value={plant.technology}
            onChange={(event) =>
              onUpdate(plant.id, "technology", event.target.value)
            }
          >
            <option>Municipal solid waste</option>
            <option>Refuse-derived fuel</option>
            <option>Waste recovery</option>
          </select>
        </div>
      </div>

      <div className="plant-fields">
        <PlantField
          label="MW"
          ariaLabel={`${plant.name} capacity MW`}
          value={plant.capacityMw}
          onChange={(value) => onUpdate(plant.id, "capacityMw", value)}
        />
        <PlantField
          label="CUF %"
          ariaLabel={`${plant.name} capacity factor`}
          value={plant.capacityUtilizationPercent}
          max="100"
          onChange={(value) =>
            onUpdate(plant.id, "capacityUtilizationPercent", value)
          }
        />
        <PlantField
          label="TON / DAY"
          ariaLabel={`${plant.name} waste tonnes per day`}
          value={plant.dailyWasteTonnes}
          onChange={(value) => onUpdate(plant.id, "dailyWasteTonnes", value)}
        />
        <PlantField
          label="₹ CR"
          ariaLabel={`${plant.name} capital cost crore`}
          value={plant.capitalCostCrore}
          onChange={(value) => onUpdate(plant.id, "capitalCostCrore", value)}
        />
      </div>

      <button
        className="remove-plant"
        type="button"
        aria-label={`Remove ${plant.name}`}
        onClick={() => onRemove(plant.id)}
      >
        <Icon name="trash" size={16} />
      </button>
    </article>
  );
}

function PlantField({ label, ariaLabel, value, max, onChange }) {
  return (
    <label>
      <span>{label}</span>
      <input
        aria-label={ariaLabel}
        type="number"
        min="0.1"
        max={max}
        step="0.1"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function PortfolioResults({ optimization, optimizerLoading, onOpenReference }) {
  return (
    <aside className="results-column">
      <section className="result-panel">
        <div className="result-topline">
          <span className="section-kicker">02 / OPTIMIZED PORTFOLIO MIX</span>
          <span className="result-spark">✳</span>
        </div>
        <h2>
          Best-fit
          <br />
          power mix<span className="period">.</span>
        </h2>

        {!optimization && !optimizerLoading && (
          <div className="empty-result">
            <div className="empty-orbit">
              <Icon name="bolt" size={25} />
            </div>
            <strong>Your result starts here.</strong>
            <p>
              Run the optimizer to find the highest-generation mix that respects
              your project budget and waste supply.
            </p>
          </div>
        )}
        {optimizerLoading && (
          <div className="loading-result">
            <span className="loader" /> Evaluating feasible combinations…
          </div>
        )}
        {optimization && <OptimizationSummary optimization={optimization} />}

        <div className="result-rule">
          <span>PLANNING INSIGHT</span>
          <p>
            More generation is not always a bigger plant. Feedstock availability
            can make a smaller, efficient mix the better system choice.
          </p>
        </div>
      </section>

      <button
        className="source-mini"
        id="reference"
        type="button"
        onClick={onOpenReference}
        aria-label="View CERC 2024 reference details"
      >
        <div className="source-mini-icon">
          <Icon name="leaf" />
        </div>
        <div>
          <span>CERC 2024 · MSW / RDF</span>
          <strong>20-year useful life</strong>
          <p>Retained by the Commission for municipal waste plants.</p>
        </div>
        <span className="source-page">SOR · PP 7, 9</span>
      </button>
    </aside>
  );
}

function OptimizationSummary({ optimization }) {
  return (
    <>
      <div className="generation-total">
        <strong>{formatNumber(optimization.annualGenerationMwh)}</strong>
        <span>MWh / year potential</span>
      </div>
      <div className="result-stat-grid">
        <div>
          <span>INVESTMENT</span>
          <strong>{formatCrore(optimization.capitalCostCrore)}</strong>
        </div>
        <div>
          <span>FEEDSTOCK</span>
          <strong>{formatNumber(optimization.dailyWasteTonnes)} t/day</strong>
        </div>
      </div>
      <div className="mix-heading">
        <strong>Selected projects</strong>
        <span>{optimization.selectedPlants.length} plants</span>
      </div>
      {optimization.selectedPlants.length === 0 ? (
        <div className="no-projects">
          No project fits both limits. Increase the budget or available waste.
        </div>
      ) : (
        <div className="selected-list">
          {optimization.selectedPlants.map((plant) => (
            <SelectedPlant
              key={plant.id}
              plant={plant}
              totalGenerationMwh={optimization.annualGenerationMwh}
            />
          ))}
        </div>
      )}
      <div className="approx-note">
        Resource usage is rounded up per project in the DP, so selected projects
        remain within both stated limits.
      </div>
    </>
  );
}

function SelectedPlant({ plant, totalGenerationMwh }) {
  const share = totalGenerationMwh
    ? ((plant.capacityMw * 8766 * plant.capacityUtilizationPercent) /
        100 /
        totalGenerationMwh) *
      100
    : 0;

  return (
    <div className="selected-project">
      <div className="selected-project-line">
        <span className="selected-check">
          <Icon name="check" size={13} />
        </span>
        <strong>{plant.name}</strong>
        <span>{formatNumber(share, 1)}%</span>
      </div>
      <div className="share-track">
        <span style={{ width: `${share}%` }} />
      </div>
      <small>
        {plant.capacityMw} MW <i /> {plant.dailyWasteTonnes} t/day <i />{" "}
        {formatCrore(plant.capitalCostCrore)}
      </small>
    </div>
  );
}
