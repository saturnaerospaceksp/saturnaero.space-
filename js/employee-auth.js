const EMPLOYEE_AUTH_STATE_KEY = "saturnEmployeeAuthenticated";
const EMPLOYEE_AUTH_USER_KEY = "saturnEmployeeUser";

const normalizeEmployeeAccount = (account) => {
    if (!account || typeof account !== "object") {
        return null;
    }

    const username = String(account.username || "").trim();
    const password = String(account.password || "");
    const displayName = String(account.displayName || username).trim();

    if (!username || !password) {
        return null;
    }

    return {
        username,
        password,
        displayName: displayName || username
    };
};

const getEmployeeAccounts = () => {
    const rawAccounts = window.EMPLOYEE_CREDENTIALS;
    const list = Array.isArray(rawAccounts) ? rawAccounts : [rawAccounts];

    return list
        .map(normalizeEmployeeAccount)
        .filter(Boolean);
};

const getStoredEmployee = () => {
    const raw = sessionStorage.getItem(EMPLOYEE_AUTH_USER_KEY);

    if (!raw) {
        return null;
    }

    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
};

const storeEmployeeSession = (account) => {
    const employee = {
        username: account.username,
        displayName: account.displayName
    };

    sessionStorage.setItem(EMPLOYEE_AUTH_STATE_KEY, "true");
    sessionStorage.setItem(EMPLOYEE_AUTH_USER_KEY, JSON.stringify(employee));

    return employee;
};

const clearEmployeeSession = () => {
    sessionStorage.removeItem(EMPLOYEE_AUTH_STATE_KEY);
    sessionStorage.removeItem(EMPLOYEE_AUTH_USER_KEY);
};

window.EmployeeAuth = {
    getAccounts() {
        return getEmployeeAccounts();
    },
    authenticate(username, password) {
        return getEmployeeAccounts().find((account) => {
            return account.username === username && account.password === password;
        }) || null;
    },
    login(account) {
        return storeEmployeeSession(account);
    },
    logout() {
        clearEmployeeSession();
    },
    getCurrentEmployee() {
        const employee = getStoredEmployee();

        if (!employee) {
            return null;
        }

        return {
            username: String(employee.username || ""),
            displayName: String(employee.displayName || employee.username || "")
        };
    },
    isAuthenticated() {
        return sessionStorage.getItem(EMPLOYEE_AUTH_STATE_KEY) === "true" && Boolean(getStoredEmployee());
    }
};
