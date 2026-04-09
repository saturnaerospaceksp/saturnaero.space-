const loginForm = document.querySelector("[data-login-form]");
const loginMessage = document.querySelector("[data-login-message]");
const loginPanel = document.querySelector("[data-login-panel]");
const logoutButton = document.querySelector("[data-logout]");
const loggedInName = document.querySelector("[data-logged-in-name]");
const STAFF_HUB_PATH = "staff-hub.html";

const redirectToStaffHub = () => {
    window.location.href = STAFF_HUB_PATH;
};

const syncEmployeePanel = () => {
    if (!loginPanel) {
        return;
    }

    const employee = window.EmployeeAuth?.getCurrentEmployee();

    loginPanel.classList.toggle("is-visible", Boolean(employee));

    if (loggedInName) {
        loggedInName.textContent = employee ? employee.displayName : "";
    }
};

if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const formData = new FormData(loginForm);
        const username = String(formData.get("username") || "").trim();
        const password = String(formData.get("password") || "");
        const account = window.EmployeeAuth?.authenticate(username, password);

        if (account) {
            window.EmployeeAuth.login(account);
            await window.EmployeeAudit?.log("login", {
                page: "employee-login",
                username: account.username
            });
            loginMessage.textContent = `Login successful. Redirecting ${account.displayName} to the Staff Hub.`;
            loginMessage.className = "auth-message is-success";
            loginForm.reset();
            syncEmployeePanel();
            redirectToStaffHub();
            return;
        }

        window.EmployeeAuth?.logout();
        loginMessage.textContent = "Incorrect username or password.";
        loginMessage.className = "auth-message is-error";
        syncEmployeePanel();
    });
}

if (logoutButton) {
    logoutButton.addEventListener("click", () => {
        window.EmployeeAuth?.logout();

        if (loginMessage) {
            loginMessage.textContent = "Logged out.";
            loginMessage.className = "auth-message";
        }

        syncEmployeePanel();
    });
}

if (window.EmployeeAuth?.isAuthenticated()) {
    syncEmployeePanel();
    redirectToStaffHub();
}

syncEmployeePanel();
