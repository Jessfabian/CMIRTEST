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
      console.log("STATE DATA", stateData);
      console.log("FORMS ARRAY", stateData.forms);
      console.log("FORMS LENGTH", stateData.forms?.length);
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
  const requiredForms = document.getElementById("requiredForms");

  const specialNotes = document.getElementById("specialNotes");

  const summary = document.getElementById("stateRequirementSummary");

  const applicableForms = stateData.forms.filter((form) => {
    if (form.required === true) {
      return true;
    }

    return evaluateConditions(form.conditions || []);
  });

  const globalFormDropdown = document.getElementById("globalAmendmentForm");

  if (globalFormDropdown) {
    globalFormDropdown.innerHTML = '<option value="">Select Form</option>';

    applicableForms.forEach((form) => {
      const option = document.createElement("option");

      option.value = form.form;

      option.textContent = `${form.form} - ${form.description}`;

      globalFormDropdown.appendChild(option);
    });

    console.log("Dropdown options:", globalFormDropdown.options.length);
  }

  if (!requiredForms) {
    return;
  }

  summary.textContent = `${stateData.displayName} Requirements`;

  requiredForms.innerHTML = applicableForms
    .map(
      (form) => `
      <div
        class="required-form-row"
        data-form-id="${form.form}"
        data-form-description="${form.description}">

        <div class="state-form-main">

          <div class="state-form-content">

            <strong class="state-form-id">
              ${form.form}
            </strong>

            <span class="form-description">
              ${form.description}
            </span>

          </div>

          <div class="form-status-actions">

            <span
              class="form-review-result"
              data-result="${form.form}">
            </span>

            <button
              type="button"
              class="form-status-button igo-button"
              data-form="${form.form}">
              IGO
            </button>

            <button
              type="button"
              class="form-status-button nigo-button"
              data-form="${form.form}">
              NIGO
            </button>

          </div>

        </div>

        <div class="nigo-template-picker" hidden>

          <label>
            Why is this form NIGO?
          </label>

          <select class="nigo-template-select">
            <option value="">
              Select NIGO Reason
            </option>
          </select>

          <small class="nigo-template-help">
            Select the requirement that explains what is needed
            to resolve this form.
          </small>

        </div>

      </div>
    `,
    )
    .join("");
  const globalRequirementDropdown = document.getElementById(
    "globalRequirementTemplate",
  );

  const excludedTemplateIds = new Set(["category", "fields", "template"]);

  requiredForms
    .querySelectorAll(".nigo-template-select")
    .forEach((nigoDropdown) => {
      nigoDropdown.innerHTML = '<option value="">Select NIGO Reason</option>';

      if (!globalRequirementDropdown) {
        return;
      }

      const addedTemplateIds = new Set();

      Array.from(globalRequirementDropdown.options).forEach((option) => {
        const templateId = option.value;

        if (
          !templateId ||
          excludedTemplateIds.has(templateId) ||
          addedTemplateIds.has(templateId)
        ) {
          return;
        }

        const nigoOption = document.createElement("option");

        nigoOption.value = templateId;
        nigoOption.textContent = option.textContent.trim();

        nigoDropdown.appendChild(nigoOption);
        addedTemplateIds.add(templateId);
      });
    });
  const formCount = document.getElementById("applicableFormCount");

  if (formCount) {
    formCount.textContent = `${applicableForms.length} forms`;
  }
  console.log(
    "Rendered Forms:",
    requiredForms.querySelectorAll(".required-form-row").length,
  );

  ["replacement", "ownerType", "beneficiaryOther"].forEach((id) => {
    document.getElementById(id)?.addEventListener("change", () => {
      if (window.currentStateData) {
        renderStateGuidance(window.currentStateData);
      }
    });
  });

  requiredForms.onclick = (event) => {
    const igoButtonClicked = event.target.closest(".igo-button");
    const nigoButtonClicked = event.target.closest(".nigo-button");

    if (!igoButtonClicked && !nigoButtonClicked) {
      return;
    }

    const clickedButton = igoButtonClicked || nigoButtonClicked;

    const row = clickedButton.closest(".required-form-row");

    if (!row) {
      return;
    }

    const formId = row.dataset.formId || "";
    const igoButton = row.querySelector(".igo-button");
    const nigoButton = row.querySelector(".nigo-button");

    const resultText = row.querySelector(".form-review-result");

    const nigoPicker = row.querySelector(".nigo-template-picker");

    const nigoDropdown = row.querySelector(".nigo-template-select");


    if (igoButtonClicked) {
      igoButton.classList.add("selected");
      nigoButton.classList.remove("selected");

      if (nigoPicker) {
        nigoPicker.hidden = true;
      }
      if (nigoDropdown) {
        nigoDropdown.value = "";
      }

      row.dataset.formStatus = "igo";

     window.formReviewStatus[formId] = {
       status: "NIGO",
       issueLabel: selectedTemplateLabel,
       templateId: selectedTemplateId,
       formId: formId,
       formDescription: formDescription,

       requirementGenerated: false,
       requirementText: "",
     };

      if (resultText) {
        resultText.textContent = "Reviewed";

        resultText.className = "form-review-result result-igo";

        resultText.title = "";
      }
      updateStateDashboard();

      document.dispatchEvent(new CustomEvent("stateFormsUpdated"));

      return;
    }

    if (nigoButtonClicked) {
      nigoButton.classList.add("selected");
      igoButton.classList.remove("selected");

      row.dataset.formStatus = "nigo-pending";

      delete window.formReviewStatus[formId];

      if (nigoPicker) {
        nigoPicker.hidden = false;
      }

      if (resultText) {
        resultText.textContent = "Select NIGO Reason";

        resultText.className = "form-review-result result-nigo-pending";
      }

      if (nigoDropdown) {
        nigoDropdown.focus();
      }

      updateStateDashboard();

      document.dispatchEvent(new CustomEvent("stateFormsUpdated"));
    }
  };
  requiredForms.onchange = (event) => {
    if (!event.target.matches(".nigo-template-select")) {
      return;
    }

    const nigoDropdown = event.target;

    const row = nigoDropdown.closest(".required-form-row");

    if (!row) {
      return;
    }

    const formId = row.dataset.formId || "";

    const formDescription = row.dataset.formDescription || formId;

    const resultText = row.querySelector(".form-review-result");

    const selectedTemplateId = nigoDropdown.value;

    const selectedOption = nigoDropdown.options[nigoDropdown.selectedIndex];

    const selectedTemplateLabel = selectedOption?.textContent?.trim() || "";


    if (!selectedTemplateId) {
      row.dataset.formStatus = "nigo-pending";

      delete window.formReviewStatus[formId];

      if (resultText) {
        resultText.textContent = "Select NIGO Reason";

        resultText.className = "form-review-result result-nigo-pending";

        resultText.title = "";
      }

      updateStateDashboard();

      document.dispatchEvent(new CustomEvent("stateFormsUpdated"));

      return;
    }


    row.dataset.formStatus = "nigo";

    window.formReviewStatus[formId] = {
      status: "NIGO",
      issueLabel: selectedTemplateLabel,
      templateId: selectedTemplateId,
      formId: formId,
      formDescription: formDescription,
    };

    if (resultText) {
     resultText.textContent = `NIGO: ${selectedTemplateLabel}`;

      resultText.className = "form-review-result result-nigo";

      resultText.title = selectedTemplateLabel;
    }


    const globalDropdown = document.getElementById("globalRequirementTemplate");

    if (globalDropdown) {
      globalDropdown.value = selectedTemplateId;

      globalDropdown.dispatchEvent(
        new Event("change", {
          bubbles: true,
        }),
      );
    }

    window.setTimeout(() => {
      const requirementFields = document.getElementById(
        "globalRequirementFields",
      );

      if (!requirementFields) {
        return;
      }

      const formField = requirementFields.querySelector(
        '[data-requirement-field="formName"], ' +
          '[data-requirement-field="documentName"]',
      );

      if (formField) {
        formField.value = formDescription;

        formField.dispatchEvent(
          new Event("input", {
            bubbles: true,
          }),
        );
      }
    }, 0);

    updateStateDashboard();

    document.dispatchEvent(new CustomEvent("stateFormsUpdated"));

    console.log("Saved NIGO:", window.formReviewStatus[formId]);
  };
  function updateStateDashboard() {
    const total = document.querySelectorAll(".required-form-row").length;

    const reviewed = Object.values(window.formReviewStatus).filter((item) => {
      return item?.status === "IGO" || item?.status === "NIGO";
    }).length;

    const issues = Object.values(window.formReviewStatus).filter((item) => {
      return item?.status === "NIGO";
    }).length;

    const remaining = Math.max(total - reviewed, 0);

    const reviewedCard = document.getElementById("reviewedCountCard");

    const remainingCard = document.getElementById("remainingCountCard");

    const issueCard = document.getElementById("dashboardIssueCount");

    const stateCard = document.getElementById("dashboardState");

    if (reviewedCard) {
      reviewedCard.textContent = String(reviewed);
    }

    if (remainingCard) {
      remainingCard.textContent = String(remaining);
    }

    if (issueCard) {
      issueCard.textContent = String(issues);
    }

    if (stateCard) {
      stateCard.textContent =
        document.getElementById("contractState")?.value || "--";
    }
    updateNigoDashboard();
  }
function updateNigoDashboard() {
  const issueContainer = document.getElementById("openNigoList");

  const countElement = document.getElementById("openNigoCount");

  if (!issueContainer || !countElement) {
    return;
  }

  const nigos = Object.values(window.formReviewStatus).filter((item) => {
    return item?.status === "NIGO";
  });

  countElement.textContent = String(nigos.length);

  if (!nigos.length) {
    issueContainer.innerHTML = `
      <div class="nigo-empty">
        No documented NIGOs
      </div>
    `;

    return;
  }

  issueContainer.innerHTML = nigos
    .map(
      (item) => `
        <div class="nigo-issue-item">

          <div class="nigo-issue-form">
            ${item.formId}
          </div>

          <div class="nigo-issue-reason">
            ${item.issueLabel}
          </div>

        </div>
      `,
    )
    .join("");
}
  document.addEventListener("DOMContentLoaded", () => {
    const stateDropdown = document.getElementById("contractState");

    if (!stateDropdown) return;

    if (stateDropdown.value) {
      stateDropdown.dispatchEvent(new Event("change"));
    }
  });
}
