document.addEventListener("DOMContentLoaded", function () {
    const homePage = "index.html";
    const currentPage = window.location.pathname.split('/').pop() || homePage;

    // إزالة الفئة "active" من جميع الأزرار
    document.querySelectorAll(".nav-item").forEach(item => item.classList.remove("active"));

    // تحديد الزر النشط بناءً على الصفحة الحالية
    document.querySelectorAll(".nav-item").forEach(item => {
        if (item.getAttribute("href") === currentPage) {
            item.classList.add("active");
        }
    });

    // تحديث زر الرجوع في Telegram WebApp
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
