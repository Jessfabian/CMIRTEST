console.log("STATE LOADER LOADED");
() => {
  "use strict";

  const STATE_PATH = "./data/states";
  const stateCache = new Map();

  const FORM_LABELS = {
    additionalInsured: "Additional Insured Supplement",
    part1: "Application for Life Insurance Part 1",
    part2: "Application Part 2",
    juvenilePart2: "Juvenile Application Part 2",
    simplifiedConversion: "Application for Simplified Conversion",
    beneficiaryDesignation: "Beneficiary Designation",
    careChoicePart1: "CareChoice Application Part 1",
    conversionSupplement: "Conversion and Insurability Option Supplement",
    disclosureAuthorization: "Disclosure Authorization",
    foreignSupplement: "Foreign Supplement",
    hipaaAuthorization: "HIPAA Authorization",
    hivForm: "HIV Form",
    ltcWorksheet: "Long Term Care Personal Worksheet",
    ltcPackage: "LTC Access Rider Application Package",
    part1Authorization: "Part 1 Authorization",
    ownerDesignation: "Owner Designation",
    policyChange: "Policy Change Application",
    replacementForm: "Replacement Form",
    abrDisclosure: "ABR Disclosure",
    employerOwned: "Employer-Owned Life Insurance Form",
    salesIllustrationCertification: "Sales Illustration Certification",
    limitedGuarantee: "Limited Guarantee Against Termination",
    minimumDeathBenefitDisclosure: "Minimum Death Benefit Disclosure",
    variableLifeSupplement: "Variable Life Supplement",
    trustCertificate: "Trust Certificate",
    termReplacement: "Term-to-Term Replacement Form",
  };

  function escapeHTML(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function normalizeFormValues(value) {
    if (value === null || value === undefined || value === "") {
      return [];
    }

    return Array.isArray(value) ? value : [value];
  }

  async function loadStateData(stateCode) {
    const code = String(stateCode || "")
      .trim()
      .toUpperCase();

    if (!code) {
      return null;
    }

    if (stateCache.has(code)) {
      return stateCache.get(code);
    }

    const url = `${STATE_PATH}/${encodeURIComponent(code)}.json`;
    const response = await fetch(url, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(
        `Unable to load ${code}.json. HTTP status: ${response.status}`,
      );
    }

    const stateData = await response.json();

    if (!stateData || stateData.state !== code) {
      throw new Error(
        `${code}.json loaded, but its state property does not match ${code}.`,
      );
    }

    stateCache.set(code, stateData);
    return stateData;
  }

  function renderNotices(stateData) {
    const container = document.getElementById("stateImportantNotices");

    if (!container) {
      return;
    }

    const notices = Array.isArray(stateData.important)
      ? stateData.important
      : [];

    if (!notices.length) {
      container.innerHTML = "";
      container.hidden = true;
      return;
    }

    container.hidden = false;
    container.innerHTML = `
      <div class="state-notice state-notice-important">
        <h3>Important</h3>

        <ul>
          ${notices.map((notice) => `<li>${escapeHTML(notice)}</li>`).join("")}
        </ul>
      </div>
    `;
  }

  function renderNotes(stateData) {
    const container = document.getElementById("stateNotes");

    if (!container) {
      return;
    }

    const notes = Array.isArray(stateData.notes) ? stateData.notes : [];

    if (!notes.length) {
      container.innerHTML = "";
      container.hidden = true;
      return;
    }

    container.hidden = false;
  }
  window.loadStateData = loadStateData;
  window.initializeStateLoader = initializeStateLoader;
};
document
  .getElementById("contractState")
  .addEventListener("change", async (e) => {
    const stateCode = e.target.value;

    if (!stateCode) return;

    const stateData = await fetch(`./data/states/${stateCode}.json`).then((r) =>
      r.json(),
    );

    window.currentStateData = stateData;

    renderStateGuidance(stateData);
  });

function renderStateGuidance(stateData) {
  document.getElementById("stateDisplayName").textContent =
    `${stateData.displayName} Requirements`;

  const formsHTML = Object.entries(stateData.forms)
    .map(([key, value]) => {
      const displayValue = Array.isArray(value) ? value.join(", ") : value;

      return `
          <div class="state-form-card">
            <strong>${key}</strong><br>
            ${displayValue}
          </div>
        `;
    })
    .join("");

  document.getElementById("stateFormsList").innerHTML = formsHTML;

  document.getElementById("stateRequirementsSection").hidden = false;
}

const contractState = document.getElementById("contractState");

if (contractState.value) {
  contractState.dispatchEvent(new Event("change"));
}