#include "mainwindow.h"

#include "backend.h"

#include <QDoubleSpinBox>
#include <QFormLayout>
#include <QGroupBox>
#include <QLabel>
#include <QPushButton>
#include <QScrollArea>
#include <QSpinBox>
#include <QVBoxLayout>
#include <QWidget>

#include <stdexcept>

namespace {

QDoubleSpinBox* createInput(double maximum, int decimals, const QString& suffix = {}) {
    auto* input = new QDoubleSpinBox;
    input->setRange(0.0, maximum);
    input->setDecimals(decimals);
    input->setSingleStep(decimals == 0 ? 1.0 : 0.1);
    input->setSuffix(suffix);
    input->setKeyboardTracking(false);
    return input;
}

}  // namespace

MainWindow::MainWindow(QWidget* parent)
    : QMainWindow(parent),
      plantCapacityInput_(createInput(100000.0, 2, QStringLiteral(" MW"))),
      capacityUtilizationInput_(createInput(100.0, 2, QStringLiteral(" %"))),
      dailyWasteInput_(createInput(100000000.0, 2, QStringLiteral(" tonnes/day"))),
      operatingDaysInput_(new QSpinBox),
      capitalCostInput_(createInput(100000000.0, 2, QStringLiteral(" crore"))),
      grantInput_(createInput(100000000.0, 2, QStringLiteral(" crore"))),
      projectYearInput_(new QSpinBox),
      averageMclrInput_(createInput(100.0, 2, QStringLiteral(" %"))),
      matRateInput_(createInput(99.99, 2, QStringLiteral(" %"))),
      resultLabel_(new QLabel),
      statusLabel_(new QLabel) {
    setWindowTitle(QStringLiteral("Waste-to-Energy Project Planner"));
    resize(760, 760);

    auto* centralWidget = new QWidget;
    auto* mainLayout = new QVBoxLayout(centralWidget);

    auto* introduction = new QLabel(
        QStringLiteral(
            "Estimate annual waste throughput, generation, and selected CERC "
            "regulatory parameters for an MSW/RDF project."));
    introduction->setWordWrap(true);
    mainLayout->addWidget(introduction);

    auto* inputGroup = new QGroupBox(QStringLiteral("Project inputs"), centralWidget);
    auto* inputLayout = new QFormLayout(inputGroup);
    operatingDaysInput_->setRange(1, 366);
    operatingDaysInput_->setValue(365);
    projectYearInput_->setRange(1, wasteenergy::RegulatoryNorms::mswUsefulLifeYears);
    inputLayout->addRow(QStringLiteral("Plant capacity"), plantCapacityInput_);
    inputLayout->addRow(QStringLiteral("Capacity utilization factor"), capacityUtilizationInput_);
    inputLayout->addRow(QStringLiteral("Waste received per operating day"), dailyWasteInput_);
    inputLayout->addRow(QStringLiteral("Operating days per year"), operatingDaysInput_);
    inputLayout->addRow(QStringLiteral("Capital cost (₹ crore)"), capitalCostInput_);
    inputLayout->addRow(QStringLiteral("Grant / capital subsidy (₹ crore)"), grantInput_);
    inputLayout->addRow(QStringLiteral("Project year"), projectYearInput_);
    inputLayout->addRow(QStringLiteral("6-month average SBI one-year MCLR"), averageMclrInput_);
    inputLayout->addRow(QStringLiteral("Notified MAT rate"), matRateInput_);
    mainLayout->addWidget(inputGroup);

    auto* calculateButton = new QPushButton(QStringLiteral("Calculate estimate"), centralWidget);
    connect(calculateButton, &QPushButton::clicked, this, &MainWindow::calculateEstimate);
    mainLayout->addWidget(calculateButton);

    statusLabel_->setWordWrap(true);
    statusLabel_->setText(
        QStringLiteral("Enter the project values above. Regulatory assumptions below are "
                       "from the CERC 2024 Statement of Reasons."));
    mainLayout->addWidget(statusLabel_);

    auto* resultGroup = new QGroupBox(QStringLiteral("Estimate"), centralWidget);
    auto* resultLayout = new QVBoxLayout(resultGroup);
    resultLabel_->setWordWrap(true);
    resultLabel_->setText(QStringLiteral("Results will appear here."));
    resultLayout->addWidget(resultLabel_);
    mainLayout->addWidget(resultGroup);

    auto* normsGroup = new QGroupBox(QStringLiteral("CERC MSW / RDF reference data"), centralWidget);
    auto* normsLayout = new QVBoxLayout(normsGroup);
    auto* normsLabel = new QLabel(
        QStringLiteral(
            "• Useful life: 20 years; the Commission retained this period for MSW plants "
            "(PDF pp. 7, 9).\n"
            "• Tariff: project-specific, determined case by case; the source does not give "
            "a universal MSW/RDF tariff or capital-cost figure (PDF pp. 16–17, 23).\n"
            "• Depreciation: 4.67% per year for 15 years, then the remaining depreciable "
            "amount over the rest of the useful life; 10% salvage value (PDF p. 26).\n"
            "• Term-loan tenure: 15 years; interest norm is the average SBI one-year MCLR "
            "over the last available six months plus 200 basis points (PDF p. 24).\n"
            "• Return on equity: 14%, grossed up by the notified MAT rate during the "
            "project's 20-year tariff period (PDF pp. 26–28).\n"
            "• Working-capital interest norm: average SBI one-year MCLR plus 325 basis "
            "points (PDF p. 29)."));
    normsLabel->setWordWrap(true);
    normsLayout->addWidget(normsLabel);
    mainLayout->addWidget(normsGroup);

    auto* disclaimer = new QLabel(
        QStringLiteral(
            "This is an indicative planning estimate, not a tariff determination. "
            "Generation uses 8766 hours per year as specified in the CERC source and the "
            "entered capacity utilization factor. The calculation "
            "does not calculate a complete tariff or include fuel costs, actual tax "
            "liabilities, or working-capital amounts. Source: CERC, Statement of Reasons "
            "to Renewable Energy Tariff Regulations, 2024 (SOR-189.pdf, dated "
            "17 September 2024)."));
    disclaimer->setWordWrap(true);
    mainLayout->addWidget(disclaimer);

    auto* scrollArea = new QScrollArea(this);
    scrollArea->setWidgetResizable(true);
    scrollArea->setWidget(centralWidget);
    setCentralWidget(scrollArea);
}

void MainWindow::calculateEstimate() {
    const wasteenergy::ProjectInputs inputs{
        plantCapacityInput_->value(),
        capacityUtilizationInput_->value(),
        dailyWasteInput_->value(),
        operatingDaysInput_->value(),
        capitalCostInput_->value(),
        grantInput_->value(),
        projectYearInput_->value(),
        averageMclrInput_->value(),
        matRateInput_->value()};

    try {
        const auto estimate = wasteenergy::estimateProject(inputs);
        const QString result = QStringLiteral(
                                   "Annual waste processed: %1 tonnes\n"
                                   "Estimated annual generation: %2 MWh\n"
                                   "Eligible capital cost after grants: ₹%3 crore\n"
                                   "Depreciation in project year %4: ₹%5 crore (%6% of "
                                   "eligible capital cost)\n"
                                   "Normative term-loan interest rate: %7%\n"
                                   "Normative working-capital interest rate: %8%\n"
                                   "Grossed-up return on equity: %9%")
                                   .arg(estimate.annualWasteTonnes, 0, 'f', 2)
                                   .arg(estimate.annualGenerationMwh, 0, 'f', 2)
                                   .arg(estimate.eligibleCapitalCostCrore, 0, 'f', 2)
                                   .arg(inputs.projectYear)
                                   .arg(estimate.annualDepreciationCrore, 0, 'f', 4)
                                   .arg(estimate.depreciationRatePercent, 0, 'f', 2)
                                   .arg(estimate.loanInterestRatePercent, 0, 'f', 2)
                                   .arg(estimate.workingCapitalInterestRatePercent, 0, 'f', 2)
                                   .arg(estimate.grossedUpReturnOnEquityPercent, 0, 'f', 2);
        setResultText(result);
        statusLabel_->setText(QStringLiteral("Estimate calculated from the entered project inputs."));
    } catch (const std::invalid_argument& error) {
        setResultText(QStringLiteral("Correct the project inputs to calculate an estimate."));
        statusLabel_->setText(QString::fromUtf8(error.what()));
    }
}

void MainWindow::setResultText(const QString& text) {
    resultLabel_->setText(text);
}