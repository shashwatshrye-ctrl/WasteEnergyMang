# WattCycle

WattCycle is a React planning interface for waste-to-energy projects. Its
estimate and portfolio APIs call the C++ backend in
`../WasteEnergy`; the browser does not reimplement the calculations.

## Run locally

Requirements: Node.js 20 or newer and a C++17 compiler named `g++` on `PATH`.

```powershell
cd D:\study\dsa\project\backend\fronted
npm install
npm run dev
```

Open <http://127.0.0.1:5173>. The dev server compiles the C++ API into a
temporary executable when it starts. The executable is removed when the server
shuts down.

To build and run the production app:

```powershell
npm run build
$env:NODE_ENV = "production"
npm start
```

## Optimization model

`POST /api/optimize` selects whole projects to maximize estimated annual MWh
subject to both the available daily waste and the capital investment ceiling.
The C++ backend uses 0/1 knapsack dynamic programming over two resource
dimensions. To keep the state space bounded, the optimizer rounds investment
capacity down to ₹0.5 crore units and waste supply down to 10-tonne/day units;
each candidate's costs are rounded up to those same units. The result is
therefore conservative and may omit a project combination that would fit when
using unrounded input values. At most 16 candidate plants are accepted.

Candidate projects shown in the interface are illustrative user-editable
scenario values. They are not CERC-approved project norms.

## API

- `GET /api/health` — backend status.
- `POST /api/estimate` — calculate one project estimate.
- `POST /api/optimize` — select a portfolio from plant options.

The estimate applies the MSW/RDF useful life, depreciation, and financing
assumptions from CERC's 2024 Statement of Reasons. It is an indicative
planning tool, not a tariff determination.
