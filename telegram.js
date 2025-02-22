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

    // إزالة "active" من جميع الأزرار
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });

    // البحث عن الرابط الذي يتوافق مع الصفحة الحالية وإضافة "active"
    document.querySelectorAll('.nav-item').forEach(item => {
        const link = item.getAttribute('href');
        if (link === currentPage) {
            item.classList.add('active');
        }
    });

    // منطق زر الرجوع
    if (currentPage === homePage) {
        telegramApp.BackButton.hide();
    } else {
        telegramApp.BackButton.show();
        telegramApp.BackButton.onClick(() => {
            window.location.href = homePage;
        });
    }
}

document.addEventListener("DOMContentLoaded", updateActivePage);
