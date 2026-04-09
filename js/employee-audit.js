const EMPLOYEE_AUDIT_LOG_KEY = "saturnEmployeeAuditLog";
const EMPLOYEE_AUDIT_IP_KEY = "saturnEmployeeAuditIp";

const getStoredAuditLog = () => {
    const raw = localStorage.getItem(EMPLOYEE_AUDIT_LOG_KEY);

    if (!raw) {
        return [];
    }

    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

const saveAuditLog = (entries) => {
    localStorage.setItem(EMPLOYEE_AUDIT_LOG_KEY, JSON.stringify(entries.slice(0, 100)));
};

const getAuditIpAddress = async () => {
    const cached = sessionStorage.getItem(EMPLOYEE_AUDIT_IP_KEY);

    if (cached) {
        return cached;
    }

    try {
        const response = await fetch("https://api.ipify.org?format=json", { cache: "no-store" });

        if (!response.ok) {
            throw new Error("IP lookup failed");
        }

        const payload = await response.json();
        const ip = String(payload.ip || "").trim() || "Unavailable";
        sessionStorage.setItem(EMPLOYEE_AUDIT_IP_KEY, ip);
        return ip;
    } catch {
        return "Unavailable";
    }
};

window.EmployeeAudit = {
    async log(action, details = {}) {
        const employee = window.EmployeeAuth?.getCurrentEmployee();
        const ip = await getAuditIpAddress();
        const entry = {
            id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            action: String(action || "activity"),
            details: typeof details === "object" && details ? details : {},
            employee: employee ? employee.displayName : "Unknown",
            username: employee ? employee.username : "",
            ip,
            timestamp: new Date().toISOString()
        };

        saveAuditLog([entry, ...getStoredAuditLog()]);

        if (window.GitHubSync?.isConfigured()) {
            try {
                await window.GitHubSync.appendAuditEntry(entry);
            } catch {
                // Keep the local fallback even if the repo write fails.
            }
        }

        return entry;
    },
    getEntries() {
        return getStoredAuditLog();
    }
};
