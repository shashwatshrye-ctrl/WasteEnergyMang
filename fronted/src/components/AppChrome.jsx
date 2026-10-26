import Icon from "./Icon.jsx";

export function Sidebar({ activeView, onViewChange, onOpenReference }) {
  return (
    <aside className="sidebar">
      <a
        className="brand"
        href="#overview"
        onClick={() => onViewChange("optimizer")}
      >
        <span className="brand-mark">
          <Icon name="leaf" size={21} />
        </span>
        <span>
          watt<span className="brand-light">cycle</span>
        </span>
      </a>

      <div className="workspace-label">WORKSPACE</div>
      <nav className="side-nav" aria-label="Main navigation">
        <button
          className={
            activeView === "optimizer" ? "nav-item active" : "nav-item"
          }
          aria-label="Portfolio planner"
          onClick={() => onViewChange("optimizer")}
        >
          <Icon name="grid" />
          <span>Portfolio planner</span>
        </button>
        <button
          className={activeView === "estimate" ? "nav-item active" : "nav-item"}
          aria-label="Project estimator"
          onClick={() => onViewChange("estimate")}
        >
          <Icon name="chart" />
          <span>Project estimator</span>
        </button>
        <button
          className="nav-item nav-link"
          type="button"
          onClick={onOpenReference}
        >
          <Icon name="leaf" />
          <span>CERC reference</span>
          <Icon name="arrow" size={15} />
        </button>
      </nav>

      <div className="sidebar-bottom">
        <div className="source-card">
          <span className="source-icon">
            <Icon name="bolt" size={16} />
          </span>
          <strong>Waste to watts</strong>
          <p>Plan cleaner power with a feedstock-aware project mix.</p>
        </div>
        <div className="engine-status">
          <span className="status-dot" /> C++ optimization engine
        </div>
        <span className="sidebar-version">CERC RE TARIFFS · 2024</span>
      </div>
    </aside>
  );
}

export function Topbar({ activeView }) {
  return (
    <header className="topbar">
      <div className="breadcrumb">
        <span>Workspace</span>
        <Icon name="chevron" size={14} />
        <strong>
          {activeView === "optimizer"
            ? "Portfolio planner"
            : "Project estimator"}
        </strong>
      </div>
      <div className="topbar-right">
        <span className="live-indicator" /> Planning mode{" "}
        <span className="topbar-divider" /> India
      </div>
    </header>
  );
}

export function PageIntro({ activeView }) {
  const isOptimizer = activeView === "optimizer";

  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">
          <span className="eyebrow-line" /> WASTE-TO-ENERGY · POWER SYSTEM
          PLANNING
        </div>
        <h1>
          {isOptimizer ? (
            <>
              Turn waste streams
              <br />
              <span>into better power plans.</span>
            </>
          ) : (
            <>
              Know your project
              <br />
              <span>before you power it.</span>
            </>
          )}
        </h1>
        <p className="heading-copy">
          {isOptimizer
            ? "Find the project combination that generates the most renewable electricity within your investment and feedstock limits."
            : "Explore annual generation, eligible investment and CERC-based financial assumptions for an MSW or RDF project."}
        </p>
      </div>
      <div className="heading-stamp">
        <span className="stamp-spark">✳</span>
        <span>
          WASTE IN.
          <br />
          <strong>POWER OUT.</strong>
        </span>
      </div>
    </div>
  );
}

export function MetricsRow({ plantCount }) {
  return (
    <div className="metrics-row">
      <div className="metric-card">
        <span className="metric-icon green">
          <Icon name="leaf" size={17} />
        </span>
        <span className="metric-label">RECOGNIZED USEFUL LIFE</span>
        <strong>
          20 <small>years</small>
        </strong>
        <span className="metric-foot">CERC norm for MSW / RDF</span>
      </div>
      <div className="metric-card">
        <span className="metric-icon amber">
          <Icon name="bolt" size={17} />
        </span>
        <span className="metric-label">GENERATION BASIS</span>
        <strong>
          8,766 <small>hours / yr</small>
        </strong>
        <span className="metric-foot">CERC capacity factor calculation</span>
      </div>
      <div className="metric-card">
        <span className="metric-icon blue">
          <Icon name="grid" size={17} />
        </span>
        <span className="metric-label">PORTFOLIO OPTIONS</span>
        <strong>
          {plantCount.toString().padStart(2, "0")} <small>projects</small>
        </strong>
        <span className="metric-foot">Edit the scenario to explore a mix</span>
      </div>
    </div>
  );
}

export function PageFooter() {
  return (
    <footer className="page-footer">
      <span>
        WATTCYCLE <i>·</i> WASTE-TO-ENERGY PLANNING
      </span>
      <span>Illustrative planning tool · Not a regulatory tariff order</span>
    </footer>
  );
}
