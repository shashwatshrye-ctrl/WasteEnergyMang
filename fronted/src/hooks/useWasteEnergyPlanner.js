import { useEffect, useMemo, useState } from "react";
import {
  computeInitialDispatch,
  initialEstimate,
  initialLoads,
  initialPlants,
} from "../data/initialData.js";

export default function useWasteEnergyPlanner() {
  const [plants, setPlants] = useState(initialPlants);
  const [capitalBudgetCrore, setCapitalBudgetCrore] = useState(180);
  const [availableWasteTonnesPerDay, setAvailableWasteTonnesPerDay] =
    useState(700);
  const [optimization, setOptimization] = useState(null);
  const [optimizerLoading, setOptimizerLoading] = useState(false);
  const [optimizerError, setOptimizerError] = useState("");

  const [loads, setLoads] = useState(initialLoads);
  const [streetLampWattage, setStreetLampWattage] = useState(100);
  const [streetLampHoursPerNight, setStreetLampHoursPerNight] = useState(12);
  const [dispatch, setDispatch] = useState(() => computeInitialDispatch());
  const [dispatchLoading, setDispatchLoading] = useState(false);
  const [dispatchError, setDispatchError] = useState("");

  const [estimateInputs, setEstimateInputs] = useState(initialEstimate);
  const [estimate, setEstimate] = useState(null);
  const [estimateLoading, setEstimateLoading] = useState(false);
  const [estimateError, setEstimateError] = useState("");

  const selectedPlantIds = useMemo(
    () => new Set(optimization?.selectedPlants?.map((plant) => plant.id) ?? []),
    [optimization],
  );

  function updateCapitalBudget(value) {
    setCapitalBudgetCrore(Number(value));
    setOptimization(null);
  }

  function updateWasteSupply(value) {
    setAvailableWasteTonnesPerDay(Number(value));
    setOptimization(null);
  }

  const fallbackDailyGenerationMwh = useMemo(() => {
    if (optimization?.annualGenerationMwh) {
      return optimization.annualGenerationMwh / 365;
    }

    const annualGenerationMwh = plants.reduce(
      (sum, plant) =>
        sum +
        (plant.capacityMw || 0) *
          8766 *
          ((plant.capacityUtilizationPercent || 0) / 100),
      0,
    );

    return annualGenerationMwh / 365;
  }, [optimization, plants]);

  function updatePlant(id, key, value) {
    setPlants((currentPlants) =>
      currentPlants.map((plant) =>
        plant.id === id
          ? {
              ...plant,
              [key]:
                key === "name" || key === "technology" ? value : Number(value),
            }
          : plant,
      ),
    );
    setOptimization(null);
  }

  function addPlant() {
    if (plants.length >= 16) return;

    setPlants((currentPlants) => [
      ...currentPlants,
      {
        id: `plant-${Date.now()}`,
        name: `New recovery plant ${currentPlants.length + 1}`,
        technology: "Municipal solid waste",
        capacityMw: 5,
        capacityUtilizationPercent: 80,
        dailyWasteTonnes: 75,
        capitalCostCrore: 40,
      },
    ]);
    setOptimization(null);
  }

  function removePlant(id) {
    setPlants((currentPlants) =>
      currentPlants.filter((plant) => plant.id !== id),
    );
    setOptimization(null);
  }

  async function runDispatch(generationMwh) {
    setDispatchLoading(true);
    setDispatchError("");

    const availableGenerationMwhPerDay =
      typeof generationMwh === "number" && Number.isFinite(generationMwh)
        ? generationMwh / 365
        : fallbackDailyGenerationMwh;

    try {
      const response = await fetch("/api/dispatch", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          availableGenerationMwhPerDay,
          streetLampWattage: Number(streetLampWattage),
          streetLampHoursPerNight: Number(streetLampHoursPerNight),
          loads,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(
          payload.error || "Could not dispatch available generation.",
        );
      }

      setDispatch(payload);
    } catch (error) {
      setDispatch(null);
      setDispatchError(
        error.message || "The C++ priority queue could not be reached.",
      );
    } finally {
      setDispatchLoading(false);
    }
  }

  async function runOptimization(event) {
    event.preventDefault();
    setOptimizerLoading(true);
    setOptimizerError("");
    setOptimization(null);

    try {
      const response = await fetch("/api/optimize", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          capitalBudgetCrore,
          availableWasteTonnesPerDay,
          plants,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Could not optimize this portfolio.");
      }

      setOptimization(payload);
      await runDispatch(payload.annualGenerationMwh);
    } catch (error) {
      setOptimizerError(
        error.message || "The C++ optimizer could not be reached.",
      );
    } finally {
      setOptimizerLoading(false);
    }
  }

  function updateLoad(id, key, value) {
    setLoads((currentLoads) =>
      currentLoads.map((load) =>
        load.id === id ? { ...load, [key]: Number(value) } : load,
      ),
    );
  }

  function updateEstimateInput(key, value) {
    setEstimateInputs((currentInputs) => ({
      ...currentInputs,
      [key]: Number(value),
    }));
  }

  async function runEstimate(event) {
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

      if (!response.ok) {
        throw new Error(payload.error || "Could not calculate the estimate.");
      }

      setEstimate(payload);
    } catch (error) {
      setEstimateError(
        error.message || "The C++ backend could not be reached.",
      );
    } finally {
      setEstimateLoading(false);
    }
  }

  useEffect(() => {
    runDispatch(optimization?.annualGenerationMwh);
  }, [
    streetLampWattage,
    streetLampHoursPerNight,
    loads,
    optimization,
    fallbackDailyGenerationMwh,
  ]);

  return {
    plants,
    capitalBudgetCrore,
    setCapitalBudgetCrore,
    availableWasteTonnesPerDay,
    setAvailableWasteTonnesPerDay,
    optimization,
    optimizerLoading,
    optimizerError,
    loads,
    streetLampWattage,
    setStreetLampWattage,
    streetLampHoursPerNight,
    setStreetLampHoursPerNight,
    dispatch,
    dispatchLoading,
    dispatchError,
    estimateInputs,
    estimate,
    estimateLoading,
    estimateError,
    selectedPlantIds,
    updateCapitalBudget,
    updateWasteSupply,
    updatePlant,
    addPlant,
    removePlant,
    runDispatch,
    runOptimization,
    updateLoad,
    updateEstimateInput,
    runEstimate,
  };
}
