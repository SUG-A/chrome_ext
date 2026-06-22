chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getDateTimeFromPage") {

        // 1. 画面内のすべての「span.time.dep」要素をまとめて取得する
        // これにより、[<span class="time dep">06:30</span>, <span class="time dep">06:45</span>, ...] のようなリストが取れます
        const timeElements = document.querySelectorAll("ul.time-detail span.time.dep");

        if (timeElements.length > 0) {
            // 2. 取得した要素から、文字（"06:30"など）だけを抜き出して配列にする
            const timeList = Array.from(timeElements).map(el => el.innerText.trim());

            // 3. 見つかった時間の配列をポップアップ側に送り返す
            sendResponse({
                success: true,
                times: timeList  // 単数形 time から 複数形 times に変更
            });
        } else {
            sendResponse({ success: false, error: "画面から出発時間（time dep）が見つかりませんでした。" });
        }
    }
    return true;
});