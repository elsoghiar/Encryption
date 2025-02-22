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

function updateActivePage() {
    const currentPage = window.location.pathname.split('/').pop() || homePage;

    // إزالة كلاس active من جميع الأزرار
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });

    // تحديد الصفحة النشطة بناءً على الرابط الحالي
    if (currentPage.includes("index.html") || currentPage === "") {
        document.getElementById("homeNav")?.classList.add("active");
    } else if (currentPage.includes("photo.html")) {
        document.getElementById("photoNav")?.classList.add("active");
    } else if (currentPage.includes("improve.html")) {
        document.getElementById("improveNav")?.classList.add("active");
    }

    // منطق زر الرجوع
    if (currentPage === homePage || currentPage === "") {
        telegramApp.BackButton.hide();
    } else {
        telegramApp.BackButton.show();
        telegramApp.BackButton.onClick(() => {
            window.location.href = homePage;
        });
    }
}

document.addEventListener("DOMContentLoaded", updateActivePage);
window.addEventListener("popstate", updateActivePage);
