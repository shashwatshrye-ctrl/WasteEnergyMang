export const formatNumber = (value, maximumFractionDigits = 0) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits }).format(value);

export const formatCrore = (value) =>
  `₹${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 1 }).format(value)} cr`;

export const formatEnergy = (value) => `${formatNumber(value)} MWh`;

export const formatDailyEnergy = (value) =>
  `${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 1 }).format(value)} MWh/day`;
