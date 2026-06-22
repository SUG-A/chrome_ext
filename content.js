chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getDateTimeFromPage") {

        // 【要カスタマイズ】画面内の時間が入っている要素のIDやクラスを指定してください
        const timeElement = document.querySelector("#target-time");

        if (timeElement) {
            sendResponse({
                success: true,
                time: timeElement.innerText.trim()  // 例: "15:30" 
            });
        } else {
            sendResponse({ success: false, error: "画面から時間が見つかりませんでした。" });
        }
    }
    return true;
});