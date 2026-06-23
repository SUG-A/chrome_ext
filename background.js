// アラームを受け取るリスナー（時間になったらOSのシステム通知を出すだけ）
chrome.alarms.onAlarm.addListener((alarm) => {
    // 「notify_」から始まるアラームの時だけ処理する
    if (alarm.name.startsWith("notify_")) {

        // "notify_08:30_朝会" -> "08:30_朝会" -> ["08:30", "朝会"]
        const parts = alarm.name.replace("notify_", "").split("_");
        const displayTime = parts[0]; // "08:30"
        const displayTitle = parts[1] || "予定"; // "朝会"

        // 1. 通知用の小さなウインドウのサイズを決める
        const winWidth = 400;
        const winHeight = 220;

        // ★ screen の代わりに chrome.system.display API を使って画面サイズを取得
        chrome.system.display.getInfo((displayInfo) => {
            // メインディスプレイ（通常は配列の先頭）の情報を取得
            const primaryDisplay = displayInfo[0] || { bounds: { width: 1920, height: 1080 } };
            const screenWidth = primaryDisplay.bounds.width;
            const screenHeight = primaryDisplay.bounds.height;

            // 画面中央の座標を計算
            const left = Math.round((screenWidth - winWidth) / 2);
            const top = Math.round((screenHeight - winHeight) / 2);

            // ポップアップウインドウを生成
            chrome.windows.create({
                url: `notification.html?time=${encodeURIComponent(displayTime)}&title=${encodeURIComponent(displayTitle)}`,
                type: "popup",
                width: winWidth,
                height: winHeight,
                left: left,
                top: top,
                focused: true
            });
        });

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