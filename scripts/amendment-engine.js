(function () {
  "use strict";

  const AMENDMENT_URL = "data/amendmentTemplates.json";

  const QUESTION_MAPPING_URL = "data/questionMappings.json";

  const REQUIREMENT_URL = "data/requirementTemplates.json";

  let amendmentTemplates = {};
  let questionMappings = {};
  let requirementTemplates = {};
  let requirementFormMappings = {};
  let engineLoaded = false;
  let observerStarted = false;

  const fieldLabels = {
    value: "Correct or Missing Information",
    answer: "Answer",
    details: "Details",
    section: "Section",
    questionRange: "Question Range",
    questionParts: "Question Parts",
    component: "Component",
    policyNumber: "Policy Number",
    company: "Company Name",
    policyStatus: "Policy Status",
    replacementStatus: "Replacement Status",
    signerName: "Signer Name",
    title: "Title",
    documentName: "Document Name",
    supplementName: "Supplement Name",
    detail: "Clarification Needed",
    insuredName: "Insured Name",
    custodian: "Custodian Name",
    state: "State",
    insurerName: "Insurer Name",
    avocation: "Avocation",
    reason: "Reason",
    designElement: "Policy Design Item",
    applicationValue: "Part 1 Value",
    illustrationValue: "Illustration Value",
    question: "Question",
    questionOne: "Question 1",
    answerOne: "Answer 1",
    questionTwo: "Question 2",
    answerTwo: "Answer 2",
    signerName: "Signer Name",
  };

  const multilineFields = ["value", "details", "detail"];

  async function fetchJson(url, label) {
    const response = await fetch(url, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(
        label +
          " could not be loaded. HTTP " +
          response.status +
          " from " +
          url,
      );
    }

    const text = await response.text();

    try {
      return JSON.parse(text);
    } catch (error) {
      throw new Error(label + " contains invalid JSON. " + error.message);
    }
  }

function initializeGlobalSidebarWorkspace() {
  const amendmentDropdown = document.getElementById("globalAmendmentTemplate");

  const requirementDropdown = document.getElementById(
    "globalRequirementTemplate",
  );

  if (!amendmentDropdown) {
    console.error("Missing #globalAmendmentTemplate.");
  } else {
    const previousValue = amendmentDropdown.value;

    amendmentDropdown.innerHTML = "";
    amendmentDropdown.disabled = false;

    const placeholder = document.createElement("option");

    placeholder.value = "";
    placeholder.textContent = "Select Template";

    amendmentDropdown.appendChild(placeholder);

    const categories = {};

    Object.keys(amendmentTemplates).forEach(function (templateKey) {
      const template = amendmentTemplates[templateKey];
      const category = template.category || "Other";

      if (!categories[category]) {
        categories[category] = [];
      }

      categories[category].push({
        key: templateKey,
        template: template,
      });
    });

    Object.keys(categories)
      .sort()
      .forEach(function (category) {
        const group = document.createElement("optgroup");

        group.label = category;

        categories[category]
          .sort(function (first, second) {
            const firstLabel = first.template.label || first.key;
            const secondLabel = second.template.label || second.key;

            return firstLabel.localeCompare(secondLabel);
          })
          .forEach(function (item) {
            const option = document.createElement("option");

            option.value = item.key;
            option.textContent = item.template.label || item.key;

            group.appendChild(option);
          });

        amendmentDropdown.appendChild(group);
      });

    if (previousValue && amendmentTemplates[previousValue]) {
      amendmentDropdown.value = previousValue;
    }

    console.log("Global amendment options:", amendmentDropdown.options.length);
  }

  if (!requirementDropdown) {
    console.error("Missing #globalRequirementTemplate.");
  } else {
    const previousValue = requirementDropdown.value;

    requirementDropdown.innerHTML = "";
    requirementDropdown.disabled = false;

    const placeholder = document.createElement("option");

    placeholder.value = "";
    placeholder.textContent = "Select Requirement";

    requirementDropdown.appendChild(placeholder);

    const keys = Object.keys(requirementTemplates);

    if (keys.length === 0) {
      placeholder.textContent = "Requirements unavailable";
      requirementDropdown.disabled = true;
    } else {
      keys
        .sort(function (first, second) {
          const firstLabel = requirementTemplates[first].label || first;

          const secondLabel = requirementTemplates[second].label || second;

          return firstLabel.localeCompare(secondLabel);
        })
        .forEach(function (templateKey) {
          const template = requirementTemplates[templateKey];
          const option = document.createElement("option");

          option.value = templateKey;
          option.textContent = template.label || templateKey;

          requirementDropdown.appendChild(option);
        });

      if (previousValue && requirementTemplates[previousValue]) {
        requirementDropdown.value = previousValue;
      }
    }

    console.log(
      "Global requirement options:",
      requirementDropdown.options.length,
    );
  }

  bindGlobalSidebarEvents();
  buildGlobalAmendmentFields();
  buildGlobalRequirementFields();
  generateGlobalSidebarOutputs();
}
let globalSidebarEventsBound = false;

function bindGlobalSidebarEvents() {
  if (globalSidebarEventsBound) {
    return;
  }

  globalSidebarEventsBound = true;

  const amendmentDropdown = document.getElementById("globalAmendmentTemplate");

  const requirementDropdown = document.getElementById(
    "globalRequirementTemplate",
  );

  const formDropdown = document.getElementById("globalAmendmentForm");

  const questionInput = document.getElementById("globalQuestion");

  if (amendmentDropdown) {
    amendmentDropdown.addEventListener("change", function () {
      buildGlobalAmendmentFields();
      generateGlobalSidebarOutputs();
    });
  }

  if (requirementDropdown) {
    requirementDropdown.addEventListener("change", function () {
      buildGlobalRequirementFields();
      generateGlobalSidebarOutputs();
    });
  }

  if (formDropdown) {
    formDropdown.addEventListener("change", generateGlobalSidebarOutputs);
  }

  if (questionInput) {
    questionInput.addEventListener("input", generateGlobalSidebarOutputs);
  }

  const amendmentFields = document.getElementById("globalAmendmentFields");

  if (amendmentFields) {
    amendmentFields.addEventListener("input", generateGlobalSidebarOutputs);

    amendmentFields.addEventListener("change", generateGlobalSidebarOutputs);
  }

  const requirementFields = document.getElementById("globalRequirementFields");

  if (requirementFields) {
    requirementFields.addEventListener("input", generateGlobalSidebarOutputs);

    requirementFields.addEventListener("change", generateGlobalSidebarOutputs);
  }

  const copyAmendmentButton = document.getElementById("copyGlobalAmendment");

  if (copyAmendmentButton) {
    copyAmendmentButton.addEventListener("click", function () {
      const output = document.getElementById("globalGeneratedAmendment");

      if (output && output.value.trim()) {
        navigator.clipboard.writeText(output.value);
      }
    });
  }

  const copyRequirementButton = document.getElementById(
    "copyGlobalRequirement",
  );

  if (copyRequirementButton) {
    copyRequirementButton.addEventListener("click", function () {
      const output = document.getElementById("globalGeneratedRequirement");

      if (output && output.value.trim()) {
        navigator.clipboard.writeText(output.value);
      }
    });
  }
}


  async function loadEngineData() {
    try {
      const amendmentData = await fetchJson(
        AMENDMENT_URL,
        "Amendment templates",
      );

      amendmentTemplates = amendmentData.templates || {};

      if (Object.keys(amendmentTemplates).length === 0) {
        throw new Error('The amendment "templates" object is empty.');
      }

      console.log(
        "Loaded amendment templates:",
        Object.keys(amendmentTemplates).length,
      );

      try {
        questionMappings = await fetchJson(
          QUESTION_MAPPING_URL,
          "Question mappings",
        );

        console.log("Loaded question mappings.");
      } catch (error) {
        questionMappings = {};

        console.warn(
          "Question mappings did not load. " +
            "Manual amendment selection will still work.",
          error,
        );
      }

      try {
        const requirementData = await fetchJson(
          REQUIREMENT_URL,
          "Requirement templates",
        );

        requirementTemplates = requirementData.templates || {};

        requirementFormMappings = requirementData.formMappings || {};

        console.log(
          "Loaded requirement templates:",
          Object.keys(requirementTemplates).length,
        );
      } catch (error) {
        requirementTemplates = {};
        requirementFormMappings = {};

        console.error("Requirement templates did not load:", error);
      }

     engineLoaded = true;

     initializeGlobalSidebarWorkspace();
     initializeAllPanels();
     startPanelObserver();
    } catch (error) {
      engineLoaded = false;

      console.error("Amendment engine failed:", error);

      showEngineError(error.message);
    }
  }

  function initializeAllPanels() {
    document.querySelectorAll(".form-nigo-panel").forEach(function (panel) {
      initializePanel(panel);
    });
  }

  function initializePanel(panel) {
    if (!panel || !engineLoaded) {
      return;
    }

    /*
     * If this panel was already initialized,
     * only refresh the generated wording.
     */
    if (panel.dataset.engineInitialized === "true") {
      generateOutputs(panel);
      return;
    }

    populateAmendmentDropdown(panel);
    populateRequirementDropdown(panel);

    updateCustomFormVisibility(panel);

    applyQuestionMapping(panel);
    applyAutomaticRequirement(panel);

    buildAmendmentFields(panel);
    buildRequirementFields(panel);

    generateOutputs(panel);

    panel.dataset.engineInitialized = "true";
  }

  function populateAmendmentDropdown(panel) {
    const dropdown = panel.querySelector(".amendment-template");

    const status = panel.querySelector(".amendment-template-status");

    if (!dropdown) {
      console.error("Missing .amendment-template.");

      return;
    }

    const previousValue = dropdown.value;

    dropdown.innerHTML = "";
    dropdown.disabled = false;

    const placeholder = document.createElement("option");

    placeholder.value = "";
    placeholder.textContent = "Select an amendment template";

    dropdown.appendChild(placeholder);

    const categories = {};

    Object.keys(amendmentTemplates).forEach(function (templateKey) {
      const template = amendmentTemplates[templateKey];

      const category = template.category || "Other";

      if (!categories[category]) {
        categories[category] = [];
      }

      categories[category].push({
        key: templateKey,
        template: template,
      });
    });

    Object.keys(categories)
      .sort()
      .forEach(function (category) {
        const group = document.createElement("optgroup");

        group.label = category;

        categories[category]
          .sort(function (first, second) {
            const firstLabel = first.template.label || first.key;

            const secondLabel = second.template.label || second.key;

            return firstLabel.localeCompare(secondLabel);
          })
          .forEach(function (item) {
            const option = document.createElement("option");

            option.value = item.key;

            option.textContent = item.template.label || item.key;

            group.appendChild(option);
          });

        dropdown.appendChild(group);
      });

    if (previousValue && amendmentTemplates[previousValue]) {
      dropdown.value = previousValue;
    }

    if (status) {
      status.textContent =
        Object.keys(amendmentTemplates).length + " templates available.";

      status.classList.remove("error");
    }
  }

  function populateRequirementDropdown(panel) {
    const dropdown = panel.querySelector(".requirement-template");

    const status = panel.querySelector(".requirement-template-status");

    if (!dropdown) {
      console.error("Missing .requirement-template.");

      return;
    }

    const previousValue = dropdown.value;

    dropdown.innerHTML = "";
    dropdown.disabled = false;

    const placeholder = document.createElement("option");

    placeholder.value = "";
    placeholder.textContent = "Select a requirement template";

    dropdown.appendChild(placeholder);

    const keys = Object.keys(requirementTemplates);

    if (keys.length === 0) {
      placeholder.textContent = "Requirements unavailable";

      dropdown.disabled = true;

      if (status) {
        status.textContent = "Requirement templates did not load.";

        status.classList.add("error");
      }

      return;
    }

    keys
      .sort(function (first, second) {
        const firstLabel = requirementTemplates[first].label || first;

        const secondLabel = requirementTemplates[second].label || second;

        return firstLabel.localeCompare(secondLabel);
      })
      .forEach(function (templateKey) {
        const template = requirementTemplates[templateKey];

        const option = document.createElement("option");

        option.value = templateKey;

        option.textContent = template.label || templateKey;

        dropdown.appendChild(option);
      });

    if (previousValue && requirementTemplates[previousValue]) {
      dropdown.value = previousValue;
    }

    if (status) {
      status.textContent = keys.length + " requirement templates available.";

      status.classList.remove("error");
    }
  }

  function normalizeText(value) {
    return String(value || "")
      .trim()
      .toUpperCase()
      .replace(/\s+/g, "");
  }

  function normalizeQuestion(value) {
    return normalizeText(value)
      .replace(/^QUESTION/, "")
      .replace(/[^A-Z0-9-]/g, "");
  }

  function normalizeFormId(value) {
    const normalized = normalizeText(value);

    const aliases = questionMappings.aliases || {};

    const aliasKeys = Object.keys(aliases);

    for (let index = 0; index < aliasKeys.length; index += 1) {
      const alias = aliasKeys[index];

      if (normalizeText(alias) === normalized) {
        return aliases[alias];
      }
    }

    return normalized;
  }

  function findMappedAmendment(formId, question) {
    const normalizedForm = normalizeFormId(formId);

    const normalizedQuestion = normalizeQuestion(question);

    if (!normalizedQuestion) {
      return "";
    }

    const formMap = questionMappings[normalizedForm] || {};

    const globalMap = questionMappings.global || {};

    return formMap[normalizedQuestion] || globalMap[normalizedQuestion] || "";
  }

  function applyQuestionMapping(panel) {
    const row = panel.closest(".required-form-row");

    const questionInput = panel.querySelector(".amendment-question");

    const dropdown = panel.querySelector(".amendment-template");

    const status = panel.querySelector(".amendment-template-status");

    if (!row || !questionInput || !dropdown) {
      return;
    }

    const question = questionInput.value.trim();

    if (!question) {
      return;
    }

    const formId = row.dataset.formId || "";

    const templateKey = findMappedAmendment(formId, question);

    if (templateKey && amendmentTemplates[templateKey]) {
      dropdown.value = templateKey;

      if (status) {
        status.textContent =
          "Recommended automatically for " +
          formId +
          " question " +
          question +
          ".";
      }

      buildAmendmentFields(panel);
      generateOutputs(panel);
    } else if (status) {
      status.textContent =
        "No automatic mapping found. " + "Select the applicable template.";
    }
  }

  function findRequirementMapping(formId) {
    const normalizedForm = normalizeText(formId);

    const keys = Object.keys(requirementFormMappings);

    for (let index = 0; index < keys.length; index += 1) {
      const key = keys[index];

      if (normalizeText(key) === normalizedForm) {
        return requirementFormMappings[key];
      }
    }

    const sortedKeys = keys.slice().sort(function (first, second) {
      return normalizeText(second).length - normalizeText(first).length;
    });

    for (let index = 0; index < sortedKeys.length; index += 1) {
      const key = sortedKeys[index];

      if (normalizedForm.startsWith(normalizeText(key))) {
        return requirementFormMappings[key];
      }
    }

    return null;
  }

  function applyAutomaticRequirement(panel) {
    const row = panel.closest(".required-form-row");

    const dropdown = panel.querySelector(".requirement-template");

    const status = panel.querySelector(".requirement-template-status");

    if (!row || !dropdown) {
      return;
    }

    const formId = row.dataset.formId || "";

    const mapping = findRequirementMapping(formId);

    if (mapping && requirementTemplates[mapping.template]) {
      dropdown.value = mapping.template;

      panel.dataset.requirementDefaults = JSON.stringify(mapping.values || {});

      if (status) {
        status.textContent =
          "Requirement selected automatically for " + formId + ".";
      }

      return;
    }

    if (requirementTemplates.completedSignedForm) {
      const descriptionElement = row.querySelector(".form-description");

      const documentName = descriptionElement
        ? descriptionElement.textContent.trim()
        : formId;

      dropdown.value = "completedSignedForm";

      panel.dataset.requirementDefaults = JSON.stringify({
        documentName: documentName,
      });

      if (status) {
        status.textContent =
          "A general requirement was selected automatically for " +
          formId +
          ".";
      }
    }
  }

  function getSelectedAmendmentTemplate(panel) {
    const dropdown = panel.querySelector(".amendment-template");

    if (!dropdown || !dropdown.value) {
      return null;
    }

    return amendmentTemplates[dropdown.value] || null;
  }

  function getSelectedRequirementTemplate(panel) {
    const dropdown = panel.querySelector(".requirement-template");

    if (!dropdown || !dropdown.value) {
      return null;
    }

    return requirementTemplates[dropdown.value] || null;
  }

  function getFormName(panel) {
    const dropdown = panel.querySelector(".amendment-form-name");

    const customInput = panel.querySelector(".amendment-custom-form");

    if (dropdown && dropdown.value === "custom") {
      return customInput ? customInput.value.trim() : "";
    }

    return dropdown ? dropdown.value : "Part 1";
  }

  function updateCustomFormVisibility(panel) {
    const dropdown = panel.querySelector(".amendment-form-name");

    const customWrapper = panel.querySelector(".amendment-custom-form-field");

    if (!customWrapper) {
      return;
    }

    customWrapper.hidden = !dropdown || dropdown.value !== "custom";
  }

  function extractFields(template) {
    if (Array.isArray(template.fields)) {
      return template.fields;
    }

    const fields = [];

    const expression = /\{([^}]+)\}/g;

    const text = String(template.template || "");

    let match = expression.exec(text);

    while (match !== null) {
      if (fields.indexOf(match[1]) === -1) {
        fields.push(match[1]);
      }

      match = expression.exec(text);
    }

    return fields;
  }

  function readableLabel(fieldName) {
    return String(fieldName)
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/^./, function (character) {
        return character.toUpperCase();
      });
  }

  function createDynamicField(fieldName, dataAttribute, savedValue) {
    const wrapper = document.createElement("div");

    wrapper.className = "case-field";

    const label = document.createElement("label");

    label.textContent = fieldLabels[fieldName] || readableLabel(fieldName);

    let input;

    if (multilineFields.indexOf(fieldName) !== -1) {
      input = document.createElement("textarea");

      input.rows = 3;
    } else {
      input = document.createElement("input");

      input.type = "text";
    }

    input.className =
      dataAttribute === "amendmentField"
        ? "amendment-field-input"
        : "requirement-field-input";

    input.dataset[dataAttribute] = fieldName;

    input.placeholder = "Enter " + label.textContent.toLowerCase();

    input.value = savedValue || "";

    wrapper.appendChild(label);
    wrapper.appendChild(input);

    return wrapper;
  }

  function buildAmendmentFields(panel) {
    const container = panel.querySelector(".amendment-dynamic-fields");

    if (!container) {
      return;
    }

    const oldValues = {};

    container
      .querySelectorAll("[data-amendment-field]")
      .forEach(function (field) {
        oldValues[field.dataset.amendmentField] = field.value;
      });

    container.innerHTML = "";

    const template = getSelectedAmendmentTemplate(panel);

    if (!template) {
      return;
    }

    const fields = extractFields(template).filter(function (fieldName) {
      return fieldName !== "question" && fieldName !== "form";
    });

    fields.forEach(function (fieldName) {
      container.appendChild(
        createDynamicField(fieldName, "amendmentField", oldValues[fieldName]),
      );
    });
  }
function buildGlobalAmendmentFields() {
  const dropdown = document.getElementById("globalAmendmentTemplate");

  const container = document.getElementById("globalAmendmentFields");

  if (!dropdown || !container) {
    return;
  }

  const oldValues = {};

  container
    .querySelectorAll("[data-amendment-field]")
    .forEach(function (field) {
      oldValues[field.dataset.amendmentField] = field.value;
    });

  container.innerHTML = "";

  const template = amendmentTemplates[dropdown.value];

  if (!template) {
    return;
  }

  const fields = extractFields(template).filter(function (fieldName) {
    return fieldName !== "question" && fieldName !== "form";
  });

  fields.forEach(function (fieldName) {
    container.appendChild(
      createDynamicField(fieldName, "amendmentField", oldValues[fieldName]),
    );
  });
}

function buildGlobalRequirementFields() {
  const dropdown = document.getElementById("globalRequirementTemplate");

  const container = document.getElementById("globalRequirementFields");

  if (!dropdown || !container) {
    return;
  }

  const oldValues = {};

  container
    .querySelectorAll("[data-requirement-field]")
    .forEach(function (field) {
      oldValues[field.dataset.requirementField] = field.value;
    });

  container.innerHTML = "";

  const template = requirementTemplates[dropdown.value];

  if (!template) {
    return;
  }

  extractFields(template).forEach(function (fieldName) {
    container.appendChild(
      createDynamicField(fieldName, "requirementField", oldValues[fieldName]),
    );
  });
  }
  function getGlobalAmendmentValues() {
    const values = {
      question: "",
      form: "",
    };

    const formDropdown = document.getElementById("globalAmendmentForm");

    const questionInput = document.getElementById("globalQuestion");

    if (formDropdown) {
      values.form = formDropdown.value.trim();
    }

    if (questionInput) {
      values.question = questionInput.value.trim();
    }

    document
      .querySelectorAll("#globalAmendmentFields [data-amendment-field]")
      .forEach(function (field) {
        values[field.dataset.amendmentField] = field.value.trim();
      });

    return values;
  }

  function getGlobalRequirementValues() {
    const values = {};

    document
      .querySelectorAll("#globalRequirementFields [data-requirement-field]")
      .forEach(function (field) {
        values[field.dataset.requirementField] = field.value.trim();
      });

    return values;
  }

  function generateGlobalSidebarOutputs() {
    const amendmentDropdown = document.getElementById(
      "globalAmendmentTemplate",
    );

    const amendmentOutput = document.getElementById("globalGeneratedAmendment");

    if (amendmentOutput) {
      const amendmentTemplate =
        amendmentDropdown && amendmentDropdown.value
          ? amendmentTemplates[amendmentDropdown.value]
          : null;

      amendmentOutput.value = amendmentTemplate
        ? applyTemplate(amendmentTemplate.template, getGlobalAmendmentValues())
        : "";

      amendmentOutput.placeholder = amendmentOutput.value
        ? ""
        : "Select an amendment template.";
    }

    const requirementDropdown = document.getElementById(
      "globalRequirementTemplate",
    );

    const requirementOutput = document.getElementById(
      "globalGeneratedRequirement",
    );

    if (requirementOutput) {
      const requirementTemplate =
        requirementDropdown && requirementDropdown.value
          ? requirementTemplates[requirementDropdown.value]
          : null;

      requirementOutput.value = requirementTemplate
        ? applyTemplate(
            requirementTemplate.template,
            getGlobalRequirementValues(),
          )
        : "";

      requirementOutput.placeholder = requirementOutput.value
        ? ""
        : "Select a requirement template.";
    }
  }
  function getRequirementDefaults(panel) {
    const saved = panel.dataset.requirementDefaults;

    if (!saved) {
      return {};
    }

    try {
      return JSON.parse(saved);
    } catch (error) {
      console.warn("Invalid requirement defaults:", error);

      return {};
    }
  }

  function buildRequirementFields(panel) {
    const container = panel.querySelector(".requirement-dynamic-fields");

    if (!container) {
      return;
    }

    const oldValues = {};

    container
      .querySelectorAll("[data-requirement-field]")
      .forEach(function (field) {
        oldValues[field.dataset.requirementField] = field.value;
      });

    container.innerHTML = "";

    const template = getSelectedRequirementTemplate(panel);

    if (!template) {
      return;
    }

    const defaults = getRequirementDefaults(panel);

    const fields = extractFields(template);

    fields.forEach(function (fieldName) {
      container.appendChild(
        createDynamicField(
          fieldName,
          "requirementField",
          oldValues[fieldName] || defaults[fieldName],
        ),
      );
    });
  }

  function getAmendmentValues(panel) {
    const values = {
      question: "",
      form: getFormName(panel),
    };

    const questionInput = panel.querySelector(".amendment-question");

    if (questionInput) {
      values.question = questionInput.value.trim();
    }

    panel.querySelectorAll("[data-amendment-field]").forEach(function (field) {
      values[field.dataset.amendmentField] = field.value.trim();
    });

    return values;
  }

  function getRequirementValues(panel) {
    const values = Object.assign({}, getRequirementDefaults(panel));

    panel
      .querySelectorAll("[data-requirement-field]")
      .forEach(function (field) {
        values[field.dataset.requirementField] = field.value.trim();
      });

    return values;
  }

  function applyTemplate(templateText, values) {
    let result = String(templateText || "");

    Object.keys(values).forEach(function (key) {
      const placeholder = "{" + key + "}";

      result = result.split(placeholder).join(values[key]);
    });

    return result
      .replace(/\{[^}]+\}/g, "")
      .replace(/\s+/g, " ")
      .replace(/\s+([,.:;])/g, "$1")
      .replace(/:\s*\./g, ".")
      .replace(/,\s*,/g, ",")
      .trim();
  }

  function generateAmendment(panel) {
    const template = getSelectedAmendmentTemplate(panel);

    if (!template) {
      return "";
    }

    return applyTemplate(template.template, getAmendmentValues(panel));
  }

  function generateRequirement(panel) {
    const template = getSelectedRequirementTemplate(panel);

    if (!template) {
      return "";
    }

    let wording = applyTemplate(template.template, getRequirementValues(panel));

    const notesInput = panel.querySelector(".nigo-issue");

    const notes = notesInput ? notesInput.value.trim() : "";

    if (notes) {
      wording = wording.trim() + " " + notes;

      if (!/[.!?]$/.test(wording)) {
        wording += ".";
      }
    }

    return wording.trim();
  }

  function generateOutputs(panel) {
    const amendmentOutput = panel.querySelector(".generated-amendment");

    const requirementOutput = panel.querySelector(".generated-requirement");

    if (amendmentOutput) {
      amendmentOutput.value = generateAmendment(panel);

      amendmentOutput.placeholder = amendmentOutput.value
        ? ""
        : "Select an amendment template.";
    }

    if (requirementOutput) {
      requirementOutput.value = generateRequirement(panel);

      requirementOutput.placeholder = requirementOutput.value
        ? ""
        : "Select a requirement template.";
    }
  }

  function getSavedAmendments(panel) {
    if (!panel) {
      return [];
    }

    try {
      return JSON.parse(panel.dataset.amendments || "[]");
    } catch (error) {
      console.error("Unable to read saved amendments:", error);

      return [];
    }
  }

  function saveSavedAmendments(panel, amendments) {
    panel.dataset.amendments = JSON.stringify(amendments);
  }

  function saveCurrentAmendment(panel) {
    if (!panel) {
      return;
    }

    const questionInput = panel.querySelector(".amendment-question");

    const question = questionInput ? questionInput.value.trim() : "";

    const templateDropdown = panel.querySelector(".amendment-template");

    const templateKey = templateDropdown ? templateDropdown.value : "";

    if (!question) {
      window.alert(
        "Enter the question or section before adding the amendment.",
      );

      if (questionInput) {
        questionInput.focus();
      }

      return;
    }

    if (!templateKey) {
      window.alert("Select an amendment template before adding the amendment.");

      if (templateDropdown) {
        templateDropdown.focus();
      }

      return;
    }

    const wording = generateAmendment(panel).trim();

    if (!wording) {
      window.alert(
        "Complete the amendment fields before adding the amendment.",
      );

      return;
    }

    const amendments = getSavedAmendments(panel);

    amendments.push({
      question: question,
      formName: getFormName(panel),
      templateKey: templateKey,
      wording: wording,
    });

    saveSavedAmendments(panel, amendments);

    renderSavedAmendments(panel);
    clearAmendmentEntry(panel);

    document.dispatchEvent(
      new CustomEvent("savedAmendmentsUpdated", {
        detail: {
          panel: panel,
          count: amendments.length,
        },
      }),
    );
  }

  function renderSavedAmendments(panel) {
    const container = panel.querySelector(".saved-amendment-list");

    if (!container) {
      return;
    }

    const amendments = getSavedAmendments(panel);

    container.innerHTML = "";

    amendments.forEach(function (amendment, index) {
      const savedRow = document.createElement("div");

      savedRow.className = "saved-amendment-row";

      const savedText = document.createElement("div");

      savedText.className = "saved-amendment-text";

      const wordingPreview = document.createElement("span");

      wordingPreview.textContent = amendment.wording;

      const removeButton = document.createElement("button");

      removeButton.type = "button";

      removeButton.className = "delete-amendment";

      removeButton.dataset.index = String(index);

      removeButton.textContent = "Remove";

      savedText.appendChild(wordingPreview);

      savedRow.appendChild(savedText);

      savedRow.appendChild(removeButton);

      container.appendChild(savedRow);
    });
  }

  function removeSavedAmendment(panel, index) {
    const amendments = getSavedAmendments(panel);

    if (!Number.isInteger(index) || index < 0 || index >= amendments.length) {
      return;
    }

    amendments.splice(index, 1);

    saveSavedAmendments(panel, amendments);

    renderSavedAmendments(panel);

    document.dispatchEvent(
      new CustomEvent("savedAmendmentsUpdated", {
        detail: {
          panel: panel,
          count: amendments.length,
        },
      }),
    );
  }

  function clearAmendmentEntry(panel) {
    const questionInput = panel.querySelector(".amendment-question");

    if (questionInput) {
      questionInput.value = "";
    }

    const templateDropdown = panel.querySelector(".amendment-template");

    if (templateDropdown) {
      templateDropdown.value = "";
    }

    const dynamicContainer = panel.querySelector(".amendment-dynamic-fields");

    if (dynamicContainer) {
      dynamicContainer.innerHTML = "";
    }

    const amendmentOutput = panel.querySelector(".generated-amendment");

    if (amendmentOutput) {
      amendmentOutput.value = "";

      amendmentOutput.placeholder = "Select an amendment template.";
    }

    const status = panel.querySelector(".amendment-template-status");

    if (status) {
      status.textContent =
        Object.keys(amendmentTemplates).length + " templates available.";
    }

    if (questionInput) {
      questionInput.focus();
    }
  }
  function showEngineError(message) {
    document.querySelectorAll(".form-nigo-panel").forEach(function (panel) {
      const status = panel.querySelector(".amendment-template-status");

      if (status) {
        status.textContent = message;

        status.classList.add("error");
      }
    });
  }

  function startPanelObserver() {
    if (observerStarted) {
      return;
    }

    observerStarted = true;

    const observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        mutation.addedNodes.forEach(function (node) {
          if (node.nodeType !== 1) {
            return;
          }

          if (node.matches && node.matches(".form-nigo-panel")) {
            initializePanel(node);
          }

          if (node.querySelectorAll) {
            node.querySelectorAll(".form-nigo-panel").forEach(function (panel) {
              initializePanel(panel);
            });
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  document.addEventListener("nigoPanelOpened", function (event) {
    const panel =
      event.detail && event.detail.panel ? event.detail.panel : null;

    if (!panel) {
      return;
    }

    if (engineLoaded) {
      initializePanel(panel);
    }
  });

  document.addEventListener("change", function (event) {
    const panel = event.target.closest(".form-nigo-panel");

    if (!panel) {
      return;
    }

    if (event.target.matches(".amendment-form-name")) {
      updateCustomFormVisibility(panel);

      generateOutputs(panel);
      return;
    }

    if (event.target.matches(".amendment-template")) {
      buildAmendmentFields(panel);
      generateOutputs(panel);
      return;
    }

    if (event.target.matches(".requirement-template")) {
      panel.dataset.requirementDefaults = JSON.stringify({});

      buildRequirementFields(panel);
      generateOutputs(panel);
      return;
    }

    generateOutputs(panel);
  });

  document.addEventListener("input", function (event) {
    const panel = event.target.closest(".form-nigo-panel");

    if (!panel) {
      return;
    }

    if (event.target.matches(".amendment-question")) {
      applyQuestionMapping(panel);
    }

    generateOutputs(panel);
  });
  document.addEventListener("click", function (event) {
    const saveButton = event.target.closest(".save-amendment");

    if (saveButton) {
      const panel = saveButton.closest(".form-nigo-panel");

      saveCurrentAmendment(panel);

      return;
    }

    const deleteButton = event.target.closest(".delete-amendment");

    if (deleteButton) {
      const panel = deleteButton.closest(".form-nigo-panel");

      const index = Number(deleteButton.dataset.index);

      removeSavedAmendment(panel, index);
    }
  });


  function startEngine() {
    loadEngineData();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startEngine, {
      once: true,
    });
  } else {
    startEngine();
  }
})();
