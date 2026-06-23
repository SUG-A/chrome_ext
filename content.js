chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getDateTimeFromPage") {

        // 1. 画面内のすべての「span.time.dep」要素をまとめて取得する
        // これにより、[<span class="time dep">06:30</span>, <span class="time dep">06:45</span>, ...] のようなリストが取れます
        const elements = document.querySelectorAll(".schedule-text");
        const scheduleList = []; // オブジェクトの配列に変える

        // 2. 取得した要素から、時間と予定名を分割して配列のオブジェクトにする
        elements.forEach(el => {
            const fullText = el.innerText.trim(); // 例: "08:30 朝会"
            if (fullText) {
                const parts = fullText.split(/[\s ]+/);
                const timePart = parts[0];
                // 2個目以降の文字を結合して予定名にする（空白引越し対策）
                const titlePart = parts.slice(1).join(" ") || "予定";

                if (timePart.includes(":")) {
                    scheduleList.push({ time: timePart, title: titlePart });
                }
            }
        });

        if (scheduleList.length > 0) {
            // 3. 見つかった時間の配列をポップアップ側に送り返す
            sendResponse({ success: true, schedules: scheduleList });
        } else {
            sendResponse({ success: false, error: "スケジュールが見つかりませんでした。" });
        }
    }
    return true;
});