// アラームを受け取るリスナー（時間になったらOSのシステム通知を出すだけ）
chrome.alarms.onAlarm.addListener((alarm) => {
    // 「notify_」から始まるアラームの時だけ処理する
    if (alarm.name.startsWith("notify_")) {

        // "notify_15:30" から "notify_" を削るだけで「15:30」が手に入る！
        const displayTime = alarm.name.replace("notify_", "");

        // システム通知を表示
        chrome.notifications.create({
            type: "basic",
            // ESMの文字が入った青いSVGアイコン
            iconUrl: "icon.png",
            title: "アラーム",
            message: `${displayTime}になりました`
        });

        // 鳴り終わった単発アラームは一覧(storage)から削除する
        chrome.storage.local.get({ userAlarms: [] }, (data) => {
            // displayTime以外のアラームだけを残す
            const updated = data.userAlarms.filter(t => t !== displayTime);
            chrome.storage.local.set({ userAlarms: updated });
        });
    }
});