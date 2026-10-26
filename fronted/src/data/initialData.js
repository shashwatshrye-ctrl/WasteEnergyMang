export const initialPlants = [
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

export const initialLoads = [
  {
    id: "hospital",
    name: "Hospitals & clinics",
    type: "Critical care",
    priority: 5,
    demandMwhPerDay: 45,
  },
  {
    id: "emergency",
    name: "Emergency services",
    type: "Emergency response",
    priority: 4,
    demandMwhPerDay: 20,
  },
  {
    id: "water",
    name: "Water treatment",
    type: "Essential services",
    priority: 3,
    demandMwhPerDay: 35,
  },
  {
    id: "homes",
    name: "Community homes",
    type: "Community demand",
    priority: 2,
    demandMwhPerDay: 110,
  },
];

export const initialEstimate = {
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

export const priorityNames = {
  5: "Critical · first",
  4: "High",
  3: "Important",
  2: "Standard",
  1: "Flexible",
};

export function computeInitialDispatch(
  plants = initialPlants,
  loads = initialLoads,
) {
  const annualMwh = plants.reduce(
    (sum, plant) =>
      sum + plant.capacityMw * 8766 * (plant.capacityUtilizationPercent / 100),
    0,
  );
  const dailyGenerationMwh = annualMwh / 365;
  let remainingEnergyMwh = dailyGenerationMwh;

  const orderedLoads = [...loads].sort((a, b) => b.priority - a.priority);
  const allocationsById = {};

  for (const load of orderedLoads) {
    const allocated = Math.min(remainingEnergyMwh, load.demandMwhPerDay);
    remainingEnergyMwh = Math.max(0, remainingEnergyMwh - allocated);
    allocationsById[load.id] = allocated;
  }

  const dispatchLoads = loads.map((load, index) => ({
    ...load,
    index,
    allocatedMwhPerDay: allocationsById[load.id] ?? 0,
  }));

  const orderedDispatchLoads = orderedLoads.map((load) => ({
    ...load,
    index: loads.findIndex((item) => item.id === load.id),
    allocatedMwhPerDay: allocationsById[load.id],
  }));
  const lampEnergyMwh = (100 * 12) / 1_000_000;

  return {
    availableGenerationMwhPerDay: dailyGenerationMwh,
    remainingEnergyMwhPerDay: remainingEnergyMwh,
    streetLampsPowered:
      lampEnergyMwh > 0 ? Math.floor(remainingEnergyMwh / lampEnergyMwh) : 0,
    loads: dispatchLoads,
    orderedLoads: orderedDispatchLoads,
    queueOrder: orderedLoads.map((load) =>
      loads.findIndex((item) => item.id === load.id),
    ),
  };
}

export const initialDispatch = computeInitialDispatch();
