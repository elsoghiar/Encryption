document.addEventListener("DOMContentLoaded", initializeEventListen);

function initializeEventListen() {
    document.getElementById("Instant-supportt").addEventListener("click", function() {
        toggleView("Instant-support");
    });

    document.getElementById("Qexx-wallet-addresss").addEventListener("click", function() {
        toggleView("Qexx-wallet-address");
    });
}

function toggleView(activeId) {
    const containers = document.querySelectorAll(".contentsu");
    containers.forEach(container => {
        if (container.id === activeId) {
            container.classList.remove("hidden");
        } else {
            container.classList.add("hidden");
        }
    });

    // تحديث حالة الزر النشط
    document.querySelectorAll(".tabs button").forEach(btn => {
        btn.classList.remove("active");
    });
    document.getElementById(activeId + "s").classList.add("active");
}

const tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
    manifestUrl: 'https://elsoghiar.github.io/se-ip-s-r/json/saw-ton-manifest.json',
    buttonRootId: 'ton-connect'
});

document.getElementById("payButton").addEventListener("click", async () => {
    try {
        const amountInput = document.getElementById("amountInput").value.trim();
        if (!amountInput || isNaN(amountInput) || parseFloat(amountInput) <= 0) {
            showNotification("Enter a valid amount", "error");
            return;
        }

        if (!tonConnectUI.account) {
            tonConnectUI.openModal();
            return;
        }

        const requiredAmount = parseFloat(amountInput);
        const amount = (requiredAmount * 1e9).toString();
        const recipientAddress = "UQCpMg6TV_zE34ao-Ii2iz5M6s5Qp8OIVWa3YbsB9KwxzwCJ";
        const transaction = {
            validUntil: Math.floor(Date.now() / 1000) + 600,
            messages: [{ address: recipientAddress, amount }],
        };

        await tonConnectUI.sendTransaction(transaction);
        showNotification("✅ Payment successful!", "success");
    } catch (error) {
        console.error("Payment error:", error);
        showNotification("❌ Payment failed: " + (error.message || "Unknown error"), "error");
    }
});

function copyAddress() {
    const addressElement = document.getElementById("walletAddress");
    if (!addressElement || !addressElement.innerText.trim()) {
        showNotification("No address found to copy", "error");
        return;
    }

    navigator.clipboard.writeText(addressElement.innerText.trim())
        .then(() => showNotification("📋 Address copied to clipboard!", "success"))
        .catch(err => showNotification("❌ Failed to copy address: " + err, "error"));
}

let notificationTimeout;
function showNotification(message, type = "success") {
    const notification = document.getElementById("notification");
    if (!notification) return;

    clearTimeout(notificationTimeout);
    notification.innerHTML = message;
    notification.className = `notification-${type}`;
    notification.style.opacity = "1";
    notification.style.display = "block";

    notificationTimeout = setTimeout(() => {
        notification.style.opacity = "0";
        setTimeout(() => notification.style.display = "none", 500);
    }, 2500);
}

