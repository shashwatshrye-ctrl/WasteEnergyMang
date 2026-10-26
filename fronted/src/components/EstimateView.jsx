import Field from "./Field.jsx";
import Icon from "./Icon.jsx";
import {
  formatCrore,
  formatEnergy,
  formatNumber,
} from "../utils/formatters.js";

export default function EstimateView({
  estimateInputs,
  updateEstimateInput,
  runEstimate,
  estimateLoading,
  estimateError,
  estimate,
}) {
  return (
    <section className="estimator-layout">
      <form className="panel estimator-panel" onSubmit={runEstimate}>
        <div className="panel-heading">
          <div>
            <span className="section-kicker">01 / PROJECT ASSUMPTIONS</span>
            <h2>Estimate a project</h2>
          </div>
          <span className="editable-pill">CERC-ALIGNED</span>
        </div>
        <p className="panel-description">
          Enter project details. Regulatory norms are applied by the C++
          calculation backend.
        </p>

        <div className="estimate-fields">
          <Field
            label="Plant capacity"
            suffix="MW"
            value={estimateInputs.plantCapacityMw}
            onChange={(value) => updateEstimateInput("plantCapacityMw", value)}
            step={0.1}
          />
          <Field
            label="Capacity utilization"
            suffix="%"
            value={estimateInputs.capacityUtilizationPercent}
            onChange={(value) =>
              updateEstimateInput("capacityUtilizationPercent", value)
            }
            step={0.1}
          />
          <Field
            label="Waste per operating day"
            suffix="tonnes"
            value={estimateInputs.dailyWasteTonnes}
            onChange={(value) => updateEstimateInput("dailyWasteTonnes", value)}
            step={1}
          />
          <Field
            label="Operating days per year"
            value={estimateInputs.operatingDaysPerYear}
            onChange={(value) =>
              updateEstimateInput("operatingDaysPerYear", value)
            }
            step={1}
          />
          <Field
            label="Capital cost"
            suffix="₹ crore"
            value={estimateInputs.capitalCostCrore}
            onChange={(value) => updateEstimateInput("capitalCostCrore", value)}
            step={1}
          />
          <Field
            label="Grant / capital subsidy"
            suffix="₹ crore"
            value={estimateInputs.grantCrore}
            onChange={(value) => updateEstimateInput("grantCrore", value)}
            step={1}
          />
          <Field
            label="Project year"
            value={estimateInputs.projectYear}
            onChange={(value) => updateEstimateInput("projectYear", value)}
            step={1}
          />
          <Field
            label="Six-month average SBI MCLR"
            suffix="%"
            value={estimateInputs.averageSbiMclrPercent}
            onChange={(value) =>
              updateEstimateInput("averageSbiMclrPercent", value)
            }
            step={0.01}
          />
          <Field
            label="Notified MAT rate"
            suffix="%"
            value={estimateInputs.matRatePercent}
            onChange={(value) => updateEstimateInput("matRatePercent", value)}
            step={0.01}
          />
        </div>

        <button
          className="primary-button estimate-submit"
          type="submit"
          disabled={estimateLoading}
        >
          <Icon name="chart" />
          {estimateLoading ? "Calculating…" : "Calculate estimate"}
          <Icon name="arrow" />
        </button>
        {estimateError && (
          <div className="error-message" role="alert">
            {estimateError}
          </div>
        )}
      </form>

      <section className="panel estimate-result-panel">
        <span className="section-kicker">02 / PROJECT SNAPSHOT</span>
        <h2>
          Numbers behind
          <br />
          the project<span className="period">.</span>
        </h2>
        {!estimate ? (
          <div className="empty-result">
            <div className="empty-orbit">
              <Icon name="chart" size={23} />
            </div>
            <strong>Estimate not calculated yet.</strong>
            <p>
              Adjust the project inputs and calculate an estimate to see the
              CERC assumptions applied.
            </p>
          </div>
        ) : (
          <div className="estimate-result-list">
            <div className="estimate-result-primary">
              <span>ANNUAL GENERATION</span>
              <strong>{formatEnergy(estimate.annualGenerationMwh)}</strong>
              <small>Calculated using 8,766 hours per year</small>
            </div>
            <EstimateResultRow
              label="Annual waste processed"
              value={`${formatNumber(estimate.annualWasteTonnes)} tonnes`}
            />
            <EstimateResultRow
              label="Eligible capital after grants"
              value={formatCrore(estimate.eligibleCapitalCostCrore)}
            />
            <EstimateResultRow
              label={`Annual depreciation · year ${estimateInputs.projectYear}`}
              value={formatCrore(estimate.annualDepreciationCrore)}
            />
            <EstimateResultRow
              label="Term-loan interest norm"
              value={`${formatNumber(estimate.loanInterestRatePercent, 2)}%`}
            />
            <EstimateResultRow
              label="Working-capital interest norm"
              value={`${formatNumber(
                estimate.workingCapitalInterestRatePercent,
                2,
              )}%`}
            />
            <EstimateResultRow
              label="Grossed-up return on equity"
              value={`${formatNumber(
                estimate.grossedUpReturnOnEquityPercent,
                2,
              )}%`}
            />
          </div>
        )}
        <div className="estimate-disclaimer">
          Indicative planning estimate only—not a CERC tariff determination.
          Does not calculate a complete tariff, fuel costs or working-capital
          amounts.
        </div>
      </section>
    </section>
  );
}

function EstimateResultRow({ label, value }) {
  return (
    <div className="estimate-result-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
