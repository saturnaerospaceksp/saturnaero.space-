const staffName = document.querySelector("[data-staff-name]");
const staffLogoutButton = document.querySelector("[data-staff-logout]");
const loginPath = "employee-login.html";

const redirectToLogin = () => {
    window.location.href = loginPath;
};

const currentStaffMember = window.EmployeeAuth?.isAuthenticated()
    ? window.EmployeeAuth.getCurrentEmployee()
    : null;

if (!currentStaffMember) {
    redirectToLogin();
} else if (staffName) {
    staffName.textContent = currentStaffMember.displayName || "Saturn Staff";
}

if (staffLogoutButton) {
    staffLogoutButton.addEventListener("click", () => {
        window.EmployeeAuth?.logout();
        redirectToLogin();
    });
}
