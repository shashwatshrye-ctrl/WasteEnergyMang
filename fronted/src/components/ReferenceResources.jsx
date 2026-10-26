export function ReferenceResources() {
  return (
    <>
      <section className="reference-strip">
        <div className="reference-intro">
          <span className="section-kicker">SOURCE NOTES</span>
          <strong>
            Grounded in the
            <br />
            CERC 2024 SOR.
          </strong>
          <p>
            Reference facts are shown separately from user-provided scenario
            values.
          </p>
        </div>
        <div className="reference-fact">
          <span>20 years</span>
          <strong>MSW / RDF useful life</strong>
          <small>SOR pp. 7, 9</small>
        </div>
        <div className="reference-fact">
          <span>4.67% · 15 yr</span>
          <strong>First-period depreciation</strong>
          <small>10% salvage value · SOR p. 26</small>
        </div>
        <div className="reference-fact">
          <span>MCLR + 200 bps</span>
          <strong>Normative loan interest</strong>
          <small>15-year loan tenure · SOR p. 24</small>
        </div>
        <div className="reference-fact">
          <span>14% RoE</span>
          <strong>Return on equity</strong>
          <small>Grossed up with MAT · SOR pp. 26–28</small>
        </div>
      </section>

      <ResearchSection />
    </>
  );
}

function ResearchSection() {
  return (
    <section className="research-section" aria-labelledby="research-heading">
      <div className="research-heading">
        <div>
          <span className="section-kicker">IEEE Xplore · FURTHER READING</span>
          <h2 id="research-heading">IEEE research papers</h2>
        </div>
        <p>
          IEEE journal and conference papers on MSW power generation, energy
          recovery and gasification.
        </p>
      </div>

      <div className="research-grid">
        <article className="research-card">
          <span className="research-topic">INDIA · POWER GENERATION</span>
          <h3>Municipal solid waste fueled power generation for India</h3>
          <p className="research-meta">
            C. Palanichamy, N. S. Babu &amp; C. Nadarajan ·{" "}
            <i>IEEE Transactions on Energy Conversion</i> · 2002
          </p>
          <p className="research-summary">
            Examines MSW-fueled electricity generation in India, including a
            feasibility study for a proposed Tamil Nadu project.
          </p>
          <a
            href="https://ieeexplore.ieee.org/document/805183"
            target="_blank"
            rel="noreferrer"
          >
            View on IEEE Xplore <span aria-hidden="true">↗</span>
          </a>
        </article>

        <article className="research-card">
          <span className="research-topic">INDIA · MSW ENERGY RECOVERY</span>
          <h3>Municipal solid waste as a source of energy</h3>
          <p className="research-meta">
            R. K. Joshi &amp; S. Ahmed ·{" "}
            <i>2015 Annual IEEE India Conference (INDICON)</i> · 2015
          </p>
          <p className="research-summary">
            A mini-review discussing technological aspects of energy production
            from MSW and the potential role of waste treatment in reducing
            environmental impacts.
          </p>
          <a
            href="https://ieeexplore.ieee.org/document/7443789"
            target="_blank"
            rel="noreferrer"
          >
            View on IEEE Xplore <span aria-hidden="true">↗</span>
          </a>
        </article>

        <article className="research-card">
          <span className="research-topic">INDIA · GASIFICATION REVIEW</span>
          <h3>
            Waste-to-Energy: Reviewing Gasification of Municipal Solid Waste
          </h3>
          <p className="research-meta">
            M. K. Aravindan, G. K. Kantak &amp; B. Wadhwa ·{" "}
            <i>
              2023 International Conference on Power Energy, Environment &amp;
              Intelligent Control
            </i>{" "}
            · 2023
          </p>
          <p className="research-summary">
            Reviews MSW gasification technologies and studies, including fuel
            conversion, technical approaches and economic assessments for
            waste-to-energy.
          </p>
          <a
            href="https://ieeexplore.ieee.org/document/10451061"
            target="_blank"
            rel="noreferrer"
          >
            View on IEEE Xplore <span aria-hidden="true">↗</span>
          </a>
        </article>
      </div>

      <p className="research-disclaimer">
        Paper descriptions are brief summaries. IEEE Xplore provides the
        publisher record and access options; access to full text may require an
        IEEE subscription.
      </p>
    </section>
  );
}

export function CercReferenceDialog({ onClose }) {
  return (
    <div className="reference-dialog-backdrop" onClick={onClose}>
      <section
        className="reference-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cerc-reference-title"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => {
          if (event.key === "Escape") onClose();
        }}
      >
        <button
          className="reference-dialog-close"
          type="button"
          onClick={onClose}
          aria-label="Close CERC reference details"
          autoFocus
        >
          ×
        </button>
        <span className="section-kicker">SOURCE NOTES · 2024</span>
        <h2 id="cerc-reference-title">CERC MSW / RDF assumptions</h2>
        <p className="reference-dialog-intro">
          Planning assumptions drawn from the CERC 2024 Statement of Reasons
          (SOR). Page numbers below refer to that document.
        </p>
        <ul className="reference-dialog-facts">
          <li>
            <strong>Useful life</strong>
            <span>20 years · SOR pp. 7, 9</span>
          </li>
          <li>
            <strong>Depreciation</strong>
            <span>
              4.67% for the first 15 years; 10% salvage value · SOR p. 26
            </span>
          </li>
          <li>
            <strong>Loan interest</strong>
            <span>
              Average SBI MCLR + 200 basis points; 15-year loan tenure · SOR p.
              24
            </span>
          </li>
          <li>
            <strong>Return on equity</strong>
            <span>14%, grossed up with MAT · SOR pp. 26–28</span>
          </li>
        </ul>
        <p className="reference-dialog-note">
          These references inform an indicative planning estimate; this tool is
          not a CERC tariff determination. Check the applicable CERC order for
          regulatory use.
        </p>
      </section>
    </div>
  );
}
