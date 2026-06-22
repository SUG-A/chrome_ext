document.addEventListener("DOMContentLoaded", () => {
  // 画面が開かれたときにアラーム一覧を表示
  updateAlarmList();

  // 手動追加ボタン（時間だけ取得）
  document.getElementById("addAlarmBtn").addEventListener("click", () => {
    const timeInput = document.getElementById("alarmTime").value; // "15:30" など
    if (!timeInput) return;

    createChromeAlarm(timeInput);
    document.getElementById("alarmTime").value = "";
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
            alert(response?.error || "時間の取得に失敗しました。");
            return;
          }

          const addedTimes = response.times; // 例: ["06:30", "06:50"]

          addedTimes.forEach((time) => {
            createChromeAlarm(time); // すでに作ってある関数を使い回して1個ずつ登録！
          });

          alert(`URL認証成功：画面から ${addedTimes.length} 件のアラームを一括設定しました！`);
        });
      } else {
        alert("開いているURLが違います");
      }
    });
  });
});

// 時間（HH:MM）だけを使ってアラームをセットする関数
function createChromeAlarm(timeStr) {
  const [hour, minute] = timeStr.split(":").map(Number);
  const now = new Date();
  const target = new Date();

  // 今日の指定時間にセット
  target.setHours(hour, minute, 0, 0);

  // もし指定された時間が「すでに過ぎた過去の時間」なら、処理を中断する
  if (target <= now) {
    alert("過去の時間は設定できません。本日これからの時間を指定してください。");
    return; // ここで処理を終わらせることで、ChromeアラームもStorageも登録されません
  }

  // アラーム名はシンプルに「notify_15:30」
  const alarmName = `notify_${timeStr}`;
  chrome.alarms.create(alarmName, { when: target.getTime() });

  // 一覧表示用に保存（ここも時間だけの単純な文字列）
  chrome.storage.local.get({ userAlarms: [] }, (data) => {
    const userAlarms = data.userAlarms;
    if (!userAlarms.includes(timeStr)) {
      userAlarms.push(timeStr);
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
      .map(a => ({
        fullName: a.name,             // 例: "notify_15:30"
        display: a.name.replace("notify_", "") // 例: "15:30"
      }))
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