#include "backend.h"

#include <cerrno>
#include <cmath>
#include <cstdlib>
#include <iomanip>
#include <iostream>
#include <stdexcept>
#include <string>

namespace {

double parseDouble(const char* text) {
    errno = 0;
    char* end = nullptr;
    const double value = std::strtod(text, &end);
    if (errno == ERANGE || end == text || *end != '\0' || !std::isfinite(value)) {
        throw std::invalid_argument("API values must be finite numbers.");
    }
    return value;
}

int parseInteger(const char* text) {
    const double value = parseDouble(text);
    if (value < 0.0 || value > 1000000.0 || std::floor(value) != value) {
        throw std::invalid_argument("API counts must be non-negative whole numbers.");
    }
    return static_cast<int>(value);
}

void printEstimate(int argc, char* argv[]) {
    if (argc != 11) {
        throw std::invalid_argument("Estimate requires exactly nine numeric inputs.");
    }

    const wasteenergy::ProjectInputs inputs{
        parseDouble(argv[2]),
        parseDouble(argv[3]),
        parseDouble(argv[4]),
        parseInteger(argv[5]),
        parseDouble(argv[6]),
        parseDouble(argv[7]),
        parseInteger(argv[8]),
        parseDouble(argv[9]),
        parseDouble(argv[10])};
    const auto estimate = wasteenergy::estimateProject(inputs);

    std::cout << "{\"annualWasteTonnes\":" << estimate.annualWasteTonnes
              << ",\"annualGenerationMwh\":" << estimate.annualGenerationMwh
              << ",\"eligibleCapitalCostCrore\":" << estimate.eligibleCapitalCostCrore
              << ",\"depreciationRatePercent\":" << estimate.depreciationRatePercent
              << ",\"annualDepreciationCrore\":" << estimate.annualDepreciationCrore
              << ",\"loanInterestRatePercent\":" << estimate.loanInterestRatePercent
              << ",\"workingCapitalInterestRatePercent\":"
              << estimate.workingCapitalInterestRatePercent
              << ",\"grossedUpReturnOnEquityPercent\":"
              << estimate.grossedUpReturnOnEquityPercent << "}\n";
}

void printOptimization(int argc, char* argv[]) {
    if (argc < 5) {
        throw std::invalid_argument(
            "Optimization requires a budget, available waste, plant count, and plant data.");
    }

    const double budget = parseDouble(argv[2]);
    const double availableWaste = parseDouble(argv[3]);
    const int plantCount = parseInteger(argv[4]);
    if (plantCount > 16 || argc != 5 + plantCount * 4) {
        throw std::invalid_argument("Optimization requires four values for each of up to 16 plants.");
    }

    wasteenergy::WastePlantOption plants[16]{};
    for (int i = 0; i < plantCount; ++i) {
        const int offset = 5 + i * 4;
        plants[i] = {
            parseDouble(argv[offset]),
            parseDouble(argv[offset + 1]),
            parseDouble(argv[offset + 2]),
            parseDouble(argv[offset + 3])};
    }

    const auto result = wasteenergy::optimizePortfolio(
        wasteenergy::OptimizationInputs{budget, availableWaste},
        plants,
        plantCount);

    std::cout << "{\"annualGenerationMwh\":" << result.annualGenerationMwh
              << ",\"dailyWasteTonnes\":" << result.dailyWasteTonnes
              << ",\"capitalCostCrore\":" << result.capitalCostCrore
              << ",\"approximateCapitalBudgetUsedCrore\":"
              << result.approximateCapitalBudgetUsedCrore
              << ",\"approximateWasteUsedTonnesPerDay\":"
              << result.approximateWasteUsedTonnesPerDay
              << ",\"selectedIndices\":[";
    for (int i = 0; i < result.selectedCount; ++i) {
        if (i != 0) {
            std::cout << ',';
        }
        std::cout << result.selectedIndices[i];
    }
    std::cout << "]}\n";
}

}  // namespace

int main(int argc, char* argv[]) {
    std::cout << std::setprecision(15);
    try {
        if (argc < 2) {
            throw std::invalid_argument("Choose the estimate or optimize API operation.");
        }

        const std::string operation(argv[1]);
        if (operation == "estimate") {
            printEstimate(argc, argv);
        } else if (operation == "optimize") {
            printOptimization(argc, argv);
        } else {
            throw std::invalid_argument("Unknown API operation.");
        }
    } catch (const std::exception& error) {
        std::cerr << error.what() << '\n';
        return 2;
    }

    return 0;
}
