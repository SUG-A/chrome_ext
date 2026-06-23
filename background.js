// アラームを受け取るリスナー（時間になったらOSのシステム通知を出すだけ）
chrome.alarms.onAlarm.addListener((alarm) => {
    // 「notify_」から始まるアラームの時だけ処理する
    if (alarm.name.startsWith("notify_")) {

        // "notify_08:30_朝会" -> "08:30_朝会" -> ["08:30", "朝会"]
        const parts = alarm.name.replace("notify_", "").split("_");
        const displayTime = parts[0]; // "08:30"
        const displayTitle = parts[1] || "予定"; // "朝会"

        // システム通知を表示
        chrome.notifications.create({
            type: "basic",
            // ESMの文字が入ったアイコン
            iconUrl: "icon.png",
            title: `${displayTitle}の時間です`, // ★ タイトルを通知の題名にする
            message: `${displayTime}になりました。次の行動に移りましょう！`
        });

        // 鳴り終わった単発アラームは一覧(storage)から削除する
        const storageStr = `${displayTime} ${displayTitle}`; // "08:30 朝会"
        chrome.storage.local.get({ userAlarms: [] }, (data) => {
            // storageStr以外のアラームだけを残す
            const updated = data.userAlarms.filter(t => t !== storageStr);
            chrome.storage.local.set({ userAlarms: updated });
        });
    }
});