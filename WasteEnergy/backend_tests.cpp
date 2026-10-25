#include "backend.h"

#include <cmath>
#include <iostream>
#include <stdexcept>

namespace {

bool nearlyEqual(double actual, double expected) {
    return std::abs(actual - expected) < 1e-9;
}

void expect(bool condition, const char* message) {
    if (!condition) {
        throw std::runtime_error(message);
    }
}

template <typename Operation>
void expectInvalid(Operation operation, const char* message) {
    try {
        operation();
    } catch (const std::invalid_argument&) {
        return;
    }
    throw std::runtime_error(message);
}

void testProjectEstimate() {
    const wasteenergy::ProjectInputs inputs{
        10.0, 80.0, 500.0, 365, 100.0, 10.0, 1, 8.5, 15.0};
    const auto estimate = wasteenergy::estimateProject(inputs);

    expect(nearlyEqual(estimate.annualWasteTonnes, 182500.0),
           "Annual waste should use the entered daily throughput and operating days.");
    expect(nearlyEqual(estimate.annualGenerationMwh, 70128.0),
           "Annual generation should use capacity, 8766 hours, and utilization.");
    expect(nearlyEqual(estimate.eligibleCapitalCostCrore, 90.0),
           "Grants must be excluded from the depreciation base.");
    expect(nearlyEqual(estimate.annualDepreciationCrore, 4.203),
           "First-period depreciation should be 4.67% of eligible capital cost.");
    expect(nearlyEqual(estimate.loanInterestRatePercent, 10.5),
           "Loan interest should add 200 basis points to SBI MCLR.");
    expect(nearlyEqual(estimate.workingCapitalInterestRatePercent, 11.75),
           "Working-capital interest should add 325 basis points to SBI MCLR.");
    expect(nearlyEqual(estimate.grossedUpReturnOnEquityPercent, 14.0 / 0.85),
           "Return on equity should be grossed up using the supplied MAT rate.");
}

void testLaterDepreciationYears() {
    auto inputs = wasteenergy::ProjectInputs{
        1.0, 50.0, 1.0, 365, 100.0, 0.0, 16, 8.0, 0.0};
    const auto estimate = wasteenergy::estimateProject(inputs);

    expect(nearlyEqual(estimate.annualDepreciationCrore, 3.99),
           "Depreciation after year 15 should spread the remaining 90% depreciable value.");
    expect(nearlyEqual(estimate.depreciationRatePercent, 3.99),
           "The later-year depreciation rate should be reported against eligible capital cost.");

    inputs.projectYear = 20;
    const auto finalYear = wasteenergy::estimateProject(inputs);
    expect(nearlyEqual(finalYear.annualDepreciationCrore, 3.99),
           "The final useful-life year should receive the final depreciation installment.");

    double totalDepreciation = 0.0;
    for (int year = 1; year <= wasteenergy::RegulatoryNorms::mswUsefulLifeYears; ++year) {
        inputs.projectYear = year;
        totalDepreciation += wasteenergy::estimateProject(inputs).annualDepreciationCrore;
    }
    expect(nearlyEqual(totalDepreciation, 90.0),
           "Total depreciation over the useful life should equal 90% of eligible capital cost.");
}

void testInputValidation() {
    auto inputs = wasteenergy::ProjectInputs{
        1.0, 50.0, 1.0, 365, 100.0, 0.0, 1, 8.0, 15.0};

    inputs.capacityUtilizationPercent = 101.0;
    expectInvalid([&] { wasteenergy::estimateProject(inputs); },
                  "Utilization above 100% should be rejected.");

    inputs.capacityUtilizationPercent = 50.0;
    inputs.grantCrore = 101.0;
    expectInvalid([&] { wasteenergy::estimateProject(inputs); },
                  "A grant above capital cost should be rejected.");

    inputs.grantCrore = 0.0;
    inputs.projectYear = 21;
    expectInvalid([&] { wasteenergy::estimateProject(inputs); },
                  "A project year outside the useful life should be rejected.");

    inputs.projectYear = 1;
    inputs.matRatePercent = 100.0;
    expectInvalid([&] { wasteenergy::estimateProject(inputs); },
                  "A 100% MAT rate should be rejected to prevent division by zero.");

    inputs.matRatePercent = 15.0;
    inputs.dailyWasteTonnes = std::nan("");
    expectInvalid([&] { wasteenergy::estimateProject(inputs); },
                  "Non-finite input values should be rejected.");
}

void testPortfolioOptimization() {
    const wasteenergy::WastePlantOption plants[] = {
        {20.0, 80.0, 300.0, 110.0},
        {14.0, 80.0, 200.0, 50.0},
        {7.0, 80.0, 100.0, 50.0},
        {5.0, 80.0, 100.0, 40.0}};
    const wasteenergy::OptimizationInputs inputs{100.0, 300.0};
    const auto result = wasteenergy::optimizePortfolio(inputs, plants, 4);

    expect(result.selectedCount == 2,
           "The optimal portfolio should select two compatible projects.");
    expect(result.selectedIndices[0] == 1 && result.selectedIndices[1] == 2,
           "The DP should choose the highest-generation portfolio within both limits.");
    expect(nearlyEqual(result.annualGenerationMwh, 21.0 * 8766.0 * 0.8),
           "Portfolio generation should sum the selected plants' annual generation.");
    expect(nearlyEqual(result.capitalCostCrore, 100.0),
           "Selected project costs should stay within the capital budget.");
    expect(nearlyEqual(result.dailyWasteTonnes, 300.0),
           "Selected plant feedstock should stay within available daily waste.");

    const auto empty = wasteenergy::optimizePortfolio(
        wasteenergy::OptimizationInputs{0.0, 0.0}, nullptr, 0);
    expect(empty.selectedCount == 0 && nearlyEqual(empty.annualGenerationMwh, 0.0),
           "An empty project set should return a valid zero-generation plan.");
}

void testOptimizerValidation() {
    const wasteenergy::WastePlantOption plant{1.0, 80.0, 10.0, 1.0};
    expectInvalid(
        [&] {
            wasteenergy::optimizePortfolio(
                wasteenergy::OptimizationInputs{-1.0, 10.0}, &plant, 1);
        },
        "Negative investment budgets should be rejected.");
    expectInvalid(
        [&] {
            wasteenergy::optimizePortfolio(
                wasteenergy::OptimizationInputs{10.0, 10.0}, &plant, 17);
        },
        "More plant options than the optimizer supports should be rejected.");
}

}  // namespace

int main() {
    try {
        testProjectEstimate();
        testLaterDepreciationYears();
        testInputValidation();
        testPortfolioOptimization();
        testOptimizerValidation();
    } catch (const std::exception& error) {
        std::cerr << "Backend test failed: " << error.what() << '\n';
        return 1;
    }

    std::cout << "All backend tests passed.\n";
    return 0;
}
