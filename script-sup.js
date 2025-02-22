const tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
            manifestUrl: 'https://elsoghiar.github.io/se-ip-s-r/json/saw-ton-manifest.json',
            buttonRootId: 'ton-connect'
        });

        document.getElementById("payButton").addEventListener("click", async () => {
            try {
                const amountInput = document.getElementById("amountInput").value;
                if (!amountInput || parseFloat(amountInput) <= 0) {
                    return;
                }

                const requiredAmount = parseFloat(amountInput);
                const amount = (requiredAmount * 1e9).toString();
                const recipientAddress = "UQCpMg6TV_zE34ao-Ii2iz5M6s5Qp8OIVWa3YbsB9KwxzwCJ";
                const currentTime = Date.now();

                if (!tonConnectUI.account) {
                    tonConnectUI.openModal();
                    return;
                }

                const transaction = {
                    validUntil: Math.floor(currentTime / 1000) + 600,
                    messages: [{ address: recipientAddress, amount }],
                };

                await tonConnectUI.sendTransaction(transaction);
                showNotification("Payment successful!");
            } catch (error) {
                console.error("Payment error:", error);
                showNotification("Payment failed: " + (error.message || "Unknown error"));
            }
        });

        function copyAddress() {
            const address = document.getElementById("walletAddress").innerText;
            navigator.clipboard.writeText(address).then(() => {
                showNotification("Address copied to clipboard!");
            }).catch(err => {
                showNotification("Failed to copy address: " + err);
            });
        }


function showNotification(message, type = "success") {
    let notification = document.getElementById("notification");
    
    notification.style.opacity = "1";
    notification.style.display = "block";
    
    notification.textContent = message;
    notification.className = `notification-${type}`;

    setTimeout(() => {
        notification.style.opacity = "0";
        setTimeout(() => notification.style.display = "none", 500);
    }, 2500);
}
