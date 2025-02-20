document.addEventListener("DOMContentLoaded", function () {
    if (typeof TonConnectUI === "undefined") {
        console.error("TonConnectUI is not defined. Ensure the script is loaded.");
        return;
    }

    const tonConnectUI = new TonConnectUI({
        manifestUrl: 'https://elsoghiar.github.io/se-ip-s-r/json/spark-ton-manifest.json',
        buttonRootId: 'ton-connect', 
        uiOptions: { twaReturnUrl: 'https://t.me/SparkOne_Bot' },
    });

    function getWalletAddress() {
        return tonConnectUI.connected ? tonConnectUI.account.address : null;
    }

    async function connectToWallet() {
        try {
            await tonConnectUI.connect();
            return getWalletAddress();
        } catch (error) {
            console.error("Error connecting to wallet:", error);
            return null;
        }
    }

    async function ensureWalletConnected() {
        let walletAddress = getWalletAddress();
        if (!walletAddress) {
            walletAddress = await connectToWallet();
        }
        return walletAddress;
    }

    async function handlePayment() {
        const amountInput = parseFloat(document.getElementById("amountInput").value);
        if (!amountInput || amountInput <= 0) {
            alert("Please enter a valid amount.");
            return;
        }

        const walletAddress = await ensureWalletConnected();
        if (!walletAddress) {
            alert("Wallet connection failed.");
            return;
        }

        try {
            const amount = (amountInput * 1e9).toString();
            const recipientAddress = "UQBPlXtbw-tBxfzovzo3c4HYcdyyQkaw1KnP3L45s2syeTUS";

            const transaction = {
                validUntil: Math.floor(Date.now() / 1000) + 600,
                messages: [{ address: recipientAddress, amount }],
            };

            if (!tonConnectUI.sendTransaction) {
                alert("TON Connect UI is not properly initialized.");
                return;
            }

            await tonConnectUI.sendTransaction(transaction);
        } catch (error) {
            if (error.message.includes("User rejected the transaction")) {
                alert("You canceled the transaction.");
            } else {
                alert("An error occurred during payment. Please try again.");
                console.error("Payment error:", error);
            }
        }
    }

    document.getElementById("payButton").addEventListener("click", handlePayment);

    function copyAddress() {
        navigator.clipboard.writeText(document.getElementById("walletAddress").innerText);
    }
});
