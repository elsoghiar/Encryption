const telegramApp = window.Telegram.WebApp;
telegramApp.ready();

const homePage = "index.html";

// وظيفة لتحديث زر Telegram وزر التنقل النشط
function updateActiveButton() {
    const currentPage = window.location.pathname.split('/').pop() || homePage;

    // التحكم في زر الرجوع
    if (currentPage === homePage) {
        telegramApp.BackButton.hide();
    } else {
        telegramApp.BackButton.show();
        telegramApp.BackButton.onClick(() => {
            window.location.href = homePage;
        });
    }

    // تحديث حالة الأزرار
    document.querySelectorAll(".nav-item").forEach(item => {
        const target = item.getAttribute("href");
        const icon = item.querySelector("svg");

        if (target === currentPage) {
            item.classList.add("active");
            if (icon) {
                icon.style.fill = "url(#activeGradient)";
            }
        } else {
            item.classList.remove("active");
            if (icon) {
                icon.style.fill = "currentColor";
            }
        }
    });
}

// إضافة تدرج لوني في HTML
function addGradientToSVG() {
    const svgDefs = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svgDefs.style.position = "absolute";
    svgDefs.style.width = "0";
    svgDefs.style.height = "0";
    svgDefs.innerHTML = `
        <defs>
            <linearGradient id="activeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#2D83EC;" />
                <stop offset="100%" style="stop-color:purple;" />
            </linearGradient>
        </defs>
    `;
    document.body.appendChild(svgDefs);
}

// تنفيذ الكود عند تحميل الصفحة
document.addEventListener("DOMContentLoaded", () => {
    addGradientToSVG();
    updateActiveButton();
});

// تحديث الأزرار عند التنقل
window.addEventListener("popstate", updateActiveButton);
