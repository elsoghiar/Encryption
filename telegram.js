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


document.addEventListener("DOMContentLoaded", function () {
    const homePage = "index.html";
    const currentPage = window.location.pathname.split('/').pop() || homePage;

    // تحديد جميع عناصر التنقل
    const navItems = document.querySelectorAll(".nav-item");

    navItems.forEach(item => {
        const link = item.getAttribute("href");
        if (link === currentPage) {
            item.classList.add("active");
        } else {
            item.classList.remove("active");
        }
    });

    // Telegram WebApp Back Button
    const telegramApp = window.Telegram.WebApp;
    telegramApp.ready();

    if (currentPage === homePage) {
        telegramApp.BackButton.hide();
    } else {
        telegramApp.BackButton.show();
        telegramApp.BackButton.onClick(() => {
            window.location.href = homePage;
        });
    }
});
