// ملف telegram.js (مشترك لكل الصفحات)
const telegramApp = window.Telegram.WebApp;
telegramApp.ready();

const homePage = "index.html"; // اسم الصفحة الرئيسية

// تحديث زر Telegram حسب الصفحة
function updateTelegramButton() {
    const currentPage = window.location.pathname.split('/').pop() || homePage;

    if (currentPage === homePage) {
        telegramApp.BackButton.hide();  // إخفاء زر الرجوع في الصفحة الرئيسية
    } else {
        telegramApp.BackButton.show();  // إظهار زر الرجوع في الصفحات الفرعية
        telegramApp.BackButton.onClick(() => {
            window.location.href = homePage;  // العودة للصفحة الرئيسية
        });
    }
}

// تنفيذ عند تحميل الصفحة
document.addEventListener("DOMContentLoaded", updateTelegramButton);
