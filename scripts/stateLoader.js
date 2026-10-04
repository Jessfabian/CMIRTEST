window.formReviewStatus = {};

document
  .getElementById("contractState")
  .addEventListener("change", async (e) => {
    const stateCode = e.target.value;

    if (!stateCode) return;

    try {
      console.log("Loading state:", `./data/States/${stateCode}.json`);
      const response = await fetch(`./data/States/${stateCode}.json`, {
        cache: "no-store",
      });

      console.log("Status:", response.status);

      if (!response.ok) {
        throw new Error(`${stateCode}.json not found`);
      }

      const stateData = await response.json();

      window.currentStateData = stateData;
      console.log(
        "Forms loaded:",
        document.getElementById("globalAmendmentForm")?.options.length,
      );
      renderStateGuidance(stateData);
    } catch (error) {
      console.error("State load failed:", error);
    }
  });

function normalizeFormValues(value) {
  if (value === null || value === undefined || value === "") {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

function renderNotices(stateData) {
  const container = document.getElementById("stateImportantNotices");

  if (!container) {
    return;
  }

  const notices = Array.isArray(stateData.important) ? stateData.important : [];

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

  const requiredForms =
    document.getElementById("requiredForms");

  const specialNotes =
    document.getElementById("specialNotes");

  const summary =
    document.getElementById("stateRequirementSummary");

  const applicableForms =
    stateData.forms.filter((form) => {

      if (form.required === true) {
        return true;
      }

      return evaluateConditions(
        form.conditions || []
      );

    });

  const globalFormDropdown =
    document.getElementById("globalAmendmentForm");

  if (globalFormDropdown) {

    globalFormDropdown.innerHTML =
      '<option value="">Select Form</option>';

    applicableForms.forEach((form) => {

      const option =
        document.createElement("option");

      option.value = form.form;

      option.textContent =
        `${form.form} - ${form.description}`;

      globalFormDropdown.appendChild(option);

    });

    console.log(
      "Dropdown options:",
      globalFormDropdown.options.length
    );
  }

  if (!requiredForms) {
    return;
  }

  summary.textContent =
    `${stateData.displayName} Requirements`;

  // leave the rest of your code exactly as it is
  ["replacement", "ownerType", "beneficiaryOther"].forEach((id) => {
    document.getElementById(id)?.addEventListener("change", () => {
      if (window.currentStateData) {
        renderStateGuidance(window.currentStateData);
      }
    });
  });

  document.addEventListener("click", (event) => {
    if (
      !event.target.classList.contains("igo-button") &&
      !event.target.classList.contains("nigo-button")
    ) {
      return;
    }

    const formId = event.target.dataset.form;

    const row = event.target.closest(".required-form-row");

    const igoButton = row.querySelector(".igo-button");

    const nigoButton = row.querySelector(".nigo-button");

    if (event.target.classList.contains("igo-button")) {
      igoButton.classList.add("selected");
      nigoButton.classList.remove("selected");

      window.formReviewStatus[formId] = "IGO";
    }

    if (event.target.classList.contains("nigo-button")) {
      nigoButton.classList.add("selected");
      igoButton.classList.remove("selected");

      window.formReviewStatus[formId] = "NIGO";

      document
        .getElementById("amendmentsSection")
        ?.style.setProperty("display", "block");

      document
        .getElementById("requirementsSection")
        ?.style.setProperty("display", "block");
    }

    console.log(window.formReviewStatus);

    updateStateDashboard();
  });

  function updateStateDashboard() {
    const total = document.querySelectorAll(".required-form-row").length;

    const reviewed = Object.keys(window.formReviewStatus).length;

    const issues = Object.values(window.formReviewStatus).filter(
      (status) => status === "NIGO",
    ).length;

    const remaining = total - reviewed;

    document.getElementById("reviewedCountCard").textContent = reviewed;

    document.getElementById("remainingCountCard").textContent = remaining;

    document.getElementById("dashboardIssueCount").textContent = issues;

    document.getElementById("dashboardState").textContent =
      document.getElementById("contractState")?.value || "--";
  } //test

  document.addEventListener("DOMContentLoaded", () => {
    const stateDropdown = document.getElementById("contractState");

    if (!stateDropdown) return;

    if (stateDropdown.value) {
      stateDropdown.dispatchEvent(new Event("change"));
    }
  });
}