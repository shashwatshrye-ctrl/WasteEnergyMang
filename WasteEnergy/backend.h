#pragma once

namespace wasteenergy {

struct RegulatoryNorms {
    inline static constexpr int mswUsefulLifeYears = 20;
    inline static constexpr int loanTenureYears = 15;
    inline static constexpr int hoursPerYear = 8766;
    inline static constexpr double loanInterestSpreadPercent = 2.0;
    inline static constexpr double workingCapitalInterestSpreadPercent = 3.25;
    inline static constexpr double firstPeriodDepreciationPercent = 4.67;
    inline static constexpr int firstPeriodDepreciationYears = 15;
    inline static constexpr double salvageValuePercent = 10.0;
    inline static constexpr double returnOnEquityPercent = 14.0;
};

struct ProjectInputs {
    double plantCapacityMw = 0.0;
    double capacityUtilizationPercent = 0.0;
    double dailyWasteTonnes = 0.0;
    int operatingDaysPerYear = 365;
    double capitalCostCrore = 0.0;
    double grantCrore = 0.0;
    int projectYear = 1;
    double averageSbiMclrPercent = 0.0;
    double matRatePercent = 0.0;
};

struct ProjectEstimate {
    double annualWasteTonnes = 0.0;
    double annualGenerationMwh = 0.0;
    double eligibleCapitalCostCrore = 0.0;
    double depreciationRatePercent = 0.0;
    double annualDepreciationCrore = 0.0;
    double loanInterestRatePercent = 0.0;
    double workingCapitalInterestRatePercent = 0.0;
    double grossedUpReturnOnEquityPercent = 0.0;
};

struct WastePlantOption {
    double capacityMw = 0.0;
    double capacityUtilizationPercent = 0.0;
    double dailyWasteTonnes = 0.0;
    double capitalCostCrore = 0.0;
};

struct OptimizationInputs {
    double capitalBudgetCrore = 0.0;
    double availableWasteTonnesPerDay = 0.0;
};

struct OptimizationResult {
    double annualGenerationMwh = 0.0;
    double dailyWasteTonnes = 0.0;
    double capitalCostCrore = 0.0;
    double approximateCapitalBudgetUsedCrore = 0.0;
    double approximateWasteUsedTonnesPerDay = 0.0;
    int selectedIndices[16]{};
    int selectedCount = 0;
};

ProjectEstimate estimateProject(const ProjectInputs& inputs);
OptimizationResult optimizePortfolio(
    const OptimizationInputs& inputs,
    const WastePlantOption* plants,
    int plantCount);

}  // namespace wasteenergy
