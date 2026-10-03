document.addEventListener("DOMContentLoaded", () => {
  /*
   * ====================================================
   * ELEMENT REFERENCES
   * ====================================================
   */

  const progressFill = document.getElementById("progressFill");

  const progressText = document.getElementById("progressText");

  const reviewWorkspace = document.querySelector(".review-workspace");

  const stepButtons = document.querySelectorAll(".step-btn");

  const requiredFormsContainer = document.getElementById("requiredForms");

  const reviewChecklistContainer = document.getElementById("reviewChecklist");

  const applicationReview = document.getElementById("applicationReview");

  const generateEmailButton = document.getElementById("generateEmail");

  const copyEmailButton = document.getElementById("copyEmail");

  const emailOutput = document.getElementById("emailOutput");

  const notesField = document.getElementById("initialReviewNotes");

  const copyNotesButton = document.getElementById("copyInitialReviewNotes");

  const notesStatus = document.getElementById("initialReviewNotesStatus");

  const saveAgeFields = document.getElementById("saveAgeFields");

  const specificDateFields = document.getElementById("specificDateFields");

  /*
   * ====================================================
   * SIDEBAR NAVIGATION
   * ====================================================
   */

  const sectionMap = [
    "caseSetupSection",
    "stateRequirements",
    "trexReview",
    "applicationReview",
    "requirementsSection",
    "amendmentsSection",
    "bingoSection",
    "emailSection",
  ];

  stepButtons.forEach((button, index) => {
    const sectionId = button.dataset.target || sectionMap[index];

    if (!sectionId) {
      return;
    }

    button.dataset.target = sectionId;

    button.addEventListener("click", () => {
      const targetSection = document.getElementById(sectionId);

      if (!targetSection) {
        console.warn(`Section not found: ${sectionId}`);

        return;
      }

      stepButtons.forEach((item) => {
        item.classList.remove("active");
      });

      button.classList.add("active");

      targetSection.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  });

  /*
   * ====================================================
   * PROGRESS TRACKING
   * ====================================================
   */

  function getTrackableCheckboxes() {
    if (!reviewWorkspace) {
      return [];
    }

    return Array.from(
      reviewWorkspace.querySelectorAll(
        'input[type="checkbox"][data-track-progress="true"]',
      ),
    );
  }

  function getReviewedStateFormCount() {
    return document.querySelectorAll(
      '.required-form-row[data-form-status="igo"], ' +
        '.required-form-row[data-form-status="nigo"]',
    ).length;
  }

  function getApplicationReviewCount() {
    return document.querySelectorAll(
      "#applicationReview .review-card[data-status]",
    ).length;
  }

  function getApplicationReviewTotal() {
    return document.querySelectorAll("#applicationReview .review-card").length;
  }

  function getStateFormTotal() {
    return document.querySelectorAll(".required-form-row").length;
  }

  function updateProgress() {
    const checkboxes = getTrackableCheckboxes();

    const completedCheckboxes = checkboxes.filter((checkbox) => {
      return checkbox.checked;
    }).length;

    const reviewedStateForms = getReviewedStateFormCount();

    const reviewedApplicationItems = getApplicationReviewCount();

    const total =
      checkboxes.length + getStateFormTotal() + getApplicationReviewTotal();

    const completed =
      completedCheckboxes + reviewedStateForms + reviewedApplicationItems;

    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

    if (progressFill) {
      progressFill.style.width = `${percentage}%`;
    }

    if (progressText) {
      progressText.textContent = `${completed} of ${total} steps complete`;
    }
  }

  function registerProgressCheckboxes() {
    if (!reviewWorkspace) {
      return;
    }

    const checkboxes = reviewWorkspace.querySelectorAll(
      'input[type="checkbox"]',
    );

    checkboxes.forEach((checkbox) => {
      checkbox.dataset.trackProgress = "true";

      if (checkbox.dataset.progressListenerAdded !== "true") {
        checkbox.addEventListener("change", updateProgress);

        checkbox.dataset.progressListenerAdded = "true";
      }
    });

    updateProgress();
  }

  const progressObserver = new MutationObserver(() => {
    registerProgressCheckboxes();
    updateProgress();
  });

  if (requiredFormsContainer) {
    progressObserver.observe(requiredFormsContainer, {
      childList: true,
      subtree: true,
    });
  }

  if (reviewChecklistContainer) {
    progressObserver.observe(reviewChecklistContainer, {
      childList: true,
      subtree: true,
    });
  }

  document.addEventListener("stateFormsUpdated", updateProgress);

  registerProgressCheckboxes();

  /*
   * ====================================================
   * APPLICATION REVIEW
   * ====================================================
   */

  if (
    applicationReview &&
    !applicationReview.querySelector(".application-review-grid")
  ) {
    applicationReview.innerHTML = `
      <h2>Application Review</h2>

      <div class="application-review-grid">

        <div
          class="review-card"
          data-review-item="Part 1"
        >
          <h3>Part 1</h3>

          <div class="review-status-buttons">
            <button
              type="button"
              class="review-status-button"
              data-status="IGO"
            >
              IGO
            </button>

            <button
              type="button"
              class="review-status-button"
              data-status="NIGO"
            >
              NIGO
            </button>

            <button
              type="button"
              class="review-status-button"
              data-status="Issue Found"
            >
              Issue Found
            </button>
          </div>
        </div>

        <div
          class="review-card"
          data-review-item="HIPAA"
        >
          <h3>HIPAA</h3>

          <div class="review-status-buttons">
            <button
              type="button"
              class="review-status-button"
              data-status="IGO"
            >
              IGO
            </button>

            <button
              type="button"
              class="review-status-button"
              data-status="NIGO"
            >
              NIGO
            </button>

            <button
              type="button"
              class="review-status-button"
              data-status="Issue Found"
            >
              Issue Found
            </button>
          </div>
        </div>

        <div
          class="review-card"
          data-review-item="Producer Statement"
        >
          <h3>Producer Statement</h3>

          <div class="review-status-buttons">
            <button
              type="button"
              class="review-status-button"
              data-status="IGO"
            >
              IGO
            </button>

            <button
              type="button"
              class="review-status-button"
              data-status="NIGO"
            >
              NIGO
            </button>

            <button
              type="button"
              class="review-status-button"
              data-status="Issue Found"
            >
              Issue Found
            </button>
          </div>
        </div>

      </div>
    `;
  }

  if (applicationReview) {
    applicationReview.addEventListener("click", (event) => {
      const selectedButton = event.target.closest(".review-status-button");

      if (!selectedButton) {
        return;
      }

      const reviewCard = selectedButton.closest(".review-card");

      if (!reviewCard) {
        return;
      }

      reviewCard.querySelectorAll(".review-status-button").forEach((button) => {
        button.classList.remove(
          "selected",
          "selected-igo",
          "selected-nigo",
          "selected-issue",
        );
      });

      selectedButton.classList.add("selected");

      const selectedStatus = selectedButton.dataset.status;

      if (selectedStatus === "IGO") {
        selectedButton.classList.add("selected-igo");
      }

      if (selectedStatus === "NIGO") {
        selectedButton.classList.add("selected-nigo");
      }

      if (selectedStatus === "Issue Found") {
        selectedButton.classList.add("selected-issue");
      }

      reviewCard.dataset.status = selectedStatus;

      updateProgress();
    });
  }

  /*
   * ====================================================
   * CASE SETUP HELPERS
   * ====================================================
   */

  function getCaseFieldValue(fieldId) {
    const field = document.getElementById(fieldId);

    return field ? String(field.value).trim() : "";
  }

  function getSelectedText(fieldId) {
    const field = document.getElementById(fieldId);

    if (!field || field.selectedIndex < 0) {
      return "";
    }

    return field.options[field.selectedIndex].text.trim();
  }

  function yesNo(value) {
    if (value === "yes") {
      return "Yes";
    }

    if (value === "no") {
      return "No";
    }

    return "Not selected";
  }

  /*
   * ====================================================
   * POLICY DATING DISPLAY
   * ====================================================
   */

  function handlePolicyDatingDisplay() {
    const policyDating = getCaseFieldValue("policyDating");

    if (saveAgeFields) {
      saveAgeFields.hidden = policyDating !== "saveAge";
    }

    if (specificDateFields) {
      specificDateFields.hidden = policyDating !== "specificDate";
    }

    if (policyDating === "saveAge") {
      calculateSaveAgeDate();
    }
  }

  /*
   * ====================================================
   * SAVE AGE HELPERS
   * ====================================================
   */

  function clearSaveAgeResults() {
    const saveAgeDate = document.getElementById("saveAgeDate");

    const eligibility = document.getElementById("saveAgeEligibility");

    const ageChangeDate = document.getElementById("ageChangeDate");

    const duration = document.getElementById("saveAgeDuration");

    const guidance = document.getElementById("saveAgeGuidance");

    const warning = document.getElementById("saveAgeEligibilityWarning");

    if (saveAgeDate) {
      saveAgeDate.value = "";
    }

    if (eligibility) {
      eligibility.value = "";

      eligibility.classList.remove(
        "save-age-eligible",
        "save-age-not-eligible",
      );
    }

    if (ageChangeDate) {
      ageChangeDate.textContent = "--";
    }

    if (duration) {
      duration.textContent = "--";
    }

    if (guidance) {
      guidance.textContent = "Enter the Save Age information.";
    }

    if (warning) {
      warning.hidden = true;
      warning.textContent = "";
    }
  }

  function isValidMonthDay(month, day) {
    if (month < 1 || month > 12 || day < 1) {
      return false;
    }

    const validationDate = new Date(2024, month - 1, day);

    return (
      validationDate.getMonth() === month - 1 &&
      validationDate.getDate() === day
    );
  }

  function parseLocalDate(value) {
    if (!value) {
      return null;
    }

    const parts = value.split("-").map(Number);

    if (parts.length !== 3) {
      return null;
    }

    const [year, month, day] = parts;

    const date = new Date(year, month - 1, day);

    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return null;
    }

    return date;
  }

  function isLeapYear(year) {
    return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  }

  function createSafeLocalDate(year, month, day) {
    if (month === 2 && day === 29 && !isLeapYear(year)) {
      return new Date(year, 1, 28);
    }

    return new Date(year, month - 1, day);
  }

  function addDays(date, numberOfDays) {
    const result = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    );

    result.setDate(result.getDate() + numberOfDays);

    return result;
  }

  function stripTime(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  function formatDisplayDate(date) {
    return new Intl.DateTimeFormat("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    }).format(date);
  }

  function getReferenceBirthYear(birthMonth, birthDay, part1Date) {
    let referenceYear = part1Date.getFullYear();

    const testBirthDate = createSafeLocalDate(
      referenceYear,
      birthMonth,
      birthDay,
    );

    const testAgeChangeDate = addDays(testBirthDate, 183);

    if (testAgeChangeDate > addDays(part1Date, 183)) {
      referenceYear -= 1;
    }

    return referenceYear;
  }

  function calculateCalendarDuration(startDate, endDate) {
    let start = stripTime(startDate);

    let end = stripTime(endDate);

    if (end < start) {
      const temporary = start;
      start = end;
      end = temporary;
    }

    let months =
      (end.getFullYear() - start.getFullYear()) * 12 +
      (end.getMonth() - start.getMonth());

    let days = end.getDate() - start.getDate();

    if (days < 0) {
      months -= 1;

      const previousMonthDays = new Date(
        end.getFullYear(),
        end.getMonth(),
        0,
      ).getDate();

      days += previousMonthDays;
    }

    return {
      totalMonths: months,
      days,
    };
  }

  function moveToPriorBusinessDay(date) {
    let adjustedDate = stripTime(date);

    if (adjustedDate.getDay() === 6) {
      adjustedDate = addDays(adjustedDate, -1);
    }

    if (adjustedDate.getDay() === 0) {
      adjustedDate = addDays(adjustedDate, -2);
    }

    return adjustedDate;
  }

  function buildEligibleGuidance(productType, exchange1035, saveAgeDate) {
    const formattedDate = formatDisplayDate(saveAgeDate);

    const parts = [`Eligible to save age using ${formattedDate}.`];

    if (exchange1035) {
      parts.push(
        "The calculation is within the four-month 1035 backdating limit.",
      );
    } else {
      parts.push("The calculation is within the six-month backdating limit.");
    }

    const saveAgeRules = {
      wholeLife: {
        offsetDays: 2,
        checkNYSE: false,
      },

      ulGuard: {
        offsetDays: 2,
        checkNYSE: false,
      },

      sulGuard: {
        offsetDays: 2,
        checkNYSE: false,
      },

      tradVantage: {
        offsetDays: 2,
        checkNYSE: false,
        additionalSubtraction: 2,
      },

      apexVul: {
        offsetDays: 2,
        checkNYSE: true,
      },

      term: {
        handledByTPP: true,
      },
    };
    const rule = saveAgeRules[productType];
    return parts.join(" ");
  }

  /*
   * ====================================================
   * SAVE AGE CALCULATION
   * ====================================================
   */

  function calculateSaveAgeDate() {
    const month = Number(getCaseFieldValue("birthMonth"));

    const day = Number(getCaseFieldValue("birthDay"));

    const part1SignDateValue = getCaseFieldValue("part1SignDate");

    const productType = getCaseFieldValue("productType");

    const caseType = getCaseFieldValue("caseType");

    const exchange1035 = getCaseFieldValue("saveAge1035") === "yes";

    const alternateAdditional = getCaseFieldValue("alternateAdditional");

    const saveAgeDateField = document.getElementById("saveAgeDate");

    const eligibilityField = document.getElementById("saveAgeEligibility");

    const ageChangeDateField = document.getElementById("ageChangeDate");

    const durationField = document.getElementById("saveAgeDuration");

    const guidanceField = document.getElementById("saveAgeGuidance");

    const messageField = document.getElementById("saveAgeMessage");

    const warningField = document.getElementById("saveAgeEligibilityWarning");

    clearSaveAgeResults();

    if (!month || !day || !part1SignDateValue) {
      if (messageField) {
        messageField.textContent =
          "Enter the insured's birth month and day and the Part 1 signature date.";
      }

      return;
    }

    if (!isValidMonthDay(month, day)) {
      if (eligibilityField) {
        eligibilityField.value = "Invalid Birth Date";
      }

      if (messageField) {
        messageField.textContent = "Enter a valid birth month and day.";
      }

      return;
    }

    if (
      alternateAdditional === "alternate" ||
      alternateAdditional === "additional" ||
      alternateAdditional === "both"
    ) {
      if (eligibilityField) {
        eligibilityField.value = "Manual Review Required";
      }

      if (warningField) {
        warningField.hidden = false;

        warningField.textContent =
          "Do not use the calculator when an alternate or additional policy is involved. Review the Save Age procedure and ensure all policies use the same policy date.";
      }

      if (guidanceField) {
        guidanceField.textContent = "Refer for manual Save Age review.";
      }

      generateInitialReviewNotes();
      return;
    }

    if (productType === "term") {
      if (eligibilityField) {
        eligibilityField.value = "Use TPP";
      }

      if (guidanceField) {
        guidanceField.textContent =
          "Select the Save Age option in TPP. TPP will generate the required date.";
      }

      if (messageField) {
        messageField.textContent =
          "The manual Save Age date is not calculated for Term.";
      }

      generateInitialReviewNotes();
      return;
    }

    const part1SignDate = parseLocalDate(part1SignDateValue);

    if (!part1SignDate) {
      if (eligibilityField) {
        eligibilityField.value = "Invalid Date";
      }

      if (messageField) {
        messageField.textContent = "Enter a valid Part 1 signature date.";
      }

      return;
    }

    const birthReferenceYear = getReferenceBirthYear(month, day, part1SignDate);

    const birthReferenceDate = createSafeLocalDate(
      birthReferenceYear,
      month,
      day,
    );

    const ageChangeDate = addDays(birthReferenceDate, 183);

    const baseDaysToSubtract = caseType === "conversion" ? 1 : 2;

    let saveAgeDate = addDays(ageChangeDate, -baseDaysToSubtract);

    if (productType === "apexVul") {
      saveAgeDate = moveToPriorBusinessDay(saveAgeDate);
    }

    const originalSaveAgeDay = saveAgeDate.getDate();

    let premiumDateCorrected = false;

    if (originalSaveAgeDay > 28) {
      saveAgeDate.setDate(28);

      premiumDateCorrected = true;
    }

    const duration = calculateCalendarDuration(saveAgeDate, part1SignDate);

    const maximumMonths = exchange1035 ? 4 : 6;

    const withinBackdateLimit =
      duration.totalMonths < maximumMonths ||
      (duration.totalMonths === maximumMonths && duration.days === 0);

    const saveAgeIsFuture = stripTime(saveAgeDate) > stripTime(new Date());

    const eligible = withinBackdateLimit && !saveAgeIsFuture;

    if (saveAgeDateField) {
      saveAgeDateField.value = formatDisplayDate(saveAgeDate);
    }

    if (ageChangeDateField) {
      ageChangeDateField.textContent = formatDisplayDate(ageChangeDate);
    }

    if (durationField) {
      durationField.textContent =
        `${duration.totalMonths} month` +
        `${duration.totalMonths === 1 ? "" : "s"} and ` +
        `${duration.days} day` +
        `${duration.days === 1 ? "" : "s"}`;
    }

    if (eligible) {
      if (eligibilityField) {
        eligibilityField.value = "YES";

        eligibilityField.classList.remove("save-age-not-eligible");

        eligibilityField.classList.add("save-age-eligible");
      }

      if (guidanceField) {
        guidanceField.textContent = buildEligibleGuidance(
          productType,
          exchange1035,
          saveAgeDate,
        );
      }
    } else {
      if (eligibilityField) {
        eligibilityField.value = "NO, Agency confirmation Required";

        eligibilityField.classList.remove("save-age-eligible");

        eligibilityField.classList.add("save-age-not-eligible");
      }

      if (guidanceField) {
        if (saveAgeIsFuture) {
          guidanceField.textContent =
            "Save Age should not be used because the calculated date is in the future.";
        } else if (exchange1035) {
          guidanceField.textContent =
            "The backdating period exceeds the four-month limit for a 1035 exchange.";
        } else {
          guidanceField.textContent =
            "The backdating period exceeds six months. Clarification, exception review, or management approval may be required.";
        }
      }
    }

    const messages = [];

    if (premiumDateCorrected) {
      messages.push(
        "The calculated date fell on the 29th, 30th, or 31st. The premium due date was adjusted to the 28th.",
      );
    }

    if (productType === "apexVul") {
      messages.push(
        "Apex VUL dates falling on a weekend were moved to the prior business day. Confirm the adjusted date is not an NYSE-closed date.",
      );
    }

    if (productType === "ulGuard") {
      messages.push("Use the resulting Save Age date for UL Guard.");
    }

    if (productType === "sulGuard") {
      messages.push("Use the resulting Save Age date for SUL Guard.");
    }

    if (productType === "tradVantage") {
      messages.push(
        caseType === "conversion"
          ? "The Conversion Save Age calculation uses the applicable one-day adjustment."
          : "The New Business Save Age calculation uses the applicable two-day adjustment.",
      );
    }

    if (messageField) {
      messageField.textContent =
        messages.length > 0
          ? messages.join(" ")
          : "Save Age calculation completed.";
    }

    generateInitialReviewNotes();
  }

  /*
   * ====================================================
   * POLICY DATING TEXT
   * ====================================================
   */

  function getPolicyDatingText() {
    const policyDating = getCaseFieldValue("policyDating");

    if (policyDating === "saveAge") {
      const calculatedDate = getCaseFieldValue("saveAgeDate");

      return calculatedDate ? `Save Age, ${calculatedDate}` : "Save Age";
    }

    if (policyDating === "currentDate") {
      return "Current Date";
    }

    if (policyDating === "specificDate") {
      const specificDate = getCaseFieldValue("specificPolicyDate");

      return specificDate ? `Specific Date, ${specificDate}` : "Specific Date";
    }

    return "Not selected";
  }

  /*
   * ====================================================
   * ILLUSTRATION
   * ====================================================
   */

  function getIllustrationText() {
    const state = getCaseFieldValue("contractState");

    const status = getCaseFieldValue("illustrationStatus");

    const requirementText =
      state === "NY"
        ? "Required for New York"
        : "Nice to have for this contract state";

    let statusText = "Not selected";

    if (status === "yes") {
      statusText = "Signed illustration received as applied for";
    }

    if (status === "no") {
      statusText = "Signed illustration does not match the application";
    }

    if (status === "notReceived") {
      statusText = "Signed illustration not received";
    }

    return `${statusText}. ` + `${requirementText}.`;
  }

  function updateIllustrationGuidance() {
    const guidance = document.getElementById("illustrationGuidance");

    if (!guidance) {
      return;
    }

    const state = getCaseFieldValue("contractState");

    if (state === "NY") {
      guidance.textContent =
        "A signed matching illustration is required for New York policies.";

      guidance.classList.add("required-guidance");
    } else if (state) {
      guidance.textContent =
        "A signed illustration is recommended for this contract state.";

      guidance.classList.remove("required-guidance");
    } else {
      guidance.textContent = "";

      guidance.classList.remove("required-guidance");
    }
  }

  /*
   * ====================================================
   * INITIAL REVIEW NOTES
   * ====================================================
   */

  function generateInitialReviewNotes() {
    if (!notesField) {
      return;
    }

    const insured = getCaseFieldValue("insuredName") || "[Insured Name]";

    const purpose =
      getCaseFieldValue("purposeOfInsurance") || "[Purpose of Insurance]";

    const riskClass = getCaseFieldValue("riskClass") || "[Risk Class]";

    const replacement = yesNo(getCaseFieldValue("replacement"));

    const owner = getSelectedText("ownerType") || "Not selected";

    const beneficiary = getSelectedText("beneficiaryOther") || "Not selected";

    const tlir = yesNo(getCaseFieldValue("tlirRequested"));

    const product = getSelectedText("productType") || "Not selected";

    const alternateAdditional =
      getSelectedText("alternateAdditional") || "None";

    const polaris = getSelectedText("polarisCheck") || "Not selected";

    const caseType = getSelectedText("caseType") || "Not selected";

    const sourceOfFunds =
      getCaseFieldValue("sourceOfFundsRequired") === "yes"
        ? "Source of Funds Questionnaire required"
        : "Source of Funds Questionnaire not required";

    const saveAgeEligibility = getCaseFieldValue("saveAgeEligibility");

    const saveAgeDate = getCaseFieldValue("saveAgeDate");

    const saveAgeDuration =
      document.getElementById("saveAgeDuration")?.textContent?.trim() || "";

    const saveAgeGuidance =
      document.getElementById("saveAgeGuidance")?.textContent?.trim() || "";

    const notes = [
      `Insured: ${insured}`,
      `Purpose of Insurance: ${purpose}`,
      `Applied Risk Class: ${riskClass}`,
      `Policy Dating: ${getPolicyDatingText()}`,
      `Illustration Info: ${getIllustrationText()}`,
      "",
      `Replacement: ${replacement}`,
      `Owner: ${owner}`,
      `Beneficiary: ${beneficiary}`,
      `TLIR Requested: ${tlir}`,
      `Product: ${product}`,
      `Case Type: ${caseType}`,
      `Alternate Cases: ${alternateAdditional}`,
      `Polaris Check: ${polaris}`,
      sourceOfFunds,
    ];

    if (getCaseFieldValue("policyDating") === "saveAge") {
      notes.push("");
      notes.push("Save Age Information:");

      notes.push(`Save Age Date: ${saveAgeDate || "Not calculated"}`);

      notes.push(
        `Save Age Eligibility: ${saveAgeEligibility || "Not calculated"}`,
      );

      notes.push(
        `Backdating Duration: ${
          saveAgeDuration && saveAgeDuration !== "--"
            ? saveAgeDuration
            : "Not calculated"
        }`,
      );

      if (
        saveAgeGuidance &&
        saveAgeGuidance !== "Enter the Save Age information."
      ) {
        notes.push(`Save Age Guidance: ${saveAgeGuidance}`);
      }
    }

    notesField.value = notes.join("\n");
  }

  /*
   * ====================================================
   * CASE SETUP FIELD LISTENERS
   * ====================================================
   */

  const caseSetupFieldIds = [
    "policyNumber",
    "insuredName",
    "contractState",
    "replacement",
    "ownerType",
    "beneficiaryOther",
    "tlirRequested",
    "productType",
    "caseType",
    "purposeOfInsurance",
    "riskClass",
    "policyDating",
    "illustrationStatus",
    "alternateAdditional",
    "polarisCheck",
    "additionalInsured",
    "foreignActivity",
    "internalTermReplacement",
    "billingType",
    "paperPart2Required",
    "sourceOfFundsRequired",
    "suitabilityQuestionnaireRequired",
    "birthMonth",
    "birthDay",
    "specificPolicyDate",
    "part1SignDate",
    "saveAge1035",
  ];

  function handleCaseSetupChange() {
    handlePolicyDatingDisplay();
    updateIllustrationGuidance();
    generateInitialReviewNotes();
  }

  caseSetupFieldIds.forEach((fieldId) => {
    const field = document.getElementById(fieldId);

    if (!field) {
      return;
    }

    field.addEventListener("input", handleCaseSetupChange);

    field.addEventListener("change", handleCaseSetupChange);
  });

  /*
   * ====================================================
   * COPY INITIAL REVIEW NOTES
   * ====================================================
   */

  if (copyNotesButton) {
    copyNotesButton.addEventListener("click", async () => {
      if (!notesField || !notesField.value.trim()) {
        return;
      }

      try {
        await navigator.clipboard.writeText(notesField.value);

        if (notesStatus) {
          notesStatus.textContent = "Initial Review Notes copied.";
        }
      } catch (error) {
        notesField.select();
        document.execCommand("copy");

        if (notesStatus) {
          notesStatus.textContent = "Initial Review Notes copied.";
        }
      }
    });
  }

  /*
   * ====================================================
   * REVIEWED STATE FORMS
   * ====================================================
   */

  function getReviewedStateForms() {
    const reviewedRows = document.querySelectorAll(
      '.required-form-row[data-form-status="igo"], ' +
        '.required-form-row[data-form-status="nigo"]',
    );

    return Array.from(reviewedRows).map((row) => {
      const formId =
        row.dataset.formId ||
        row.querySelector(".state-form-id")?.textContent?.trim() ||
        "Reviewed form";

      const status = row.dataset.formStatus?.toUpperCase() || "REVIEWED";

      return `${formId}: ${status}`;
    });
  }

  /*
   * ====================================================
   * APPLICATION REVIEW RESULTS
   * ====================================================
   */

  function getApplicationReviewResults() {
    const cards = document.querySelectorAll("#applicationReview .review-card");

    return Array.from(cards)
      .filter((card) => {
        return card.dataset.status;
      })
      .map((card) => {
        const item = card.dataset.reviewItem || "Review item";

        return `${item}: ` + `${card.dataset.status}`;
      });
  }

  /*
   * ====================================================
   * BINGO
   * ====================================================
   */

  function getSelectedBingoStatus() {
    const selectedStatus = document.querySelector(
      'input[name="bingo"]:checked',
    );

    return selectedStatus ? selectedStatus.value : "";
  }

  /*
   * ====================================================
   * EMAIL GENERATOR
   * ====================================================
   */

  function generateInitialReviewEmail() {
    if (!emailOutput) {
      return;
    }

    const insuredName = getCaseFieldValue("insuredName") || "[Insured Name]";

    const policyNumber = getCaseFieldValue("policyNumber") || "[Policy Number]";

    const contractState =
      getCaseFieldValue("contractState") || "[Contract State]";

    const system = getCaseFieldValue("system") || "[System]";

    const signatureMethod =
      getCaseFieldValue("signatureMethod") || "[Signature Method]";

    const purpose =
      getCaseFieldValue("purposeOfInsurance") || "[Purpose of Insurance]";

    const riskClass = getCaseFieldValue("riskClass") || "[Risk Class]";

    const policyDating = getPolicyDatingText();

    const illustration = getIllustrationText();

    const alternateAdditional =
      getSelectedText("alternateAdditional") || "None";

    const polarisCheck = getSelectedText("polarisCheck") || "Not selected";

    const bingoStatus = getSelectedBingoStatus() || "[Not Selected]";

    const reviewedForms = getReviewedStateForms();

    const applicationResults = getApplicationReviewResults();

    let email = "";

    email += `${insuredName} | ${policyNumber}\n\n`;

    email +=
      "Thank you for submitting the above referenced life application. " +
      "The initial review has been completed.\n\n";

    email += "Case Information:\n";

    email += `• Contract State: ${contractState}\n`;

    email += `• System: ${system}\n`;

    email += `• Signature Method: ${signatureMethod}\n\n`;

    email += "State Forms Reviewed:\n";

    if (reviewedForms.length > 0) {
      email += reviewedForms
        .map((form) => {
          return `• ${form}`;
        })
        .join("\n");
    } else {
      email += "• No state forms reviewed.";
    }

    email += "\n\nApplication Review:\n";

    if (applicationResults.length > 0) {
      email += applicationResults
        .map((result) => {
          return `• ${result}`;
        })
        .join("\n");
    } else {
      email += "• No application review results selected.";
    }

    email += "\n\nInitial Review Notes:\n";

    email += `• Purpose of Insurance: ${purpose}\n`;

    email += `• Applied Risk Class: ${riskClass}\n`;

    email += `• Policy Dating: ${policyDating}\n`;

    email += `• Illustration: ${illustration}\n`;

    email += `• Alternate / Additional: ${alternateAdditional}\n`;

    email += `• Polaris Check: ${polarisCheck}\n`;

    email += `• BINGO Status: ${bingoStatus}`;

    emailOutput.value = email;
  }

  if (generateEmailButton) {
    generateEmailButton.addEventListener("click", generateInitialReviewEmail);
  }

  if (copyEmailButton) {
    copyEmailButton.addEventListener("click", async () => {
      if (!emailOutput || !emailOutput.value.trim()) {
        return;
      }

      try {
        await navigator.clipboard.writeText(emailOutput.value);

        const originalText = copyEmailButton.textContent;

        copyEmailButton.textContent = "Copied";

        setTimeout(() => {
          copyEmailButton.textContent = originalText;
        }, 1500);
      } catch (error) {
        emailOutput.select();
        document.execCommand("copy");

        console.error(
          "Unable to use Clipboard API. Fallback copy attempted.",
          error,
        );
      }
    });
  }

  /*
   * ====================================================
   * INITIAL PAGE SETUP
   * ====================================================
   */

  handlePolicyDatingDisplay();
  updateIllustrationGuidance();
  generateInitialReviewNotes();
  updateProgress();
});
function cleanGeneratedAmendment(text) {
  return text
    .replace(/\{[^}]+\}/g, "")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.])/g, "$1")
    .trim();
}
function getProductAndSystemFromPolicy(policyNumber) {
  const prefix = String(policyNumber || "")
    .replace(/\D/g, "")
    .substring(0, 2);

  switch (prefix) {
    // Whole Life
    case "21":
    case "32":
    case "34":
      return {
        product: "Whole Life",
        system: "WinRisk",
      };

    // Vantage Term
    case "38":
    case "42":
      return {
        product: "Vantage Term",
        system: "TPP",
      };

    // CareChoice
    case "22":
      return {
        product: "CareChoice",
        system: "WinRisk",
      };

    // VUL Guard
    case "15":
    case "16":
      return {
        product: "VUL Guard",
        system: "WinRisk",
      };

    default:
      return {
        product: "",
        system: "",
      };
  }
}
function updatePolicyLookup() {
  if (!policyNumberField) {
    return;
  }

  const policyNumber = String(policyNumberField.value || "").replace(/\D/g, "");

  const prefix = policyNumber.substring(0, 2);

  let product = "--";

  switch (prefix) {
    case "21":
    case "32":
    case "34":
      product = "Whole Life";
      break;

    case "38":
    case "42":
      product = "Vantage Term";
      break;

    case "22":
      product = "CareChoice";
      break;

    case "15":
    case "16":
      product = "VUL Guard";
      break;
  }

  const dashboardProduct = document.getElementById("dashboardProduct");

  if (dashboardProduct) {
    dashboardProduct.textContent = product;
  }

  generateInitialReviewNotes();
}

const policyLookupField = document.getElementById("policyNumber");

function updatePolicyLookup() {
  if (!policyLookupField) {
    return;
  }

  const policyNumber = String(policyLookupField.value || "").replace(/\D/g, "");

  const prefix = policyNumber.substring(0, 2);

  let product = "--";

  switch (prefix) {
    case "21":
    case "32":
    case "34":
      product = "Whole Life";
      break;

    case "38":
    case "42":
      product = "Vantage Term";
      break;

    case "22":
      product = "CareChoice";
      break;

    case "15":
    case "16":
      product = "VUL Guard";
      break;
  }

  const dashboardProduct = document.getElementById("dashboardProduct");

  if (dashboardProduct) {
    dashboardProduct.textContent = product;
  }
}

if (policyLookupField) {
  policyLookupField.addEventListener("input", updatePolicyLookup);
}