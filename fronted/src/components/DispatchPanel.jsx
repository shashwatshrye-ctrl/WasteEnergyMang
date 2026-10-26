import Field from "./Field.jsx";
import Icon from "./Icon.jsx";
import { priorityNames } from "../data/initialData.js";
import { formatDailyEnergy, formatNumber } from "../utils/formatters.js";

export default function DispatchPanel({
  loads,
  updateLoad,
  dispatch,
  dispatchLoading,
  dispatchError,
  streetLampWattage,
  setStreetLampWattage,
  streetLampHoursPerNight,
  setStreetLampHoursPerNight,
  runDispatch,
  generationMwh,
}) {
  const orderedLoads =
    dispatch?.orderedLoads ??
    [...loads].sort((a, b) => b.priority - a.priority);

  return (
    <section className="panel dispatch-panel">
      <div className="dispatch-heading">
        <div>
          <span className="section-kicker">
            03 / PRIORITY-BASED POWER ALLOCATION
          </span>
          <h2>Power the essentials first.</h2>
          <p className="panel-description">
            A C++ priority queue allocates daily generation to critical loads
            before community demand. Set each load&apos;s daily need and
            priority tier.
          </p>
        </div>
        <span className="algorithm-mark">PRIORITY QUEUE</span>
      </div>

      <div className="dispatch-layout">
        <div className="dispatch-loads">
          <div className="dispatch-column-head">
            <span>LOAD / SERVICE</span>
            <span>PRIORITY</span>
            <span>NEED / DAY</span>
            <span>ALLOCATED / DAY</span>
          </div>

          {orderedLoads.map((load) => {
            const currentLoad = loads.find((item) => item.id === load.id);
            const allocation = dispatch?.loads?.find(
              (item) => item.id === load.id,
            );
            const served = allocation?.allocatedMwhPerDay ?? 0;
            const coverage =
              load.demandMwhPerDay > 0
                ? Math.min(100, (served / load.demandMwhPerDay) * 100)
                : 0;

            return (
              <DispatchLoadRow
                key={load.id}
                load={currentLoad}
                served={served}
                coverage={coverage}
                hasDispatch={Boolean(dispatch)}
                onUpdate={updateLoad}
              />
            );
          })}

          {dispatchError && (
            <div className="error-message" role="alert">
              {dispatchError}
            </div>
          )}

          <div className="lamp-settings">
            <Field
              label="Lamp power"
              suffix="watts"
              value={streetLampWattage}
              min={10}
              max={2000}
              step={10}
              onChange={(value) => setStreetLampWattage(Number(value))}
            />
            <Field
              label="Nightly operation"
              suffix="hours"
              value={streetLampHoursPerNight}
              min={0.1}
              max={24}
              step={0.5}
              onChange={(value) => setStreetLampHoursPerNight(Number(value))}
            />
            <button
              className="primary-button dispatch-button"
              type="button"
              onClick={() => runDispatch(generationMwh)}
              disabled={dispatchLoading}
            >
              <Icon name="bolt" size={17} />
              {dispatchLoading ? "Allocating…" : "Apply priority queue"}
            </button>
          </div>

          <p className="dispatch-note">
            Tier 5 is served first; equal-tier loads keep their listed order.
            Street-lighting capacity is estimated from surplus generation based
            on planning assumptions.
          </p>
        </div>

        <StreetLampSummary
          dispatch={dispatch}
          dispatchLoading={dispatchLoading}
          wattage={streetLampWattage}
          hoursPerNight={streetLampHoursPerNight}
        />
      </div>
    </section>
  );
}

function DispatchLoadRow({ load, served, coverage, hasDispatch, onUpdate }) {
  return (
    <div className="dispatch-row">
      <div className="dispatch-load-name">
        <span className={`priority-badge tier-${load.priority}`}>
          T{load.priority}
        </span>
        <div>
          <strong>{load.name}</strong>
          <small>{load.type}</small>
        </div>
      </div>

      <label className="priority-control">
        <span className="sr-only">{load.name} priority</span>
        <select
          aria-label={`${load.name} priority`}
          value={load.priority}
          onChange={(event) =>
            onUpdate(load.id, "priority", event.target.value)
          }
        >
          {[5, 4, 3, 2, 1].map((tier) => (
            <option value={tier} key={tier}>
              T{tier} · {priorityNames[tier]}
            </option>
          ))}
        </select>
      </label>

      <label className="demand-control">
        <span className="sr-only">{load.name} demand MWh per day</span>
        <input
          type="number"
          min="0"
          step="0.1"
          value={load.demandMwhPerDay}
          onChange={(event) =>
            onUpdate(load.id, "demandMwhPerDay", event.target.value)
          }
        />
        <span>MWh</span>
      </label>

      <div className="allocation-control">
        <strong>{hasDispatch ? formatDailyEnergy(served) : "—"}</strong>
        {hasDispatch && (
          <div className="allocation-track">
            <span style={{ width: `${coverage}%` }} />
          </div>
        )}
      </div>
    </div>
  );
}

function StreetLampSummary({
  dispatch,
  dispatchLoading,
  wattage,
  hoursPerNight,
}) {
  return (
    <aside className="lamp-summary">
      <span className="lamp-summary-kicker">STREET-LIGHTING POTENTIAL</span>
      {dispatchLoading ? (
        <div className="lamp-empty">
          <span className="loader" /> Allocating daily generation…
        </div>
      ) : dispatch ? (
        <>
          <strong className="lamp-count">
            {formatNumber(dispatch.streetLampsPowered)}
          </strong>
          <span className="lamp-unit">street lamps powered</span>
          <LampEnergy
            label="Daily renewable generation"
            value={dispatch.availableGenerationMwhPerDay}
          />
          <LampEnergy
            label="Surplus after priority loads"
            value={dispatch.remainingEnergyMwhPerDay}
          />
          <p>
            Based on {wattage} W per lamp for {hoursPerNight} hours each night.
            Lamps use only the energy left after higher-priority loads.
          </p>
        </>
      ) : (
        <div className="lamp-empty">
          <span className="loader" /> Estimating street-lighting potential…
        </div>
      )}
    </aside>
  );
}

function LampEnergy({ label, value }) {
  return (
    <div className="lamp-energy">
      <span>{label}</span>
      <strong>{formatDailyEnergy(value)}</strong>
    </div>
  );
}
