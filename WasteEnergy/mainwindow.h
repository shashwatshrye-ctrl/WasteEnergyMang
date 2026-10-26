#pragma once

#include <QMainWindow>
#include <QString>

class QDoubleSpinBox;
class QLabel;
class QSpinBox;

class MainWindow : public QMainWindow {
public:
    explicit MainWindow(QWidget* parent = nullptr);

private:
    void calculateEstimate();
    void setResultText(const QString& text);

    QDoubleSpinBox* plantCapacityInput_;
    QDoubleSpinBox* capacityUtilizationInput_;
    QDoubleSpinBox* dailyWasteInput_;
    QSpinBox* operatingDaysInput_;
    QDoubleSpinBox* capitalCostInput_;
    QDoubleSpinBox* grantInput_;
    QSpinBox* projectYearInput_;
    QDoubleSpinBox* averageMclrInput_;
    QDoubleSpinBox* matRateInput_;
    QLabel* resultLabel_;
    QLabel* statusLabel_;
};