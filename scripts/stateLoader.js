console.log("STATE LOADER LOADED");
() => {
  "use strict";

  const STATE_PATH = "./data/states";
  const stateCache = new Map();

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
function evaluateConditions(conditions) {
  if (!conditions.length) {
    return true;
  }

  return conditions.every((condition) => {
    const field = condition.field;

    const value = condition.value;

    const operator = condition.operator;

    let current;

    switch (field) {
      case "replacement":
        current = document.getElementById("replacement")?.checked
          ? "yes"
          : "no";
        break;

      case "additionalInsured":
        current = document.getElementById("additionalInsured")?.checked
          ? "yes"
          : "no";
        break;

      case "beneficiaryOther":
        current = document.getElementById("beneficiaryOther")?.value;
        break;

      case "ownerType":
        current = document.getElementById("ownerType")?.value;
        break;

      default:
        return false;
    }

    if (operator === "equals") {
      return current === value;
    }

    if (operator === "notEquals") {
      return current !== value;
    }

    if (operator === "includes") {
      return value.includes(current);
    }

    return false;
  });
}
function renderStateGuidance(stateData) {
  const requiredForms = document.getElementById("requiredForms");

  const specialNotes = document.getElementById("specialNotes");

  const summary = document.getElementById("stateRequirementSummary");

  if (!requiredForms) return;

  summary.textContent = `${stateData.displayName} Requirements`;

  const applicableForms = stateData.forms.filter((form) => {
    if (form.required === true) {
      return true;
    }

    return evaluateConditions(form.conditions || []);
  });

  requiredForms.innerHTML = applicableForms
    .map((form) => {
      const displayLabel = form.description;

      const displayValue = form.form;

      return `
                <div class="form-review-card">

                    <div class="form-review-main">

                        <div class="form-review-details">

                            <div class="form-review-title">
                                ${displayLabel}
                            </div>

                            <div class="form-review-id">
                                ${displayValue}
                            </div>

                        </div>

                        <div class="form-review-actions">

                            <button
    type="button"
    class="igo-btn"
    data-form="${form.form}">
    IGO
</button>

<button
    type="button"
    class="nigo-btn"
    data-form="${form.form}">
    NIGO
</button>

                        </div>

                    </div>

                </div>
            `;
    })
    .join("");

  document.getElementById("requiredFormCountCard").textContent =
    applicableForms.length;

  document.getElementById("applicableFormCount").textContent =
    `${applicableForms.length} forms`;

  specialNotes.innerHTML = (stateData.specialNotes || [])
    .map(note =>
      `<div class="special-note">${note}</div>`
    )
    .join("");

  const contractState = document.getElementById("contractState");

  if (contractState.value) {
    contractState.dispatchEvent(new Event("change"));
  }

  const FORM_CONDITIONS = {
    replacementForm: () => document.getElementById("replacement")?.checked,

    ownerDesignation: () =>
      document.getElementById("ownerType")?.value !== "insured",

    beneficiaryDesignation: () =>
      document.getElementById("beneficiaryOther")?.value === "yes",

    ltcPackage: () =>
      document.getElementById("policyNumber")?.value.toUpperCase().includes("CC"),

    part1: () => true,

    part2: () => true,

    hipaaAuthorization: () => true,

    additionalInsured: () =>
      document.getElementById("additionalInsured")?.checked,
  };

  ["replacement", "ownerType", "beneficiaryOther"].forEach((id) => {
    document.getElementById(id)?.addEventListener("change", () => {
      if (window.currentStateData) {
        renderStateGuidance(window.currentStateData);
      }
    });
  });

  document.addEventListener("click", (event) => {
    if (!event.target.classList.contains("nigo-btn")) {
      return;
    }

    const form = event.target.dataset.form;

    const target = document.getElementById("globalAmendmentForm");

    if (target) {
      target.value = form;

      target.dispatchEvent(new Event("change"));
    }
  });
}