import { useState } from "react";
import {
  MetricsRow,
  PageFooter,
  PageIntro,
  Sidebar,
  Topbar,
} from "./components/AppChrome.jsx";
import DispatchPanel from "./components/DispatchPanel.jsx";
import EstimateView from "./components/EstimateView.jsx";
import PortfolioPlanner from "./components/PortfolioPlanner.jsx";
import {
  CercReferenceDialog,
  ReferenceResources,
} from "./components/ReferenceResources.jsx";
import useWasteEnergyPlanner from "./hooks/useWasteEnergyPlanner.js";

function App() {
  const [activeView, setActiveView] = useState("optimizer");
  const [showCercReference, setShowCercReference] = useState(false);
  const planner = useWasteEnergyPlanner();
  const {
    plants,
    capitalBudgetCrore,
    availableWasteTonnesPerDay,
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
  } = planner;

  return (
    <div className="app-shell">
      <Sidebar
        activeView={activeView}
        onViewChange={setActiveView}
        onOpenReference={() => setShowCercReference(true)}
      />
      <main className="main-content" id="overview">
        <Topbar activeView={activeView} />

        <section className="page-wrap">
          <PageIntro activeView={activeView} />
          <MetricsRow plantCount={plants.length} />

          {activeView === "optimizer" ? (
            <div className="optimizer-view">
              <PortfolioPlanner
                plants={plants}
                selectedPlantIds={selectedPlantIds}
                capitalBudgetCrore={capitalBudgetCrore}
                availableWasteTonnesPerDay={availableWasteTonnesPerDay}
                updateCapitalBudget={updateCapitalBudget}
                updateWasteSupply={updateWasteSupply}
                updatePlant={updatePlant}
                addPlant={addPlant}
                removePlant={removePlant}
                runOptimization={runOptimization}
                optimizerLoading={optimizerLoading}
                optimizerError={optimizerError}
                optimization={optimization}
                onOpenReference={() => setShowCercReference(true)}
              />
              <DispatchPanel
                loads={loads}
                updateLoad={updateLoad}
                dispatch={dispatch}
                dispatchLoading={dispatchLoading}
                dispatchError={dispatchError}
                streetLampWattage={streetLampWattage}
                setStreetLampWattage={setStreetLampWattage}
                streetLampHoursPerNight={streetLampHoursPerNight}
                setStreetLampHoursPerNight={setStreetLampHoursPerNight}
                runDispatch={runDispatch}
                generationMwh={optimization?.annualGenerationMwh}
              />
            </div>
          ) : (
            <EstimateView
              estimateInputs={estimateInputs}
              updateEstimateInput={updateEstimateInput}
              runEstimate={runEstimate}
              estimateLoading={estimateLoading}
              estimateError={estimateError}
              estimate={estimate}
            />
          )}

          <ReferenceResources />

          <PageFooter />
        </section>
      </main>
      {showCercReference && (
        <CercReferenceDialog onClose={() => setShowCercReference(false)} />
      )}
    </div>
  );
}

export default App;
