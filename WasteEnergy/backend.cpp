#include "backend.h"

#include <algorithm>
#include <cmath>
#include <cstddef>
#include <cstdint>
#include <stdexcept>
#include <vector>

namespace wasteenergy {
namespace {

void requireFinite(double value, const char* fieldName) {
    if (!std::isfinite(value)) {
        throw std::invalid_argument(fieldName);
    }
}

}  // namespace

ProjectEstimate estimateProject(const ProjectInputs& inputs) {
    requireFinite(inputs.plantCapacityMw, "Plant capacity must be a finite number.");
    requireFinite(inputs.capacityUtilizationPercent, "Capacity utilization must be a finite number.");
    requireFinite(inputs.dailyWasteTonnes, "Daily waste must be a finite number.");
    requireFinite(inputs.capitalCostCrore, "Capital cost must be a finite number.");
    requireFinite(inputs.grantCrore, "Grant must be a finite number.");
    requireFinite(inputs.averageSbiMclrPercent, "SBI MCLR must be a finite number.");
    requireFinite(inputs.matRatePercent, "MAT rate must be a finite number.");

    if (inputs.plantCapacityMw <= 0.0) {
        throw std::invalid_argument("Plant capacity must be greater than zero.");
    }
    if (inputs.capacityUtilizationPercent <= 0.0 ||
        inputs.capacityUtilizationPercent > 100.0) {
        throw std::invalid_argument("Capacity utilization must be greater than 0% and at most 100%.");
    }
    if (inputs.dailyWasteTonnes <= 0.0) {
        throw std::invalid_argument("Daily waste must be greater than zero.");
    }
    if (inputs.operatingDaysPerYear < 1 || inputs.operatingDaysPerYear > 366) {
        throw std::invalid_argument("Operating days must be between 1 and 366.");
    }
    if (inputs.capitalCostCrore <= 0.0) {
        throw std::invalid_argument("Capital cost must be greater than zero.");
    }
    if (inputs.grantCrore < 0.0 || inputs.grantCrore > inputs.capitalCostCrore) {
        throw std::invalid_argument("Grant must be between zero and the capital cost.");
    }
    if (inputs.projectYear < 1 ||
        inputs.projectYear > RegulatoryNorms::mswUsefulLifeYears) {
        throw std::invalid_argument("Project year must be within the 20-year useful life.");
    }
    if (inputs.averageSbiMclrPercent < 0.0 || inputs.averageSbiMclrPercent > 100.0) {
        throw std::invalid_argument("SBI MCLR must be between 0% and 100%.");
    }
    if (inputs.matRatePercent < 0.0 || inputs.matRatePercent >= 100.0) {
        throw std::invalid_argument("MAT rate must be at least 0% and less than 100%.");
    }

    ProjectEstimate estimate;
    estimate.annualWasteTonnes =
        inputs.dailyWasteTonnes * static_cast<double>(inputs.operatingDaysPerYear);
    estimate.annualGenerationMwh =
        inputs.plantCapacityMw * RegulatoryNorms::hoursPerYear *
        inputs.capacityUtilizationPercent / 100.0;
    estimate.eligibleCapitalCostCrore = inputs.capitalCostCrore - inputs.grantCrore;

    const double annualFirstPeriodDepreciation =
        estimate.eligibleCapitalCostCrore *
        RegulatoryNorms::firstPeriodDepreciationPercent / 100.0;
    const double totalAllowedDepreciation =
        estimate.eligibleCapitalCostCrore *
        (100.0 - RegulatoryNorms::salvageValuePercent) / 100.0;

    if (inputs.projectYear <= RegulatoryNorms::firstPeriodDepreciationYears) {
        estimate.depreciationRatePercent =
            RegulatoryNorms::firstPeriodDepreciationPercent;
        estimate.annualDepreciationCrore = annualFirstPeriodDepreciation;
    } else {
        const int remainingYears =
            RegulatoryNorms::mswUsefulLifeYears -
            RegulatoryNorms::firstPeriodDepreciationYears;
        const double remainingDepreciation =
            totalAllowedDepreciation -
            annualFirstPeriodDepreciation *
                RegulatoryNorms::firstPeriodDepreciationYears;
        estimate.annualDepreciationCrore =
            remainingDepreciation / static_cast<double>(remainingYears);
        estimate.depreciationRatePercent =
            estimate.eligibleCapitalCostCrore == 0.0
                ? 0.0
                : estimate.annualDepreciationCrore /
                      estimate.eligibleCapitalCostCrore * 100.0;
    }

    estimate.loanInterestRatePercent =
        inputs.averageSbiMclrPercent +
        RegulatoryNorms::loanInterestSpreadPercent;
    estimate.workingCapitalInterestRatePercent =
        inputs.averageSbiMclrPercent +
        RegulatoryNorms::workingCapitalInterestSpreadPercent;
    estimate.grossedUpReturnOnEquityPercent =
        RegulatoryNorms::returnOnEquityPercent /
        (1.0 - inputs.matRatePercent / 100.0);

    requireFinite(estimate.annualWasteTonnes, "Calculated annual waste exceeds the supported range.");
    requireFinite(estimate.annualGenerationMwh, "Calculated generation exceeds the supported range.");
    requireFinite(estimate.eligibleCapitalCostCrore, "Calculated capital cost exceeds the supported range.");
    requireFinite(estimate.annualDepreciationCrore, "Calculated depreciation exceeds the supported range.");
    requireFinite(estimate.loanInterestRatePercent, "Calculated loan interest exceeds the supported range.");
    requireFinite(estimate.workingCapitalInterestRatePercent,
                  "Calculated working-capital interest exceeds the supported range.");
    requireFinite(estimate.grossedUpReturnOnEquityPercent,
                  "Calculated return on equity exceeds the supported range.");

    return estimate;
}

OptimizationResult optimizePortfolio(
    const OptimizationInputs& inputs,
    const WastePlantOption* plants,
    int plantCount) {
    constexpr int maxPlants = 16;
    constexpr double budgetStepCrore = 0.5;
    constexpr double wasteStepTonnesPerDay = 10.0;
    constexpr double maxBudgetCrore = 2000.0;
    constexpr double maxWasteTonnesPerDay = 10000.0;

    requireFinite(inputs.capitalBudgetCrore, "Capital budget must be a finite number.");
    requireFinite(inputs.availableWasteTonnesPerDay, "Available waste must be a finite number.");
    if (inputs.capitalBudgetCrore < 0.0 || inputs.capitalBudgetCrore > maxBudgetCrore) {
        throw std::invalid_argument("Capital budget must be between 0 and 2000 crore.");
    }
    if (inputs.availableWasteTonnesPerDay < 0.0 ||
        inputs.availableWasteTonnesPerDay > maxWasteTonnesPerDay) {
        throw std::invalid_argument("Available waste must be between 0 and 10000 tonnes per day.");
    }
    if (plantCount < 0 || plantCount > maxPlants || (plantCount > 0 && plants == nullptr)) {
        throw std::invalid_argument("The optimizer accepts between 0 and 16 plant options.");
    }

    const int budgetSteps = static_cast<int>(
        std::floor(inputs.capitalBudgetCrore / budgetStepCrore + 1e-10));
    const int wasteSteps = static_cast<int>(
        std::floor(inputs.availableWasteTonnesPerDay / wasteStepTonnesPerDay + 1e-10));
    const std::size_t wasteWidth = static_cast<std::size_t>(wasteSteps + 1);
    const std::size_t stateCount =
        static_cast<std::size_t>(budgetSteps + 1) * wasteWidth;

    std::vector<double> bestGeneration(stateCount, -1.0);
    bestGeneration[0] = 0.0;
    std::vector<std::uint8_t> selectedAtStage(
        static_cast<std::size_t>(plantCount) * stateCount, 0);

    int budgetUnits[16]{};
    int wasteUnits[16]{};
    double annualGeneration[16]{};

    for (int i = 0; i < plantCount; ++i) {
        const auto& plant = plants[i];
        requireFinite(plant.capacityMw, "Plant capacity must be a finite number.");
        requireFinite(
            plant.capacityUtilizationPercent,
            "Capacity utilization must be a finite number.");
        requireFinite(plant.dailyWasteTonnes, "Plant waste input must be a finite number.");
        requireFinite(plant.capitalCostCrore, "Plant capital cost must be a finite number.");

        if (plant.capacityMw <= 0.0) {
            throw std::invalid_argument("Plant capacity must be greater than zero.");
        }
        if (plant.capacityUtilizationPercent <= 0.0 ||
            plant.capacityUtilizationPercent > 100.0) {
            throw std::invalid_argument(
                "Plant capacity utilization must be greater than 0% and at most 100%.");
        }
        if (plant.dailyWasteTonnes <= 0.0 ||
            plant.dailyWasteTonnes > maxWasteTonnesPerDay) {
            throw std::invalid_argument(
                "Plant waste input must be greater than 0 and at most 10000 tonnes per day.");
        }
        if (plant.capitalCostCrore <= 0.0 || plant.capitalCostCrore > maxBudgetCrore) {
            throw std::invalid_argument(
                "Plant capital cost must be greater than 0 and at most 2000 crore.");
        }

        budgetUnits[i] = static_cast<int>(
            std::ceil(plant.capitalCostCrore / budgetStepCrore - 1e-10));
        wasteUnits[i] = static_cast<int>(
            std::ceil(plant.dailyWasteTonnes / wasteStepTonnesPerDay - 1e-10));
        annualGeneration[i] =
            plant.capacityMw * RegulatoryNorms::hoursPerYear *
            plant.capacityUtilizationPercent / 100.0;
        requireFinite(annualGeneration[i], "Calculated generation exceeds the supported range.");
    }

    for (int i = 0; i < plantCount; ++i) {
        if (budgetUnits[i] > budgetSteps || wasteUnits[i] > wasteSteps) {
            continue;
        }

        const std::size_t stageOffset = static_cast<std::size_t>(i) * stateCount;
        for (int budget = budgetSteps; budget >= budgetUnits[i]; --budget) {
            for (int waste = wasteSteps; waste >= wasteUnits[i]; --waste) {
                const std::size_t target =
                    static_cast<std::size_t>(budget) * wasteWidth +
                    static_cast<std::size_t>(waste);
                const std::size_t source =
                    static_cast<std::size_t>(budget - budgetUnits[i]) * wasteWidth +
                    static_cast<std::size_t>(waste - wasteUnits[i]);
                if (bestGeneration[source] < 0.0) {
                    continue;
                }

                const double candidate = bestGeneration[source] + annualGeneration[i];
                requireFinite(candidate, "Portfolio generation exceeds the supported range.");
                if (candidate > bestGeneration[target] + 1e-9) {
                    bestGeneration[target] = candidate;
                    selectedAtStage[stageOffset + target] = 1;
                }
            }
        }
    }

    std::size_t bestState = 0;
    double maximumGeneration = 0.0;
    for (std::size_t state = 0; state < stateCount; ++state) {
        if (bestGeneration[state] > maximumGeneration + 1e-9) {
            maximumGeneration = bestGeneration[state];
            bestState = state;
        }
    }

    int remainingBudget = static_cast<int>(bestState / wasteWidth);
    int remainingWaste = static_cast<int>(bestState % wasteWidth);
    OptimizationResult result;
    result.annualGenerationMwh = maximumGeneration;

    for (int i = plantCount - 1; i >= 0; --i) {
        const std::size_t state =
            static_cast<std::size_t>(remainingBudget) * wasteWidth +
            static_cast<std::size_t>(remainingWaste);
        const std::size_t decision =
            static_cast<std::size_t>(i) * stateCount + state;
        if (selectedAtStage[decision] == 0) {
            continue;
        }

        result.selectedIndices[result.selectedCount++] = i;
        result.capitalCostCrore += plants[i].capitalCostCrore;
        result.dailyWasteTonnes += plants[i].dailyWasteTonnes;
        remainingBudget -= budgetUnits[i];
        remainingWaste -= wasteUnits[i];
    }

    std::reverse(
        result.selectedIndices,
        result.selectedIndices + result.selectedCount);
    result.approximateCapitalBudgetUsedCrore =
        static_cast<double>(bestState / wasteWidth) * budgetStepCrore;
    result.approximateWasteUsedTonnesPerDay =
        static_cast<double>(bestState % wasteWidth) * wasteStepTonnesPerDay;
    return result;
}

}  // namespace wasteenergy
