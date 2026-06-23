document.addEventListener("DOMContentLoaded", () => {
  // 画面が開かれたときにアラーム一覧を表示
  updateAlarmList();

  // ★【新設】ポップアップを開いたときに、前回保存した「マイナス分数」を読み込む
  chrome.storage.local.get(["savedMinusMinutes"], (result) => {
    if (result.savedMinusMinutes !== undefined) {
      document.getElementById("minusMinutes").value = result.savedMinusMinutes;
    }
  });

  // ★【新設】「マイナス分数」の入力欄が変更されたら、その瞬間に自動保存する
  document.getElementById("minusMinutes").addEventListener("input", (e) => {
    const val = parseInt(e.target.value, 10) || 0;
    chrome.storage.local.set({ savedMinusMinutes: val });
  });

  // 手動追加ボタン（時間だけ取得）
  document.getElementById("addAlarmBtn").addEventListener("click", () => {
    const timeInput = document.getElementById("alarmTime").value; // "15:30" など
    const titleInput = document.getElementById("alarmTitle").value.trim(); // "朝会"

    // 手動の時はどっちも必須
    if (!timeInput || !titleInput) {
      alert("時間と予定名はどちらも必須入力です！");
      return;
    }

    createChromeAlarm(timeInput, titleInput);

    // 入力欄をリセット
    document.getElementById("alarmTime").value = "";
    document.getElementById("alarmTitle").value = "";
  });

  // 画面から時間のみ取得して追加（URL認証付き）
  document.getElementById("getFromFileBtn").addEventListener("click", async () => {

    // 1. 今開いているタブの情報を取得
    // [tab]:配列の最初だけ持ってきてる
    // active: true → 今開いているタブを取得
    // currentWindow: true → 今クリックしているウィンドウのタブを取得
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;

    chrome.storage.local.get(["savedUrl"], (result) => {
      const savedUrl = result.savedUrl;
      if (!savedUrl) {
        alert("先にオプションからURLを設定してください。");
        return;
      }

      if (tab.url.startsWith(savedUrl)) {
        // content.jsから時間だけをもらう
        chrome.tabs.sendMessage(tab.id, { action: "getDateTimeFromPage" }, (response) => {
          // chrome.runtime.lastError:拡張機能システム自体のエラー
          // !response: content.jsからの返却値がundefinedの場合
          // !response.success: content.jsでページ内処理の失敗チェック
          if (chrome.runtime.lastError || !response || !response.success) {
            alert(response?.error || "取得に失敗しました。");
            return;
          }

          // ★ 拡張画面に入力された「マイナスしたい分数」を取得（例: 5）
          const minusMinutes = parseInt(document.getElementById("minusMinutes").value, 10) || 0;

          let successCount = 0;

          // 画面から取れた[{time, title}, ...]をループで回して登録
          response.schedules.forEach((item) => {
            // ★ ここで時間をマイナスする関数を挟む！
            // 例: item.time が "10:00" で minusMinutes が 5 なら "09:55" が返る
            const calculatedTime = minusTime(item.time, minusMinutes);

            // 計算後の時間でアラームを登録
            // タイトルに「(5分前)」と自動で付くようにすると通知の時に親切です
            const displayTitle = minusMinutes > 0 ? `${item.title}(${minusMinutes}分前)` : item.title;

            // 過去の時間でなければ登録（createChromeAlarm側で過去判定をします）
            createChromeAlarm(calculatedTime, displayTitle);
            successCount++;
          });
          alert(`画面から ${successCount} 件の予定を ${minusMinutes} 分前で一括設定しました！`);
        });
      } else {
        alert("開いているURLが違います");
      }
    });
  });
});

// ★【新設】"10:00" から 指定した分数を引き算して "09:55" みたいな文字列を返す関数
function minusTime(timeStr, minutesToMinus) {
  if (minutesToMinus === 0) return timeStr; // 0分前ならそのまま返す

  const [hour, minute] = timeStr.split(":").map(Number);

  // 今日の日付オブジェクトをベースに時間を計算
  const date = new Date();
  date.setHours(hour, minute, 0, 0);

  // 分を引き算する
  date.setMinutes(date.getMinutes() - minutesToMinus);

  // 引き算した結果をまた "HH:MM" の形に整えて戻す
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

// 時間（HH:MM）だけを使ってアラームをセットする関数
function createChromeAlarm(timeStr, titleStr) {
  const [hour, minute] = timeStr.split(":").map(Number);
  const now = new Date();
  const target = new Date();

  // 今日の指定時間にセット
  target.setHours(hour, minute, 0, 0);

  // もし指定された時間が「すでに過ぎた過去の時間」なら、処理を中断する
  if (target <= now) return;

  // アラーム名にタイトルも埋め込む（例: "notify_08:30_朝会"）
  const alarmName = `notify_${timeStr}_${titleStr}`;
  chrome.alarms.create(alarmName, { when: target.getTime() });

  // 画面表示・管理用（"08:30 朝会" の形でお掃除用ストレージに保存）
  const storageStr = `${timeStr} ${titleStr}`;
  chrome.storage.local.get({ userAlarms: [] }, (data) => {
    const userAlarms = data.userAlarms;
    if (!userAlarms.includes(storageStr)) {
      userAlarms.push(storageStr);
      chrome.storage.local.set({ userAlarms }, () => {
        updateAlarmList();
      });
    }
  });
}

// アラーム一覧の更新（文字の分解が不要になり、めちゃくちゃスッキリ！）
function updateAlarmList() {
  const alarmListDiv = document.getElementById("alarmList");
  alarmListDiv.innerHTML = "";

  chrome.alarms.getAll((alarms) => {
    // notify_15:30 から notify_ を消すだけで表示用になる
    const notifyAlarms = alarms
      .filter(a => a.name.startsWith("notify_"))
      .map(a => {
        // "notify_08:30_朝会" から "08:30 朝会" を作る
        const cleanStr = a.name.replace("notify_", "").replace("_", " ");
        return { fullName: a.name, display: cleanStr };
      })
      .sort((a, b) => a.display.localeCompare(b.display));

    if (notifyAlarms.length === 0) {
      alarmListDiv.innerHTML = "<p style='color:gray;'>アラームはありません</p>";
      return;
    }

    notifyAlarms.forEach((itemData) => {
      const item = document.createElement("div");
      item.className = "alarm-item";

      const text = document.createElement("span");
      text.textContent = itemData.display; // 画面には「15:30」とだけ出る

      const deleteBtn = document.createElement("button");
      deleteBtn.className = "delete-btn";
      deleteBtn.textContent = "-";
      deleteBtn.addEventListener("click", () => {
        chrome.alarms.clear(itemData.fullName, () => {
          updateAlarmList();
        });
      });

      item.appendChild(text);
      item.appendChild(deleteBtn);
      alarmListDiv.appendChild(item);
    });
  });
}