(() => {
  const STORAGE_KEY = "orbit.applications.v1";
  const statuses = ["Applied", "Interview", "Offer", "Rejected"];
  const sampleApplications = [
    {
      id: "sample-stripe",
      company: "Stripe",
      role: "Software Engineer Intern",
      status: "Applied",
      date: "2026-11-06",
      link: "https://stripe.com/jobs",
    },
    {
      id: "sample-notion",
      company: "Notion",
      role: "Product Engineering Intern",
      status: "Interview",
      date: "2026-11-03",
      link: "https://www.notion.so/careers",
    },
    {
      id: "sample-google",
      company: "Google",
      role: "Software Engineering Intern, Summer 2027",
      status: "Offer",
      date: "2026-10-28",
      link: "https://www.google.com/about/careers/applications/",
    },
  ];

  const elements = {
    applicationGrid: document.querySelector("#application-grid"),
    totalCount: document.querySelector("#total-count"),
    interviewCount: document.querySelector("#interview-count"),
    offerCount: document.querySelector("#offer-count"),
    navCount: document.querySelector("#nav-count"),
    boardTotal: document.querySelector("#board-total"),
    filterAllCount: document.querySelector("#filter-all-count"),
    todayDate: document.querySelector("#today-date"),
    searchInput: document.querySelector("#search-input"),
    filterTabs: [...document.querySelectorAll(".filter-tab")],
    modal: document.querySelector("#modal-backdrop"),
    modalTitle: document.querySelector("#modal-title"),
    form: document.querySelector("#application-form"),
    formError: document.querySelector("#form-error"),
    idInput: document.querySelector("#application-id"),
    companyInput: document.querySelector("#company-input"),
    roleInput: document.querySelector("#role-input"),
    statusInput: document.querySelector("#status-input"),
    dateInput: document.querySelector("#date-input"),
    linkInput: document.querySelector("#link-input"),
    saveLabel: document.querySelector("#save-button-label"),
    savedIndicator: document.querySelector(".saved-indicator"),
  };

  let applications = loadApplications();
  let activeFilter = "All";
  let lastFocusedElement = null;

  function localDateString(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function loadApplications() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === null) {
        return sampleApplications.map((application) => ({ ...application }));
      }

      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) {
        throw new TypeError("Saved applications are not a list.");
      }
      return parsed.filter(isValidApplication);
    } catch (error) {
      console.error("Could not read saved applications.", error);
      setSaveState(false, "Saved data could not be read. Changes may not persist.");
      return sampleApplications.map((application) => ({ ...application }));
    }
  }

  function isValidApplication(application) {
    return (
      application &&
      typeof application.id === "string" &&
      typeof application.company === "string" &&
      typeof application.role === "string" &&
      statuses.includes(application.status) &&
      typeof application.date === "string" &&
      typeof application.link === "string"
    );
  }

  function saveApplications() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(applications));
      setSaveState(true, "Changes saved automatically.");
      return true;
    } catch (error) {
      console.error("Could not save applications.", error);
      setSaveState(false, "Could not save changes. Check your browser storage settings.");
      return false;
    }
  }

  function setSaveState(saved, message) {
    if (!elements.savedIndicator) return;
    elements.savedIndicator.title = message;
    elements.savedIndicator.setAttribute("aria-label", message);
    elements.savedIndicator.classList.toggle("save-error", !saved);
    elements.savedIndicator.querySelector("span:last-child").textContent = saved
      ? "Saved automatically"
      : "Save unavailable";
  }

  function formatDate(dateString) {
    if (!dateString) return "Date not set";
    const date = new Date(`${dateString}T12:00:00`);
    if (Number.isNaN(date.getTime())) return "Date not set";
    return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date);
  }

  function getSafeLink(value) {
    if (!value) return null;
    try {
      const url = new URL(value);
      return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
    } catch {
      return null;
    }
  }

  function statusClass(status) {
    return `status-${status.toLowerCase()}`;
  }

  function companyClass(company) {
    const normalized = company.toLowerCase();
    if (normalized.includes("amazon")) return "logo-amazon";
    if (normalized.includes("notion")) return "logo-notion";
    if (normalized.includes("stripe")) return "logo-stripe";
    if (normalized.includes("google")) return "logo-google";
    if (normalized.includes("figma")) return "logo-figma";
    return "";
  }

  function makeIcon(pathMarkup) {
    const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    icon.setAttribute("viewBox", "0 0 20 20");
    icon.setAttribute("aria-hidden", "true");
    icon.innerHTML = pathMarkup;
    return icon;
  }

  function createApplicationCard(application) {
    const card = document.createElement("article");
    card.className = "application-card";

    const top = document.createElement("div");
    top.className = "card-top";
    const lockup = document.createElement("div");
    lockup.className = "company-lockup";
    const logo = document.createElement("div");
    logo.className = `company-logo ${companyClass(application.company)}`.trim();
    logo.setAttribute("aria-hidden", "true");
    logo.textContent = application.company.trim().slice(0, 1).toUpperCase() || "?";
    const company = document.createElement("span");
    company.className = "company-name";
    company.textContent = application.company;
    lockup.append(logo, company);

    const actions = document.createElement("div");
    actions.className = "card-menu";
    const edit = document.createElement("button");
    edit.className = "card-action";
    edit.type = "button";
    edit.setAttribute("aria-label", `Edit ${application.company} application`);
    edit.title = "Edit application";
    edit.append(makeIcon('<path d="m12.8 4.2 3 3M4 16l.7-3.1L13.9 3.7a1.8 1.8 0 0 1 2.5 2.5l-9.2 9.2L4 16Z"/><path d="M10.5 16H16"/>'));
    edit.addEventListener("click", () => openModal(application));
    const remove = document.createElement("button");
    remove.className = "card-action delete-action";
    remove.type = "button";
    remove.setAttribute("aria-label", `Delete ${application.company} application`);
    remove.title = "Delete application";
    remove.append(makeIcon('<path d="M4.5 6h11M8 6V4h4v2m2 0-.6 9.5H6.6L6 6m3 3v4m2-4v4"/>'));
    remove.addEventListener("click", () => deleteApplication(application.id));
    actions.append(edit, remove);
    top.append(lockup, actions);

    const role = document.createElement("p");
    role.className = "role-name";
    role.textContent = application.role;
    const divider = document.createElement("div");
    divider.className = "card-divider";
    const meta = document.createElement("div");
    meta.className = "card-meta";
    const badge = document.createElement("span");
    badge.className = `status-badge ${statusClass(application.status)}`;
    badge.textContent = application.status;
    const date = document.createElement("span");
    date.className = "date-label";
    date.textContent = formatDate(application.date);
    meta.append(badge, date);
    card.append(top, role, divider, meta);

    const safeLink = getSafeLink(application.link);
    if (safeLink) {
      const link = document.createElement("a");
      link.className = "card-link";
      link.href = safeLink;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.append(document.createTextNode("View job posting"), makeIcon('<path d="M11 4h5v5M9 11l7-7"/><path d="M14 11v4.5a1.5 1.5 0 0 1-1.5 1.5h-8A1.5 1.5 0 0 1 3 15.5v-8A1.5 1.5 0 0 1 4.5 6H9"/>'));
      card.append(link);
    }

    return card;
  }

  function createColumn(status, items) {
    const column = document.createElement("section");
    column.className = `status-column ${statusClass(status)}`;
    column.setAttribute("aria-label", `${status} applications`);
    const heading = document.createElement("div");
    heading.className = "column-heading";
    const dot = document.createElement("span");
    dot.className = "column-dot";
    const label = document.createElement("span");
    label.textContent = status;
    const count = document.createElement("span");
    count.className = "column-count";
    count.textContent = String(items.length);
    heading.append(dot, label, count);
    const list = document.createElement("div");
    list.className = "application-list";

    if (items.length) {
      items.forEach((application) => list.append(createApplicationCard(application)));
    } else {
      const empty = document.createElement("div");
      empty.className = "empty-column";
      empty.textContent = "No applications yet";
      list.append(empty);
    }
    column.append(heading, list);
    return column;
  }

  function render() {
    const query = elements.searchInput.value.trim().toLocaleLowerCase();
    const matching = applications
      .filter((application) => {
        const matchesFilter = activeFilter === "All" || application.status === activeFilter;
        const searchable = `${application.company} ${application.role} ${application.status}`.toLocaleLowerCase();
        return matchesFilter && searchable.includes(query);
      })
      .sort((a, b) => b.date.localeCompare(a.date));
    const allCount = applications.length;
    elements.totalCount.textContent = String(allCount);
    elements.navCount.textContent = String(allCount);
    elements.boardTotal.textContent = String(matching.length);
    elements.filterAllCount.textContent = String(allCount);
    elements.interviewCount.textContent = String(applications.filter((application) => application.status === "Interview").length);
    elements.offerCount.textContent = String(applications.filter((application) => application.status === "Offer").length);

    elements.applicationGrid.replaceChildren();
    if (matching.length === 0) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      const icon = document.createElement("span");
      icon.className = "empty-state-icon";
      icon.setAttribute("aria-hidden", "true");
      icon.textContent = query ? "⌕" : "✳";
      const title = document.createElement("h3");
      title.textContent = query ? "No matches found" : "Your next opportunity starts here";
      const copy = document.createElement("p");
      copy.textContent = query
        ? "Try another company, role, or status."
        : "Add an application to start building your board.";
      empty.append(icon, title, copy);
      if (!query && activeFilter === "All") {
        const addButton = document.createElement("button");
        addButton.className = "button button-primary";
        addButton.type = "button";
        addButton.textContent = "Add your first application";
        addButton.addEventListener("click", () => openModal());
        empty.append(addButton);
      }
      elements.applicationGrid.append(empty);
      return;
    }

    const visibleStatuses = activeFilter === "All" ? statuses : [activeFilter];
    visibleStatuses.forEach((status) => {
      const items = matching.filter((application) => application.status === status);
      elements.applicationGrid.append(createColumn(status, items));
    });
  }

  function setActiveFilter(filter) {
    activeFilter = filter;
    elements.filterTabs.forEach((tab) => {
      const isActive = tab.dataset.filter === filter;
      tab.classList.toggle("active", isActive);
      tab.setAttribute("aria-selected", String(isActive));
    });
    render();
  }

  function openModal(application = null) {
    lastFocusedElement = document.activeElement;
    elements.form.reset();
    elements.formError.textContent = "";
    elements.idInput.value = application?.id ?? "";
    elements.companyInput.value = application?.company ?? "";
    elements.roleInput.value = application?.role ?? "";
    elements.statusInput.value = application?.status ?? "Applied";
    elements.dateInput.value = application?.date ?? localDateString();
    elements.linkInput.value = application?.link ?? "";
    elements.modalTitle.textContent = application ? "Edit application" : "Add an application";
    elements.saveLabel.textContent = application ? "Save changes" : "Save application";
    elements.modal.hidden = false;
    document.body.style.overflow = "hidden";
    elements.companyInput.focus();
  }

  function closeModal() {
    elements.modal.hidden = true;
    document.body.style.overflow = "";
    if (lastFocusedElement instanceof HTMLElement) lastFocusedElement.focus();
  }

  function validateLink(value) {
    if (!value) return "";
    const safeLink = getSafeLink(value);
    return safeLink || null;
  }

  function handleSubmit(event) {
    event.preventDefault();
    elements.formError.textContent = "";
    const linkValue = elements.linkInput.value.trim();
    const safeLink = validateLink(linkValue);
    if (safeLink === null) {
      elements.formError.textContent = "Enter a valid link that starts with http:// or https://.";
      elements.linkInput.focus();
      return;
    }

    const application = {
      id: elements.idInput.value || (crypto.randomUUID?.() ?? `application-${Date.now()}`),
      company: elements.companyInput.value.trim(),
      role: elements.roleInput.value.trim(),
      status: elements.statusInput.value,
      date: elements.dateInput.value || localDateString(),
      link: safeLink,
    };

    if (!application.company || !application.role) {
      elements.formError.textContent = "Add both a company and role to save this application.";
      return;
    }
    if (!statuses.includes(application.status)) {
      elements.formError.textContent = "Choose a valid application status.";
      return;
    }

    const existingIndex = applications.findIndex((item) => item.id === application.id);
    if (existingIndex >= 0) {
      applications[existingIndex] = application;
    } else {
      applications.push(application);
    }
    saveApplications();
    closeModal();
    render();
  }

  function deleteApplication(id) {
    const application = applications.find((item) => item.id === id);
    if (!application) return;
    if (!window.confirm(`Delete the ${application.company} application? This cannot be undone.`)) return;
    applications = applications.filter((item) => item.id !== id);
    saveApplications();
    render();
  }

  document.querySelector("#open-modal").addEventListener("click", () => openModal());
  document.querySelector("#close-modal").addEventListener("click", closeModal);
  document.querySelector("#cancel-modal").addEventListener("click", closeModal);
  elements.form.addEventListener("submit", handleSubmit);
  elements.searchInput.addEventListener("input", render);
  elements.filterTabs.forEach((tab) => {
    tab.addEventListener("click", () => setActiveFilter(tab.dataset.filter));
  });
  elements.modal.addEventListener("click", (event) => {
    if (event.target === elements.modal) closeModal();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !elements.modal.hidden) closeModal();
    if (event.key === "/" && elements.modal.hidden && !(event.target instanceof HTMLInputElement)) {
      event.preventDefault();
      elements.searchInput.focus();
    }
  });

  elements.todayDate.textContent = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date());
  render();
})();
