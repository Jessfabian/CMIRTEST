/* =========================================================
   STATE REQUIREMENTS LOADER
   File: stateLoader.js

   PURPOSE:
   Controls the State Requirements portion of the
   Full Initial Review page.

   MAIN RESPONSIBILITIES:
   1. Loads the selected state's JSON file.
   2. Determines which state forms apply to the case.
   3. Creates the IGO/NIGO review controls.
   4. Displays state-specific notes and checklist items.
   5. Updates state and page dashboard counts.
   6. Creates NIGO amendment and requirement workspaces.
   7. Notifies amendment-engine.js when forms change.

   DATA SOURCE:
   data/[STATE].json

   CONNECTED SCRIPTS:
   - amendment-engine.js
   - initial-review.js
   - review-output-package.js
========================================================= */

document.addEventListener("DOMC*ntentLoaded", function () {
  "use*strict";
document.addEventListener("DOMContentLoaded", function () {
  "use strict";

  /* ==============*==================================*=====
     HTML ELEMENT REFERENCES*
     Finds and stores the page el*ments that this script
     needs *o read from or update.

     Using*constants here prevents the script*from repeatedly
     searching the*HTML document for the same element*.
  ==============================*======================== */

  // Main Contract State dropdown
  const contractState = document.getElementById("contractState");

// Containers populated with state JSON information
  const requiredFormsContainer = document.getElementById("requiredForms");

  const specialNotesContainer = document.getElementById("specialNotes");

  const reviewChecklistContainer = document.getElementById("reviewChecklist");

// State Requirements heading and summary elements
  const contractStateBanner = document.getElementById("contractStateBanner");

  const stateRequirementSummary = document.getElementById(
    "stateRequirementSummary",
  );

  const applicableFormCount = document.getElementById("applicableFormCount");

  const specialNoteCount = document.getElementById("specialNoteCount");

  // State Requirements dashboard cards
  const requiredFormCountCard = document.getElementById(
    "requiredFormCountCard",
  );

  const reviewedFormCountCard = document.getElementById(
    "reviewedFormCountCard",
  );

  const remainingFormCountCard = document.getElementById(
    "remainingFormCountCard",
  );

  const specialNoteCountCard = document.getElementById("specialNoteCountCard");

// Main page dashboard values
  const dashboardState = document.getElementById("dashboardState");

  const dashboardSystem = document.getElementById("dashboardSystem");

  const dashboardProduct = document.getElementById("dashboardProduct");

  const dashboardFormCount = document.getElementById("dashboardFormCount");

  const dashboardIssueCount = document.getElementById("dashboardIssueCount");

  const dashboardReviewedCount = document.getElementById(
    "dashboardReviewedCount",
  );


    /* =======================================================
     CURRENT STATE DATA

     Stores the JSON object for the currently selected state.

     Example:
     If New York is selected, this holds the contents of
     data/NY.json.

     It remains null until a state file loads successfully.
  ======================================================= */

  let currentStateData = null;
  let currentStateData = null;

   /* =======================================================
     CONDITIONAL FORM FIELD LIST

     These Case Setup fields can affect which state forms
     apply to the current case.

     When one of these fields changes, the script filters the
     state forms again without reloading the JSON file.

     IMPORTANT:
     Every ID listed here should match an element ID in HTML.

  ======================================================= */

  const conditionFieldIds =*[
    "replacement",
    "ownerType",
    "beneficiaryOther",
    "tlirRequested",
    "caseType",
    "productType",
    "additionalInsured",
    "internalTermReplacement",
    "billingType",
    "suitabilityQuestionnaireRequired",
  ];
  const conditionFieldIds = [
    "replacement",
    "ownerType",
    "beneficiaryOther",
    "tlirRequested",
    "caseType",
    "productType",
    "additionalInsured",
    "internalTermReplacement",
    "billingType",
    "suitabilityQuestionnaireRequired",
  ];

  /* ======================================================
     REQUIRED ELEMENT SAFETY CHECKS

     Stops the script if critical HTML elements are missing.

     This prevents later functions from failing with errors

     Ex:"Cannot set properties of null"
  ======================================================= */

  if (!contractState) {
    console.error('The field with id="contractState" was not found.');

    return;
  }

  if (!requiredFormsContainer) {
    console.error('The container with id="requiredForms" was not found.');

    return;
  }

/* =======================================================
PAGE EVENT LISTENERS
 
Watches the Contract State and conditional Case Setup
fields for user changes.
======================================================= */

  // Load a new state JSON file when Contract State changes.
  contractState.addEventListener("change", loadStateRequirements);

  // Reevaluate applicable forms whenever a conditional Case Setup field changes.

  conditionFieldIds.forEach(function (fieldId) {
    const field = document.getElementById(fieldId);

    if (!field) {
      return;
    }

    field.addEventListener("change", refreshApplicableForms);

    field.addEventListener("input", refreshApplicableForms);
  });

  // The system field is handled separately, its not included in conditionFieldIds.
  const systemField = document.getElementById("system");

  if (systemField) {
    systemField.addEventListener("change", refreshApplicableForms);
  }

// Refilters and redraws the applicable forms using the state JSON thatd already loaded. This does not fetch the JSON file again.
  function refreshApplicableForms() {
    if (!currentStateData) {
      return;
    }

    renderApplicableForms(currentStateData);
  }

  /* ======================================================
    LOAD SELECTED STATE REQUIREMENTS
     
    Runs when the Contract State dropdown changes.
     
    PROCESS:

    1. Reads the selected state abbreviation.
    2. Clears the previous state's information.
    3. Fetches data/[STATE].json.
    4. Converts the response into a JavaScript object.
    5. Renders forms, notes, and checklist items.
    6. Updates dashboard counts.
    7. Displays an error if the JSON cannot be loaded.
    ======================================================= */

  async function loadStateRequirements() {

    // Get the state abbreviation selected by the user.
    const selectedState = contractState.value;

   // Remove the previously stored state data.
    currentStateData = null;

    // Clear forms, notes, checklist items, and counts.
    clearStateDisplay();
    if (dashboardIssueCount) {
      dashboardIssueCount.textContent = "0";
    }

    // Stop here if the user cleared the Contract State field.
    if (!selectedState) {
      if (contractStateBanner) {
        contractStateBanner.textContent = "Select a Contract State";
      }

      updateDashboardForNoState();

      return;
    }

    if (contractStateBanner) {
      contractStateBanner.textContent =
        "Loading " + selectedState + " requirements...";
    }

      // Load the state JSON without using a cached copy. Ex: data/NY.json
    try {
      const response = await fetch("data/" + selectedState + ".json", {
        cache: "no-store",
      });

      // Treat an unsuccessful HTTP response as an error.
      if (!response.ok) {
        throw new Error(
          "Unable to load data/" +
            selectedState +
            ".json. HTTP status: " +
            response.status,
        );
      }

      // Convert the JSON response into a JavaScript object.
      const stateData = await response.json();

      currentStateData = stateData;

      // Send the loaded state data to each page-rendering function.
      console.log("Loaded state data:", stateData);

      renderStateBanner(stateData);
      renderApplicableForms(stateData);
      renderSpecialNotes(stateData);
      renderReviewChecklist(stateData);
      updateStateDashboardCards();
    }
      //Display a user-friendly message if the file is missing, the JSON is invalid, or the request otherwise fails.
    catch (error) {
      console.error("Unable to load state requirements:", error);

      if (contractStateBanner) {
        contractStateBanner.textContent =
          "Unable to load " + selectedState + " requirements.";
      }

      requiredFormsContainer.innerHTML = `
        <div class="warning-note">
          Confirm that data/${escapeHtml(
            selectedState,
          )}.json exists and contains valid JSON.
        </div>
      `;
    }
  }

  /* =======================================================
    CLEAR PREVIOUS STATE DISPLAY
     
    Removes information from the previously selected state
    and resets all state-related co*nts to zero.
     
    This runs before a new state JSON file is rendered
    ===============================*======================= */

  function clearStateDisplay() {
    requiredFormsContainer.innerHTML = "";

    if (specialNotesContainer) {
      specialNotesContainer.innerHTML = "";
    }

    if (reviewChecklistContainer) {
      reviewChecklistContainer.innerHTML = "";
    }

    if (applicableFormCount) {
      applicableFormCount.textContent = "0 forms";
    }

    if (specialNoteCount) {
      specialNoteCount.textContent = "0 notes";
    }
    if (requiredFormCountCard) {
      requiredFormCountCard.textContent = "0";
    }

    if (reviewedFormCountCard) {
      reviewedFormCountCard.textContent = "0";
    }

    if (remainingFormCountCard) {
      remainingFormCountCard.textContent = "0";
    }

    if (specialNoteCountCard) {
      specialNoteCountCard.textContent = "0";
    }
  }

  // Resets the main dashboard when no Contract State is currently selected.
  function updateDashboardForNoState() {
    if (dashboardState) {
      dashboardState.textContent = "--";
    }

    if (dashboardFormCount) {
      dashboardFormCount.textContent = "0";
    }

    if (dashboardReviewedCount) {
      dashboardReviewedCount.textContent = "0";
    }

    if (stateRequirementSummary) {
      stateRequirementSummary.textContent =
        "Select a state to load requirements.";
    }
  }

    /* =======================================
     Displays the selected state's name in:

    1. The State Requirements banner
    2. The main dashboard State card

    @param {Object} stateData loaded state JSON object.
    ==========================================*/

  function renderStateBanner(stateData) {
    const displayName =
      stateData.displayName || stateData.state || contractState.value;

    if (contractStateBanner) {
      contractStateBanner.innerHTML = `
        <strong>Contract State:</strong>
        ${escapeHtml(displayName)}
      `;
    }

    if (dashboardState) {
      dashboardState.textContent = stateData.state || "--";
    }
  }

    /* ====================================================
    FIELD VALUE HELPER
     
    Return a standardized value from an HTML field.
     
    CHECKBOX:
    Checked -> "yes"
    Unchecked -> "no"

    OTHER FIELD TYPES:
    Returns the field's trimmed value.
     
    Missing fields return an empty stiing.
    ====================================================== */

  function getFieldValue(fieldId) {
    const field = document.getElementById(fieldId);

    if (!field) {
      return "";
    }

    if (field.type === "checkbox") {
      return field.checked ? "yes" : "no";
    }

    return String(field.value).trim();
  }

    /* =============================================
     Creates one object containing the current Case Setup
     selections used by the form-condition engine.

    The property names must match the "field" values used
    by conditions in the state JSON files.

    @returns {Object} Current conditional case values.
    ================================================= */

  function getCaseValues() {
    return {
      replacement: getFieldValue("replacement"),

      ownerType: getFieldValue("ownerType"),

      beneficiaryOther: getFieldValue("beneficiaryOther"),

      tlirRequested: getFieldValue("tlirRequested"),

      caseType: getFieldValue("caseType"),

      productType: getFieldValue("productType"),

      additionalInsured: getFieldValue("additionalInsured"),

      internalTermReplacement: getFieldValue("internalTermReplacement"),

      billingType: getFieldValue("billingType"),

      suitabilityQuestionnaireRequired: getFieldValue(
        "suitabilityQuestionnaireRequired",
      ),
    };
  }


    /* =======================================================
    FORM CONDITION EVALUATOR
     
    Determines whether one state form applies to the
    current case.
     
    If a form has no conditions, it automatically applies.
     
    Supported JSON operators:
    - equals
    - notEquals
    - includes
    - notIncludes
     
    All conditions must pass, this function uses Array.every().
    ======================================================= */

  function formApplies(form, caseValues) {

    // Forms without conditions are always applicable.
    if (!Array.isArray(form.conditions) || form.conditions.length === 0) {
      return true;
    }

    // Every condition must be true for the form to apply
    return form.conditions.every(function (rule) {
      const actualValue = caseValues[rule.field];

      switch (rule.operator) {

    // Case field must exactly match the JSON value.
        case "equals":
          return actualValue === rule.value;

    // Case field must not match the JSON value.
        case "notEquals":
          return actualValue !== rule.value;

    // Case field must appear in the JSON value array.
        case "includes":
          return Array.isArray(rule.value) && rule.value.includes(actualValue);

     // Case field must not appear in the JSON value array.
        case "notIncludes":
          return Array.isArray(rule.value) && !rule.value.includes(actualValue);

    // Unknown operators fail safely.
        default:
          console.warn("Unknown form condition:", rule);

          return false;
      }
    });
  }

  /* ====================================================
    RENDER APPLICABLE S*ATE FORMS
     
    Filters and displays forms from the selected states JSON file.
     
    FILTER PROCESS:

    1. Read all forms from stateData.forms.
    2. Keep only forms with reviewRequired: true.
    3* Apply the current Case Setup conditions.
    4. Separate always-required and conditional forms.
    5* Create an IGO/NIGO row for each applicable form.
    6. Update dashsoard totals.
    7. Notify amendment-engine.js that rows were created.
    ==============================*======================== */

  function renderApplicableForms(stateData) {

    // Remove previously generated form rows and headings.
    requiredFormsContainer.innerHTML = "";

    // Safely retrieve the forms array from the state JSON.
    const allForms = Array.isArray(stateData.forms) ? stateData.forms : [];

    // Keep only forms that require initial review.
    const reviewableForms = allForms.filter(function (form) {
      return form.reviewRequired === true;
    });

    // Capture the user's current Case Setup selections.
    const caseValues = getCaseValues();

    // Keep only the forms whose conditions currently pass.
    const applicableForms = reviewableForms.filter(function (form) {
      return formApplies(form, caseValues);
    });

    // Forms without conditions apply to every applicable case.
    const alwaysRequiredForms = applicableForms.filter(function (form) {
      return !Array.isArray(form.conditions) || form.conditions.length === 0;
    });

    // Forms with conditions apply only to certain cases.
    const conditionalForms = applicableForms.filter(function (form) {

      return Array.isArray(form.conditions) && form.conditions.length > 0;
    });

      /* ================================================
      Creates a heading inside the required forms container.

      @param {string} text Heading to display.
      ================================================== */

    addGroupHeading("Required for All Applicable Cases");



    if (alwaysRequiredForms.length === 0) {

      /* ================================================
      Displays a message when a form group has no matching
      forms.

      @param {string} text Message to display
      ================================================== */

      addEmptyMessage("No always-required forms are configured.");
    } else {
      alwaysRequiredForms.forEach(function (form) {
        requiredFormsContainer.appendChild(
          createFormRow(form, "Always Required"),
        );
      });
    }

    addGroupHeading("Conditional Forms");

    if (conditionalForms.length === 0) {
      addEmptyMessage(
        "No conditional forms apply based on the current case selections.",
      );
    } else {
      conditionalForms.forEach(function (form) {
        requiredFormsContainer.appendChild(createFormRow(form, "Conditional"));
      });
    }

    updateDashboard(stateData, applicableForms);

    /* ================================================
      Notify amendment-engine.js that new form rows and NIGO
      panels now exist in the page.

      The amendment engine can then initialize template
      dropdowns and dynamic fields inside those panels.
       ================================================== */

    document.dispatchEvent(
      new CustomEvent("stateFormsUpdated", {
        detail: {
          state: stateData.state,
          formCount: applicableForms.length,
        },
      }),
    );
  }

  function addGroupHeading(text) {
    const heading = document.createElement("h4");

    heading.className = "form-group-heading";

    heading.textContent = text;

    requiredFormsContainer.appendChild(heading);
  }

  function addEmptyMessage(text) {
    const message = document.createElement("p");

    message.className = "empty-state";

    message.textContent = text;

    requiredFormsContainer.appendChild(message);
  }

      /* =======================================================
      CREATE REQUIRED FORM REVIEW ROW
       
      Creates one complete HTML row for a state form.
       
      EACH ROW CONTAINS:
      - Form number
      - Form description
      - Required or Conditional badge
      - IGO button
      - NIGO button
      - Hidden NIGO workspace
      - Amendment template controls
      - Saved amendments
      - Generated amendment output
      - Requirement template controls
      - Generated requirement output
       
      The row starts with no review status.
      Selecting NIGO opens its hidden NIGO workspace.
       
      @param {Object} form
      Form information from the state JSON.
       
      @param {string} badgeText
      Either "Always Required" or "Conditional".
       
      @returns {HTMLElement}
      Completed required-form row.
      ======================================================= */

  function createFormRow(form, badgeText) {

    // Create the outer container for this form.
    const row = document.createElement("div");

    row.className = "required-form-row";

    // Read the form's information with safe fallback values.
    const formId = form.form || "Unknown Form";

    const description = form.description || "";

    const condition = form.condition || "";

    const applicationForm = form.applicationForm || form.formType || "Part 1";

    // Store form information directly on the HTML row. Other scripts can read these values using row.dataset
    row.dataset.formId = formId;

    row.dataset.formStatus = "";

    row.dataset.applicationForm = applicationForm;

    /* ==============================================
     NIGO ISSUE WORKSPACE

     Hidden until the NIGO button is selected.
    ============================================== */

      row.innerHTML = `


      <div class="state-form-main">

        <div class="state-form-content">

          <div class="state-form-header">

            <strong class="state-form-id">
              ${escapeHtml(formId)}
            </strong>

            <span class="${
              badgeText === "Always Required"
                ? "required-badge"
                : "conditional-badge"
            }">
              ${escapeHtml(badgeText)}
            </span>

            <span
              class="form-review-result"
              aria-live="polite"
            ></span>

          </div>

          <span class="form-description">
            ${escapeHtml(description)}
          </span>

          ${
            condition
              ? `
                <small class="form-condition">
                  ${escapeHtml(condition)}
                </small>
              `
              : ""
          }

        </div>

        <div class="form-status-actions">

          <button
            type="button"
            class="form-status-button igo-button"
            data-form-action="igo"
          >
            IGO
          </button>

          <button
            type="button"
            class="form-status-button nigo-button"
            data-form-action="nigo"
          >
            NIGO
          </button>

        </div>

      </div>

      <div
        class="form-nigo-panel"
        hidden
      >

        <div class="nigo-panel-header">

          <div>
            <strong>
              ${escapeHtml(formId)} Issue Details
            </strong>

            <p>
              Create the policy amendment and
              agency requirement for this form.
            </p>
          </div>

        </div>

        <div class="nigo-workspace">

          <!-- LEFT COLUMN: POLICY AMENDMENT -->

          <section
            class="nigo-workspace-column amendment-column"
          >

            <div class="nigo-column-heading">

              <h4>
                Policy Amendment
              </h4>

              <p>
                Generate the amendment that will
                appear with the policy pages.
              </p>

            </div>

            <div class="case-field">

              <label>
                Form Being Amended
              </label>

              <select
                class="amendment-form-name"
              >

                <option value="Part 1">
                  Part 1
                </option>

                <option value="Part 2">
                  Part 2
                </option>

                <option
                  value="Additional Insured Supplement"
                >
                  Additional Insured Supplement
                </option>

                <option
                  value="Owner Designation Form"
                >
                  Owner Designation Form
                </option>

                <option
                  value="Beneficiary Designation Form"
                >
                  Beneficiary Designation Form
                </option>

                <option
                  value="Conversion and Insurability Option Supplement"
                >
                  Conversion and Insurability
                  Option Supplement
                </option>

                <option value="custom">
                  Other Form
                </option>

              </select>

            </div>

            <div
              class="case-field amendment-custom-form-field"
              hidden
            >

              <label>
                Other Form Name
              </label>

              <input
                type="text"
                class="amendment-custom-form"
                placeholder="Enter the full form name"
              >

            </div>

            <div class="case-field">

              <label>
                Question or Section
              </label>

              <input
                type="text"
                class="amendment-question"
                placeholder="Example: A3, E2, C11a, or Section C"
              >

            </div>

            <div class="case-field">
<hr class="amendment-divider">
  <label>
    Amendment Template
  </label>

  <select
    class="amendment-template"
  >

    <option value="">
      Loading templates...
    </option>

  </select>

  <small
    class="amendment-template-status"
    aria-live="polite"
  >
    Amendment templates are loading.
  </small>

</div>

<div
  class="amendment-dynamic-fields"
></div>

<div class="saved-amendments">

    <label>
        Saved Amendments
    </label>

    <div class="saved-amendment-list">
    </div>

    <button
        type="button"
        class="secondary-button save-amendment"
    >
        Add Amendment
    </button>

</div>

<div
    class="generated-output-block"
>

    <label>
        Generated Amendment
    </label>

    <textarea
        class="generated-amendment"
        rows="6"
        readonly
        placeholder="The generated amendment will appear here."
    ></textarea>

    <button
        type="button"
        class="secondary-button"
        data-copy-output="amendment"
    >
        Copy Amendment
    </button>

</div>

</section>

<!-- RIGHT COLUMN: AGENCY REQUIREMENT -->

<section
    class="nigo-workspace-column requirement-column"
>

<div class="case-field">

              <label>
                Requirement Template
              </label>

              <select
                class="requirement-template"
              >

                <option value="">
                  Loading requirements...
                </option>

              </select>

              <small
                class="requirement-template-status"
                aria-live="polite"
              >
                Requirement templates are loading.
              </small>

            </div>

            <div
              class="requirement-dynamic-fields"
            ></div>

            <div
              class="case-field requirement-notes-field"
            >

              <label>
                Additional Requirement Notes
              </label>

              <textarea
                class="nigo-issue"
                rows="4"
                placeholder="Optional additional details"
              ></textarea>

            </div>

            <div
              class="generated-output-block"
            >

              <label>
                Generated Requirement
              </label>

              <textarea
                class="generated-requirement"
                rows="6"
                readonly
                placeholder="The generated agency requirement will appear here."
              ></textarea>

              <button
                type="button"
                class="secondary-button"
                data-copy-output="requirement"
              >
                Copy Requirement
              </button>

            </div>

          </section>

        </div>

      </div>
    `;

    return row;
  }

  function renderSpecialNotes(stateData) {
    if (!specialNotesContainer) {
      return;
    }

    specialNotesContainer.innerHTML = "";

    const notes = Array.isArray(stateData.specialNotes)
      ? stateData.specialNotes
      : [];

    if (notes.length === 0) {
      specialNotesContainer.innerHTML = `
        <p class="empty-state">
          No special state notes are configured.
        </p>
      `;

      if (specialNoteCount) {
        specialNoteCount.textContent = "0 notes";
      }

      return;
    }

    notes.forEach(function (note) {
      const noteElement = document.createElement("div");

      noteElement.className = "warning-note";

      noteElement.innerHTML = `
          <strong>Important:</strong>
          ${escapeHtml(note)}
        `;

      specialNotesContainer.appendChild(noteElement);
    });

    if (specialNoteCount) {
      specialNoteCount.textContent =
        notes.length + " note" + (notes.length === 1 ? "" : "s");
    }
  }

  function renderReviewChecklist(stateData) {
    if (!reviewChecklistContainer) {
      return;
    }

    reviewChecklistContainer.innerHTML = "";

    const checks = Array.isArray(stateData.initialReviewChecks)
      ? stateData.initialReviewChecks
      : [];

    if (checks.length === 0) {
      reviewChecklistContainer.innerHTML = `
        <p class="empty-state">
          No state-specific review checks
          are configured.
        </p>
      `;

      return;
    }

    checks.forEach(function (item, index) {
      const checkRow = document.createElement("div");

      checkRow.className = "check-row";

      checkRow.innerHTML = `
          <label>

            <input
              type="checkbox"
              data-track-progress="true"
              value="state-review-${index}"
            >

            <span>
              ${escapeHtml(item)}
            </span>

          </label>
        `;

      reviewChecklistContainer.appendChild(checkRow);
    });
  }

  function updateDashboard(stateData, applicableForms) {
    if (dashboardState) {
      dashboardState.textContent = stateData.state || "--";
    }

    if (dashboardSystem) {
      dashboardSystem.textContent = getSelectedFieldText("system") || "--";
    }

    if (dashboardProduct) {
      dashboardProduct.textContent =
        getSelectedFieldText("productType") || "--";
    }

    if (dashboardFormCount) {
      dashboardFormCount.textContent = String(applicableForms.length);
    }

    if (applicableFormCount) {
      applicableFormCount.textContent =
        applicableForms.length +
        " form" +
        (applicableForms.length === 1 ? "" : "s");
    }

    if (stateRequirementSummary) {
      const displayName =
        stateData.displayName || stateData.state || "Selected state";

      stateRequirementSummary.textContent =
        displayName + ": " + applicableForms.length + " applicable forms";
    }

    updateReviewedCount();
  }

  function getSelectedFieldText(fieldId) {
    const field = document.getElementById(fieldId);

    if (!field || field.selectedIndex < 0) {
      return "";
    }

    return field.options[field.selectedIndex].text.trim();
  }
  function updateStateDashboardCards() {
    const totalForms =
      requiredFormsContainer.querySelectorAll(".required-form-row").length;

    const reviewedForms = requiredFormsContainer.querySelectorAll(
      '.required-form-row[data-form-status="igo"], ' +
        '.required-form-row[data-form-status="nigo"]',
    ).length;

    const remainingForms = Math.max(totalForms - reviewedForms, 0);
    const openIssues = requiredFormsContainer.querySelectorAll(
      '.required-form-row[data-form-status="nigo"]',
    ).length;

    if (dashboardIssueCount) {
      dashboardIssueCount.textContent = String(openIssues);
    }
    const totalNotes = specialNotesContainer
      ? specialNotesContainer.querySelectorAll(".warning-note").length
      : 0;

    if (requiredFormCountCard) {
      requiredFormCountCard.textContent = String(totalForms);
    }

    if (reviewedFormCountCard) {
      reviewedFormCountCard.textContent = String(reviewedForms);
    }

    if (remainingFormCountCard) {
      remainingFormCountCard.textContent = String(remainingForms);
    }

    if (specialNoteCountCard) {
      specialNoteCountCard.textContent = String(totalNotes);
    }
  }
  function updateReviewedCount() {
    const reviewedForms = document.querySelectorAll(
      '.required-form-row[data-form-status="igo"], ' +
        '.required-form-row[data-form-status="nigo"]',
    ).length;

    if (dashboardReviewedCount) {
      dashboardReviewedCount.textContent = String(reviewedForms);
    }
  }

  requiredFormsContainer.addEventListener("click", async function (event) {
    const statusButton = event.target.closest("[data-form-action]");

    const copyButton = event.target.closest("[data-copy-output]");

    if (statusButton) {
      handleFormStatus(statusButton);

      return;
    }

    if (copyButton) {
      await copyFormOutput(copyButton);
    }
  });

  function handleFormStatus(button) {
    const row = button.closest(".required-form-row");

    if (!row) {
      return;
    }

    const action = button.dataset.formAction;

    const result = row.querySelector(".form-review-result");

    const nigoPanel = row.querySelector(".form-nigo-panel");

    row
      .querySelectorAll(".form-status-button")
      .forEach(function (statusButton) {
        statusButton.classList.remove("selected");
      });

    button.classList.add("selected");

    row.dataset.formStatus = action;

    if (action === "igo") {
      if (result) {
        result.textContent = "All Clear";

        result.className = "form-review-result result-igo";
      }

      if (nigoPanel) {
        nigoPanel.hidden = true;
      }
    }

    if (action === "nigo") {
      if (result) {
        result.textContent = "Issue Found";

        result.className = "form-review-result result-nigo";
      }

      if (nigoPanel) {
        nigoPanel.hidden = false;

        document.dispatchEvent(
          new CustomEvent("nigoPanelOpened", {
            detail: {
              panel: nigoPanel,

              formId: row.dataset.formId,
            },
          }),
        );
      }
    }

    updateReviewedCount();
    updateStateDashboardCards();

    document.dispatchEvent(
      new CustomEvent("stateFormsUpdated", {
        detail: {
          source: "formStatus",
        },
      }),
    );
  }

  async function copyFormOutput(button) {
    const panel = button.closest(".form-nigo-panel");

    if (!panel) {
      return;
    }

    const outputType = button.dataset.copyOutput;

    const selector =
      outputType === "requirement"
        ? ".generated-requirement"
        : ".generated-amendment";

    const output = panel.querySelector(selector);

    if (!output || !output.value.trim()) {
      return;
    }

    const originalText = button.textContent.trim();

    try {
      await navigator.clipboard.writeText(output.value);
    } catch (error) {
      output.focus();
      output.select();

      document.execCommand("copy");
    }

    button.textContent = "Copied";

    window.setTimeout(function () {
      button.textContent = originalText;
    }, 1400);
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  /*
   * Load the currently selected state when
   * the page initially opens.
   */
  if (contractState.value) {
    loadStateRequirements();
  }
});

const policyNumberField = document.getElementById("policyNumber");

policyNumberField.addEventListener("input", updatePolicyLookup);

document.addEventListener("stateFormsUpdated", function () {
  updatePolicyLookup();
});

function updatePolicyLookup() {
  const policyNumber = String(policyNumberField.value || "").replace(/\D/g, "");

  const prefix = policyNumber.substring(0, 2);

  let product = "--";
  let system = "--";

  switch (prefix) {
    // Whole Life

    case "21":
    case "32":
    case "34":
      product = "Whole Life";
      system = "WinRisk";
      break;

    // Vantage Term

    case "38":
    case "42":
      product = "Vantage Term";
      system = "TPP";
      break;

    // CareChoice

    case "22":
      product = "CareChoice";
      system = "WinRisk";
      break;

    // VUL Guard

    case "15":
    case "16":
      product = "VUL Guard";
      system = "WinRisk";
      break;
  }

  const dashboardProduct = document.getElementById("dashboardProduct");

  const dashboardSystem = document.getElementById("dashboardSystem");

  if (dashboardProduct) {
    dashboardProduct.textContent = product;
  }

  if (dashboardSystem) {
    dashboardSystem.textContent = system;
  }
}
