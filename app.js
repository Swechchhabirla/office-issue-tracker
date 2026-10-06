(() => {
	const categories = [
		"IT and Software",
		"Internet and Network",
		"Printer",
		"AC and HVAC",
		"Electrical",
		"Plumbing",
		"Furniture",
		"Housekeeping",
		"Security",
		"Other"
	];
	const departments = ["IT", "HR", "Finance", "Admin", "Operations", "Sales", "Marketing", "Management", "Other"];
	const priorities = ["Critical", "High", "Medium", "Low"];
	const resolutionTargetDays = { Critical: 1, High: 2, Medium: 5, Low: 7 };
	const millisecondsPerDay = 24 * 60 * 60 * 1000;
	const statuses = ["Open", "In progress", "Resolved", "Closed"];
	const assigneeGroups = [
		{ label: "Teams", options: ["IT Support Admin Team", "Facilities Team", "Security Team"] },
		{ label: "Employees", options: ["Maya Chen", "James Wilson", "Aisha Patel", "Sofia Garcia"] }
	];
	const assignees = ["Unassigned", ...assigneeGroups.flatMap(group => group.options)];
	const defaultAssignees = {
		"AC and HVAC": "Facilities Team",
		Electrical: "Facilities Team",
		Furniture: "Facilities Team",
		Housekeeping: "Facilities Team",
		Plumbing: "Facilities Team",
		"IT and Software": "IT Support Admin Team",
		"Internet and Network": "IT Support Admin Team",
		Printer: "IT Support Admin Team",
		Security: "Security Team"
	};
	const issueStorageKey = "officeCare.issues.v1";
	let needsIssueSave = false;
	const issues = loadIssues([
		{ id: "OC-0241", title: "Water leak in east wing", employee: "Maya Chen", department: "Admin", priority: "Critical", status: "Open", date: "Oct 06, 2026", category: "Plumbing", description: "Water is leaking from the ceiling near the east wing kitchenette. The floor is becoming slippery." },
		{ id: "OC-0240", title: "VPN connection drops frequently", employee: "James Wilson", department: "IT", priority: "High", status: "In progress", date: "Oct 05, 2026", category: "Internet and Network", description: "VPN disconnects every 10 to 15 minutes while working remotely, interrupting access to internal tools." },
		{ id: "OC-0239", title: "Meeting room projector not working", employee: "Aisha Patel", department: "Operations", priority: "Medium", status: "Open", date: "Oct 04, 2026", category: "IT and Software", description: "The projector in meeting room Cedar powers on but does not detect a laptop input." },
		{ id: "OC-0238", title: "Request for ergonomic chair", employee: "Noah Brooks", department: "Finance", priority: "Low", status: "Resolved", date: "Oct 03, 2026", category: "Furniture", description: "A replacement ergonomic chair was requested and delivered to the Finance team." },
		{ id: "OC-0237", title: "Broken access reader at side entrance", employee: "Sofia Garcia", department: "Management", priority: "High", status: "In progress", date: "Oct 02, 2026", category: "Security", description: "The badge reader at the south side entrance intermittently fails to recognize employee badges." },
		{ id: "OC-0236", title: "Heating uneven on third floor", employee: "Liam Foster", department: "HR", priority: "Medium", status: "Open", date: "Oct 01, 2026", category: "AC and HVAC", description: "Several desks on the third floor are noticeably colder than the rest of the office." },
		{ id: "OC-0235", title: "Payroll portal access restored", employee: "Evelyn Moore", department: "Finance", priority: "Medium", status: "Resolved", date: "Sep 30, 2026", category: "IT and Software", description: "Access to the payroll portal was restored after an account permissions update." },
		{ id: "OC-0234", title: "Request for confidential HR meeting", employee: "Daniel Kim", department: "HR", priority: "High", status: "Open", date: "Sep 29, 2026", category: "Other", description: "Please arrange a confidential conversation with the People team." },
		{ id: "OC-0233", title: "Restroom sink drain cleared", employee: "Olivia Reed", department: "Admin", priority: "Low", status: "Resolved", date: "Sep 28, 2026", category: "Plumbing", description: "The blocked sink in the second-floor restroom has been cleared." },
		{ id: "OC-0232", title: "Suspicious email reported", employee: "Ethan Wright", department: "IT", priority: "Critical", status: "In progress", date: "Sep 27, 2026", category: "Internet and Network", description: "A suspicious email impersonating a supplier was forwarded for security review." },
		{ id: "OC-0231", title: "Desk lamp replacement", employee: "Grace Turner", department: "Admin", priority: "Low", status: "Resolved", date: "Sep 26, 2026", category: "Electrical", description: "A faulty desk lamp was replaced." },
		{ id: "OC-0230", title: "Wellbeing support resources", employee: "Lucas Martin", department: "Operations", priority: "Medium", status: "Resolved", date: "Sep 25, 2026", category: "Other", description: "Information about available wellbeing resources was shared with the employee." }
	]);
	if (needsIssueSave) persistIssues();
	const rows = document.querySelector("#issueRows");
	const dialog = document.querySelector("#issueDialog");
	const form = document.querySelector("#issueForm");
	const formBody = document.querySelector("#reportFormBody");
	const detailsBody = document.querySelector("#issueDetailsBody");
	const formTitle = document.querySelector("#formTitle");
	const dialogSubtitle = document.querySelector("#dialogSubtitle");
	const formSubmit = document.querySelector("#formSubmit");
	const categorySelect = document.querySelector("#issueCategory");
	const departmentSelect = document.querySelector("#reportDepartment");
	const departmentFilter = document.querySelector("#departmentFilter");
	const prioritySelect = document.querySelector("#issuePriority");
	const priorityFilter = document.querySelector("#priorityFilter");
	const statusFilter = document.querySelector("#statusFilter");
	const categoryFilter = document.querySelector("#categoryFilter");
	const summaryGrid = document.querySelector(".summary-grid");
	const overdueMatrix = document.createElement("section");
	overdueMatrix.id = "overdueMatrix";
	overdueMatrix.className = "overdue-matrix";
	overdueMatrix.setAttribute("aria-labelledby", "overdueHeading");
	overdueMatrix.setAttribute("aria-live", "polite");
	overdueMatrix.innerHTML = `<div class="overdue-matrix-header"><div><p class="eyebrow">Service levels</p><h3 class="panel-title" id="overdueHeading">Overdue issues</h3><p class="panel-subtitle">Open or in-progress issues past their resolution target</p></div><span class="overdue-total" id="overdueTotal">0 overdue</span></div><div class="overdue-table-wrap"><table class="overdue-matrix-table"><thead><tr><th scope="col">Priority</th><th scope="col">Resolution target</th><th scope="col">Overdue</th><th scope="col">Issue IDs</th></tr></thead><tbody id="overdueMatrixRows"></tbody></table></div>`;
	summaryGrid.after(overdueMatrix);
	const overdueMatrixRows = document.querySelector("#overdueMatrixRows");
	const overdueTotal = document.querySelector("#overdueTotal");
	const openSummaryCard = document.querySelector("#openCount").closest(".summary-card");
	const inProgressSummaryCard = openSummaryCard.cloneNode(true);
	inProgressSummaryCard.querySelector(".summary-label").textContent = "In progress issues";
	inProgressSummaryCard.querySelector(".metric-value").id = "inProgressCount";
	inProgressSummaryCard.querySelector(".metric-value").textContent = "0";
	inProgressSummaryCard.querySelector(".metric-foot").textContent = "Currently being handled";
openSummaryCard.after(inProgressSummaryCard);
	document.querySelector("#totalCount").closest(".summary-card").querySelector(".metric-foot").textContent = "All recorded reports";
	const deleteButton = document.createElement("button");
	deleteButton.type = "button";
	deleteButton.id = "deleteIssueButton";
	deleteButton.className = "secondary-button";
	deleteButton.textContent = "Delete issue";
	deleteButton.hidden = true;
	deleteButton.style.color = "#a83e37";
	deleteButton.style.borderColor = "#efc2bd";
	deleteButton.style.backgroundColor = "#fff5f3";
	document.querySelector(".dialog-actions").insertBefore(deleteButton, formSubmit);
	let showAll = false;
	let nextId = Math.max(242, ...issues.map(issue => Number(issue.id.slice(3)) + 1).filter(Number.isFinite));

	function updateSummaryLayout() {
		const columns = window.innerWidth <= 650 ? 2 : window.innerWidth <= 1100 ? 3 : 5;
		summaryGrid.style.gridTemplateColumns = `repeat(${columns}, minmax(0, 1fr))`;
	}
	updateSummaryLayout();
	window.addEventListener("resize", updateSummaryLayout);

	function loadIssues(fallbackIssues) {
		function normalizeTimestamp(value, fallback) {
			if (typeof value !== "string" && typeof value !== "number") return fallback;
			const date = new Date(value);
			return Number.isFinite(date.getTime()) ? date.toISOString() : fallback;
		}

		function normalizeIssue(issue) {
			const now = new Date().toISOString();
			const createdAt = normalizeTimestamp(issue.createdAt, normalizeTimestamp(issue.date, now));
			const updatedAt = normalizeTimestamp(issue.updatedAt, createdAt);
			const resolvedAt = issue.status === "Resolved"
				? normalizeTimestamp(issue.resolvedAt, updatedAt)
				: issue.status === "Closed"
					? normalizeTimestamp(issue.resolvedAt, null)
					: null;
			const category = categories.includes(issue.category) ? issue.category : "Other";
			const sharedDateOnlyClock = issue.status === "Resolved" && resolvedAt && createdAt.slice(11) === updatedAt.slice(11) && updatedAt.slice(11) === resolvedAt.slice(11);
			const normalized = {
				...issue,
				title: typeof issue.title === "string" && issue.title.trim() ? issue.title.trim() : "Untitled issue",
				employee: typeof issue.employee === "string" && issue.employee.trim() ? issue.employee.trim() : "Unknown employee",
				department: departments.includes(issue.department) ? issue.department : "Other",
				category,
				priority: priorities.includes(issue.priority) ? issue.priority : "Medium",
				description: typeof issue.description === "string" ? issue.description : "",
				date: typeof issue.date === "string" && Number.isFinite(new Date(issue.date).getTime()) ? issue.date : formatDate(new Date(createdAt)),
				createdAt,
				updatedAt,
				resolvedAt,
				resolutionTimeEstimated: issue.status === "Resolved"
					? issue.resolutionTimeEstimated === true || (issue.resolutionTimeEstimated === undefined && sharedDateOnlyClock)
					: false,
				assignee: assignees.includes(issue.assignee) ? issue.assignee : defaultAssignees[category] || "Unassigned"
			};
			const fields = ["title", "employee", "department", "category", "priority", "description", "date", "createdAt", "updatedAt", "resolvedAt", "resolutionTimeEstimated", "assignee"];
			if (fields.some(field => normalized[field] !== issue[field])) needsIssueSave = true;
			return normalized;
		}

		function loadFallback() {
			needsIssueSave = true;
			return fallbackIssues.map(normalizeIssue);
		}

		try {
			const storedIssues = localStorage.getItem(issueStorageKey);
			if (storedIssues === null) return loadFallback();
			const savedIssues = JSON.parse(storedIssues);
			if (!Array.isArray(savedIssues)) return loadFallback();
			if (savedIssues.length === 0) return [];
			const seenIds = new Set();
			const validIssues = savedIssues.filter(issue => {
				if (!issue || typeof issue.id !== "string" || !issue.id.trim() || !statuses.includes(issue.status) || seenIds.has(issue.id)) return false;
				seenIds.add(issue.id);
				return true;
			});
			if (validIssues.length !== savedIssues.length) needsIssueSave = true;
			return validIssues.length ? validIssues.map(normalizeIssue) : loadFallback();
		} catch {
			return loadFallback();
		}
	}

	function persistIssues() {
		try {
			localStorage.setItem(issueStorageKey, JSON.stringify(issues));
		} catch (error) {
			console.error("Unable to save OfficeCare issues to local storage.", error);
		}
	}

	categories.forEach(category => {
		const option = document.createElement("option");
		option.value = category;
		option.textContent = category;
		categorySelect.append(option);
		categoryFilter.append(option.cloneNode(true));
	});
	departments.forEach(department => {
		const option = document.createElement("option");
		option.value = department;
		option.textContent = department;
		departmentSelect.append(option);
		departmentFilter.append(option.cloneNode(true));
	});
	priorities.forEach(priority => {
		const option = document.createElement("option");
		option.value = priority;
		option.textContent = priority;
		prioritySelect.append(option);
		priorityFilter.append(option.cloneNode(true));
	});
	const closedStatusOption = document.createElement("option");
	closedStatusOption.value = "Closed";
	closedStatusOption.textContent = "Closed";
	statusFilter.append(closedStatusOption);

	document.querySelector("#todayLabel").textContent = new Intl.DateTimeFormat("en", { weekday: "short", month: "short", day: "numeric", year: "numeric" }).format(new Date());

	function updateSummary() {
		const periodIssues = getPeriodIssues();
		document.querySelector("#totalCount").textContent = periodIssues.length;
		const openIssues = periodIssues.filter(issue => issue.status === "Open");
		const inProgressIssues = periodIssues.filter(issue => issue.status === "In progress");
		const resolvedIssues = periodIssues.filter(issue => issue.status === "Resolved");
		document.querySelector("#openCount").textContent = openIssues.length;
		document.querySelector("#inProgressCount").textContent = inProgressIssues.length;
		document.querySelector("#departmentCount").textContent = `${new Set(openIssues.map(issue => issue.department)).size} departments`;
		document.querySelector("#criticalCount").textContent = periodIssues.filter(issue => issue.priority === "Critical" && (issue.status === "Open" || issue.status === "In progress")).length;
		document.querySelector("#resolvedCount").textContent = resolvedIssues.length;
		document.querySelector("#resolutionRate").textContent = `${periodIssues.length ? Math.round(resolvedIssues.length / periodIssues.length * 100) : 0}%`;
		const periodLabels = { month: "This month", quarter: "This quarter", year: "This year" };
		document.querySelector("#totalCount").closest(".summary-card").querySelector(".metric-foot").textContent = `${periodLabels[document.querySelector("#reportingPeriod").value]} by created date`;
		updateResolutionAnalytics(periodIssues);
	}

	function getPeriodIssues() {
		const now = new Date();
		const period = document.querySelector("#reportingPeriod").value;
		let periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
		if (period === "quarter") periodStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
		if (period === "year") periodStart = new Date(now.getFullYear(), 0, 1);
		return issues.filter(issue => {
			const createdAt = new Date(issue.createdAt || issue.date);
			return Number.isFinite(createdAt.getTime()) && createdAt >= periodStart && createdAt <= now;
		});
	}

	function filteredIssues() {
		const query = document.querySelector("#issueSearch").value.trim().toLowerCase();
		const status = document.querySelector("#statusFilter").value;
		const priority = document.querySelector("#priorityFilter").value;
		const department = document.querySelector("#departmentFilter").value;
		const category = categoryFilter.value;
		return issues.filter(issue => (!query || `${issue.id} ${issue.title} ${issue.employee} ${issue.department} ${issue.description} ${issue.category} ${issue.assignee}`.toLowerCase().includes(query)) && (!status || issue.status === status) && (!priority || issue.priority === priority) && (!department || issue.department === department) && (!category || issue.category === category));
	}

	function renderBreakdown(containerId, property, order, sourceIssues) {
		const container = document.querySelector(containerId);
		const observedValues = new Set(sourceIssues.map(issue => issue[property]).filter(Boolean));
		const values = [...order.filter(value => observedValues.has(value)), ...[...observedValues].filter(value => !order.includes(value)).sort()];
		const entries = values.map(value => ({ value, count: sourceIssues.filter(issue => issue[property] === value).length }));
		const maxCount = Math.max(1, ...entries.map(entry => entry.count));
		container.replaceChildren();
		if (!entries.length) {
			const empty = document.createElement("p");
			empty.className = "analytics-empty";
			empty.textContent = "No issues recorded";
			container.append(empty);
			return;
		}
		entries.forEach(entry => {
			const row = document.createElement("div");
			row.className = "category-row";
			row.dataset.value = entry.value.toLowerCase();
			const label = document.createElement("span");
			label.textContent = entry.value;
			const track = document.createElement("span");
			track.className = "category-track";
			const fill = document.createElement("span");
			fill.className = "category-fill";
			fill.style.display = "block";
			fill.style.width = `${entry.count / maxCount * 100}%`;
			track.append(fill);
			const count = document.createElement("span");
			count.className = "category-count";
			count.textContent = entry.count;
			row.append(label, track, count);
			container.append(row);
		});
	}

	function renderAnalyticsBreakdowns() {
		const periodIssues = getPeriodIssues();
		renderBreakdown("#departmentStats", "department", departments, periodIssues);
		renderBreakdown("#categoryStats", "category", categories, periodIssues);
		renderBreakdown("#priorityStats", "priority", priorities, periodIssues);
	}

	function isIssueOverdue(issue, now = Date.now()) {
		if (issue.status !== "Open" && issue.status !== "In progress") return false;
		const targetDays = resolutionTargetDays[issue.priority];
		const createdAt = new Date(issue.createdAt || issue.date).getTime();
		return Number.isFinite(createdAt) && Number.isFinite(targetDays) && now - createdAt >= targetDays * millisecondsPerDay;
	}

	function renderOverdueMatrix() {
		const overdueIssues = issues.filter(issue => isIssueOverdue(issue));
		overdueTotal.textContent = `${overdueIssues.length} overdue issue${overdueIssues.length === 1 ? "" : "s"}`;
		overdueTotal.classList.toggle("has-overdue", overdueIssues.length > 0);
		overdueMatrixRows.replaceChildren();
		priorities.forEach(priority => {
			const priorityIssues = overdueIssues.filter(issue => issue.priority === priority);
			const row = document.createElement("tr");
			if (priorityIssues.length) row.classList.add("has-overdue");
			row.innerHTML = `<th scope="row"><span class="priority priority-${priority.toLowerCase()}">${escapeHtml(priority)}</span></th><td>${resolutionTargetDays[priority]} day${resolutionTargetDays[priority] === 1 ? "" : "s"}</td><td><span class="overdue-count${priorityIssues.length ? " has-overdue" : ""}">${priorityIssues.length}</span></td><td class="overdue-issue-ids">${priorityIssues.length ? priorityIssues.map(issue => escapeHtml(issue.id)).join(", ") : "None"}</td>`;
			overdueMatrixRows.append(row);
		});
	}

	function refreshOverdueBadges() {
		rows.querySelectorAll("tr[data-issue-id]").forEach(row => {
			const issue = issues.find(item => item.id === row.dataset.issueId);
			if (!issue) return;
			const overdue = isIssueOverdue(issue);
			row.classList.toggle("issue-row-overdue", overdue);
			const statusCell = row.querySelector(".status").parentElement;
			const badge = statusCell.querySelector(".overdue-badge");
			if (overdue && !badge) {
				const overdueBadge = document.createElement("span");
				overdueBadge.className = "overdue-badge";
				overdueBadge.textContent = "Overdue";
				overdueBadge.setAttribute("aria-label", `Overdue by ${issue.priority} priority target`);
				statusCell.append(overdueBadge);
			} else if (!overdue && badge) {
				badge.remove();
			}
		});
		renderOverdueMatrix();
	}

	function renderIssues() {
		const matches = filteredIssues();
		const visible = showAll || matches.length <= 5 ? matches : matches.slice(0, 5);
		rows.replaceChildren();
		visible.forEach(issue => {
			const row = document.createElement("tr");
			row.dataset.issueId = issue.id;
			const priorityClass = issue.priority.toLowerCase();
			const statusClass = issue.status === "In progress" ? "progress" : issue.status.toLowerCase();
			const overdue = isIssueOverdue(issue);
			row.classList.toggle("issue-row-critical", issue.priority === "Critical");
			row.classList.toggle("issue-row-overdue", overdue);
			const overdueBadge = overdue ? `<span class="overdue-badge" aria-label="Overdue by ${escapeHtml(issue.priority)} priority target">Overdue</span>` : "";
			row.innerHTML = `<td><span class="issue-id">${escapeHtml(issue.id)}</span></td><td><span class="issue-title">${escapeHtml(issue.title)}</span></td><td>${escapeHtml(issue.employee)}</td><td>${escapeHtml(issue.department)}</td><td>${escapeHtml(issue.category)}</td><td><span class="assignee-badge">${escapeHtml(issue.assignee)}</span></td><td><span class="priority priority-${priorityClass}" aria-label="${escapeHtml(issue.priority)} priority">${escapeHtml(issue.priority)}</span></td><td><span class="status status-${statusClass}">${escapeHtml(issue.status)}</span>${overdueBadge}</td><td>${escapeHtml(issue.date)}</td><td><button class="row-action" type="button" aria-label="View ${escapeHtml(issue.id)} details" title="View details" data-issue-id="${escapeHtml(issue.id)}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M2.5 12s3.3-7 9.5-7 9.5 7 9.5 7-3.3 7-9.5 7-9.5-7-9.5-7Z"/></svg></button></td>`;
			rows.append(row);
		});
		document.querySelector("#emptyState").style.display = matches.length ? "none" : "block";
		const emptyState = document.querySelector("#emptyState");
		const query = document.querySelector("#issueSearch").value.trim();
		emptyState.setAttribute("role", "status");
		emptyState.setAttribute("aria-live", "polite");
		if (!matches.length) {
			emptyState.textContent = query
				? `No issues found for "${query}". Try another search or clear the filters.`
				: "No issues match these filters. Try changing or clearing them.";
		}
		document.querySelector("#resultCount").textContent = `Showing ${visible.length} of ${matches.length} matching issue${matches.length === 1 ? "" : "s"}`;
		document.querySelector("#showAllButton").hidden = matches.length <= 5;
		document.querySelector("#showAllButton").textContent = showAll ? "Show fewer" : "Show all issues";
		renderAnalyticsBreakdowns();
		renderOverdueMatrix();
	}

	function escapeHtml(value) {
		return String(value).replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
	}

	function formatDate(date) {
		return new Intl.DateTimeFormat("en", { month: "short", day: "2-digit", year: "numeric" }).format(date);
	}

	function formatDateTime(value) {
		const date = new Date(value);
		if (Number.isNaN(date.getTime())) return value || "Not available";
		const options = { month: "short", day: "2-digit", year: "numeric" };
		if (typeof value === "string" && value.includes("T")) {
			options.hour = "numeric";
			options.minute = "2-digit";
		}
		return new Intl.DateTimeFormat("en", options).format(date);
	}

	function updateResolutionAnalytics(periodIssues) {
		const resolvedIssues = periodIssues.filter(issue => issue.status === "Resolved");
		const durations = resolvedIssues.map(issue => {
			if (issue.resolutionTimeEstimated) return null;
			const createdAt = new Date(issue.createdAt).getTime();
			const resolvedAt = new Date(issue.resolvedAt).getTime();
			return Number.isFinite(createdAt) && Number.isFinite(resolvedAt) && resolvedAt >= createdAt
				? (resolvedAt - createdAt) / 3600000
				: null;
		}).filter(duration => duration !== null);
		const value = document.querySelector("#averageResolutionTime");
		const caption = document.querySelector("#resolutionTimeCaption");
		if (!durations.length) {
			value.textContent = "--";
			caption.textContent = resolvedIssues.length
				? `Exact resolution timing unavailable for ${resolvedIssues.length} resolved issue${resolvedIssues.length === 1 ? "" : "s"}`
				: "No resolved issues in this period";
			return;
		}
		const averageHours = durations.reduce((total, duration) => total + duration, 0) / durations.length;
		value.textContent = averageHours < 1
			? "Less than 1 hour"
			: averageHours >= 24
			? `${(averageHours / 24).toFixed(1)} days`
			: `${averageHours.toFixed(1)} hours`;
		const estimatedCount = resolvedIssues.length - durations.length;
		caption.textContent = `Based on ${durations.length} resolved issue${durations.length === 1 ? "" : "s"}${estimatedCount ? `; ${estimatedCount} older record${estimatedCount === 1 ? "" : "s"} excluded` : ""}`;
	}

	function openReport() {
		form.reset();
		formBody.querySelectorAll("input, select, textarea").forEach(control => { control.disabled = false; });
		formTitle.textContent = "Report an issue";
		dialogSubtitle.textContent = "Share what happened so the right team can help.";
		formSubmit.textContent = "Submit report";
		formSubmit.hidden = false;
		deleteButton.hidden = true;
		formBody.hidden = false;
		detailsBody.hidden = true;
		dialog.showModal();
		document.querySelector("#employeeName").focus();
	}

	function openDetails(issue) {
		formBody.querySelectorAll("input, select, textarea").forEach(control => { control.disabled = true; });
		formTitle.textContent = "Issue details";
		dialogSubtitle.textContent = `${issue.id} · ${issue.title}`;
		formSubmit.textContent = "Save changes";
		formSubmit.hidden = false;
		deleteButton.hidden = false;
		formBody.hidden = true;
		detailsBody.hidden = false;
		const statusOptions = statuses.map(status => `<option value="${escapeHtml(status)}"${status === issue.status ? " selected" : ""}>${escapeHtml(status)}</option>`).join("");
		const assigneeOptions = `<option value="Unassigned"${issue.assignee === "Unassigned" ? " selected" : ""}>Unassigned</option>${assigneeGroups.map(group => `<optgroup label="${escapeHtml(group.label)}">${group.options.map(assignee => `<option value="${escapeHtml(assignee)}"${assignee === issue.assignee ? " selected" : ""}>${escapeHtml(assignee)}</option>`).join("")}</optgroup>`).join("")}`;
		detailsBody.innerHTML = `<div class="details-list"><div><div class="detail-label">Issue ID</div><div class="detail-value">${escapeHtml(issue.id)}</div></div><div><div class="detail-label">Employee name</div><div class="detail-value">${escapeHtml(issue.employee)}</div></div><div><div class="detail-label">Department</div><div class="detail-value">${escapeHtml(issue.department)}</div></div><div><div class="detail-label">Category</div><div class="detail-value">${escapeHtml(issue.category)}</div></div><div class="detail-full"><div class="detail-label">Title</div><div class="detail-value">${escapeHtml(issue.title)}</div></div><div class="detail-description"><div class="detail-label">Description</div><div class="detail-value">${escapeHtml(issue.description)}</div></div><div><div class="detail-label">Priority</div><div class="detail-value"><span class="priority priority-${issue.priority.toLowerCase()}">${escapeHtml(issue.priority)}</span></div></div><div><div class="detail-label">Status</div><div class="detail-value"><span class="status status-${issue.status === "In progress" ? "progress" : issue.status.toLowerCase()}">${escapeHtml(issue.status)}</span></div></div><div><div class="detail-label">Created date</div><div class="detail-value">${escapeHtml(formatDateTime(issue.createdAt))}</div></div><div><div class="detail-label">Updated date</div><div class="detail-value">${escapeHtml(formatDateTime(issue.updatedAt))}</div></div><div class="detail-full"><div class="detail-label">Resolved date</div><div class="detail-value">${escapeHtml(issue.resolvedAt ? formatDateTime(issue.resolvedAt) : "Not resolved")}</div></div><div class="detail-assignment-field detail-full"><label class="detail-label" for="detailAssigneeSelect">Assigned to</label><select class="control" id="detailAssigneeSelect">${assigneeOptions}</select></div><div class="detail-status-field detail-full"><label class="detail-label" for="detailStatusSelect">Update status</label><select class="control" id="detailStatusSelect">${statusOptions}</select></div></div>`;
		dialog.dataset.issueId = issue.id;
		dialog.showModal();
	}

	document.querySelector("#reportButton").addEventListener("click", openReport);
	deleteButton.addEventListener("click", () => {
		const issueIndex = issues.findIndex(issue => issue.id === dialog.dataset.issueId);
		if (issueIndex < 0 || !window.confirm(`Delete issue ${issues[issueIndex].id}? This cannot be undone.`)) return;
		issues.splice(issueIndex, 1);
		persistIssues();
		dialog.close();
		updateSummary();
		renderIssues();
	});
	document.querySelectorAll("[data-close-dialog]").forEach(button => button.addEventListener("click", () => dialog.close()));
	document.querySelector("#clearFilters").addEventListener("click", () => {
		document.querySelector("#issueSearch").value = "";
		["#statusFilter", "#priorityFilter", "#departmentFilter", "#categoryFilter"].forEach(selector => { document.querySelector(selector).value = ""; });
		showAll = false;
		renderIssues();
	});
	document.querySelector("#showAllButton").addEventListener("click", () => { showAll = !showAll; renderIssues(); });
	["#issueSearch", "#statusFilter", "#priorityFilter", "#departmentFilter", "#categoryFilter"].forEach(selector => document.querySelector(selector).addEventListener("input", () => { showAll = false; renderIssues(); }));
	rows.addEventListener("click", event => {
		const button = event.target.closest("[data-issue-id]");
		if (button) openDetails(issues.find(issue => issue.id === button.dataset.issueId));
	});
	form.addEventListener("submit", event => {
		event.preventDefault();
		if (formBody.hidden) {
			const issue = issues.find(item => item.id === dialog.dataset.issueId);
			const updatedStatus = document.querySelector("#detailStatusSelect").value;
			const updatedAssignee = document.querySelector("#detailAssigneeSelect").value;
			if (issue && statuses.includes(updatedStatus) && assignees.includes(updatedAssignee) && (issue.status !== updatedStatus || issue.assignee !== updatedAssignee)) {
				const statusChanged = issue.status !== updatedStatus;
				const now = new Date();
				issue.status = updatedStatus;
				issue.assignee = updatedAssignee;
				issue.updatedAt = now.toISOString();
				if (statusChanged && updatedStatus === "Resolved") {
					issue.resolvedAt = now.toISOString();
					issue.resolutionTimeEstimated = false;
				} else if (updatedStatus === "Open" || updatedStatus === "In progress") {
					issue.resolvedAt = null;
					issue.resolutionTimeEstimated = false;
				}
				persistIssues();
			}
			dialog.close();
			updateSummary();
			renderIssues();
			return;
		}
		if (!form.reportValidity()) return;
		const data = new FormData(form);
		const createdAt = new Date();
		const now = formatDate(createdAt);
		issues.unshift({ id: `OC-${String(nextId++).padStart(4, "0")}`, title: data.get("title"), employee: data.get("employee"), department: data.get("department"), category: data.get("category"), priority: data.get("priority"), status: "Open", date: now, createdAt: createdAt.toISOString(), updatedAt: createdAt.toISOString(), resolvedAt: null, resolutionTimeEstimated: false, assignee: "Unassigned", description: data.get("description") });
		persistIssues();
		dialog.close();
		updateSummary();
		renderIssues();
	});
	dialog.addEventListener("click", event => { if (event.target === dialog) dialog.close(); });
	document.querySelector("#reportingPeriod").addEventListener("change", event => {
		updateSummary();
		renderAnalyticsBreakdowns();
	});
	window.setInterval(() => {
		if (!document.hidden) refreshOverdueBadges();
	}, 15 * 60 * 1000);
	document.addEventListener("visibilitychange", () => {
		if (!document.hidden) refreshOverdueBadges();
	});
	updateSummary();
	renderIssues();
})();
