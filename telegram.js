document.addEventListener("DOMContentLoaded", () => {
    try {
        if (window.Telegram?.WebApp) {
            Telegram.WebApp.requestFullscreen();
        } else {
            console.warn("Running outside Telegram. Fullscreen mode is not available.");
            document.documentElement.style.setProperty("--container-padding-top", "25px");
        }
    } catch (error) {
        console.warn("Failed to enter fullscreen mode:", error);
        document.documentElement.style.setProperty("--container-padding-top", "25px");
    }
});

const telegramApp = window.Telegram.WebApp;
telegramApp.ready();
const homePage = "index.html";
function updateActiveButton() {
    const currentPage = window.location.pathname.split('/').pop() || homePage;
    if (currentPage === homePage) {
        telegramApp.BackButton.hide();
    } else {
        telegramApp.BackButton.show();
        telegramApp.BackButton.onClick(() => {
            window.location.href = homePage;
        });
    }
    document.querySelectorAll(".nav-item").forEach(item => {
        const target = item.getAttribute("href");
        const icon = item.querySelector("svg");

        if (target === currentPage) {
            item.classList.add("active");
            if (icon) {
                icon.style.fill = "#2D83EC"; 
            }
        } else {
            item.classList.remove("active");
            if (icon) {
                icon.style.fill = "#4a4a4a"; 
            }
        }
    });
}

document.addEventListener("DOMContentLoaded", updateActiveButton);
window.addEventListener("popstate", updateActiveButton);
