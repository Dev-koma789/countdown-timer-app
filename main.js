"use strict";

/*
====================================================
Countdown Timer Application
====================================================

【概要】
- 分・秒指定のカウントダウンタイマー
- START / STOP / RESET 対応
- 一時停止・再開可能
- 終了時にアラーム音＋画面点滅

【設計の中心】
- timerState（状態）で全挙動を制御
- 時間計算は endTime を基準に行う
- UI制御とロジックを明確に分離
*/

/* ============================================
   定数・状態名
   ============================================ */

const TIMER_STATE = {
  IDLE: "idle", // 初期状態・時間設定中
  RUNNING: "running", // タイマー実行中
  PAUSED: "paused", // 一時停止・終了後
};

/* ============================================
   DOM取得
   ============================================ */

// 時間表示
const timeMain = document.getElementById("time-main"); // mm:ss
const timeMs = document.getElementById("time-ms"); // .ms

// 操作ボタン
const startBtn = document.getElementById("start");
const stopBtn = document.getElementById("stop");
const resetBtn = document.getElementById("reset");

// 時間設定ボタン
const minUp = document.getElementById("min-up");
const minDown = document.getElementById("min-down");
const secUp = document.getElementById("sec-up");
const secDown = document.getElementById("sec-down");

// タイマー表示エリア（点滅用）
const timerArea = document.getElementById("timer");

// アラーム音
const alarm = new Audio("alarm.mp3");
alarm.loop = false;

/* ============================================
   状態変数（アプリの記憶）
   ============================================ */

let timerState = TIMER_STATE.IDLE; // 現在の状態
let intervalId = null; // setInterval のID

let endTime = 0; // 終了予定時刻（絶対時刻）
let remainingTime = 0; // 一時停止時の残り時間（ms）

// 設定中の時間（idle時のみ操作）
let setMinutes = 0;
let setSeconds = 0;

/* ============================================
   表示関連（表示専用）
   ============================================ */

/**
 * 分・秒・ミリ秒を画面に反映する
 * 表示だけを担当し、状態判断はしない
 * 引数なしで呼ばれたら(分 = setMinutes, 秒 = setSeconds, ミリ秒 = 0) を使う
 */
function updateDisplay(m = setMinutes, s = setSeconds, ms = 0) {
  timeMain.textContent = `${String(m).padStart(2, "0")}:${String(s).padStart(
    2,
    "0"
  )}`;
  timeMs.textContent = `.${String(ms).padStart(2, "0")}`;
}

/* ============================================
   UI制御（ボタンの有効・無効）
   ============================================ */

/**
 * timerState を見て UI を切り替える
 */
function updateUI() {
  // START：実行中は無効
  startBtn.disabled = timerState === TIMER_STATE.RUNNING;
  startBtn.classList.toggle("inactive", startBtn.disabled);

  // STOP：実行中のみ有効
  stopBtn.disabled = timerState !== TIMER_STATE.RUNNING;
  stopBtn.classList.toggle("inactive", stopBtn.disabled);

  // RESET：paused のときのみ有効
  resetBtn.disabled = timerState !== TIMER_STATE.PAUSED;
  resetBtn.classList.toggle("inactive", resetBtn.disabled);

  // ▲▼：idle のときのみ操作可能
  const editable = timerState === TIMER_STATE.IDLE;
  [minUp, minDown, secUp, secDown].forEach((btn) => {
    btn.disabled = !editable;
    btn.classList.toggle("inactive", btn.disabled);
  });
}

/* ============================================
   アラーム制御
   ============================================ */

/**
 * アラーム音と画面点滅を停止する
 */
function stopAlarm() {
  alarm.pause();
  alarm.currentTime = 0;
  timerArea.classList.remove("alarming");
}

/* ============================================
   メインロジック（カウント処理）
   ============================================ */

/**
 * running 中に一定間隔で呼ばれる
 * endTime を基準に残り時間を計算する
 */
function tick() {
  if (timerState !== TIMER_STATE.RUNNING) return;

  const diff = endTime - Date.now(); // 残り時間（ms）

  // タイマー終了
  if (diff <= 0) {
    clearInterval(intervalId);
    intervalId = null;
    remainingTime = 0;

    timerState = TIMER_STATE.PAUSED;

    // アラーム開始
    alarm.currentTime = 0;
    alarm.play();
    timerArea.classList.add("alarming");

    updateDisplay(0, 0, 0);
    updateUI();
    return;
  }

  // ms → 分・秒・ミリ秒へ変換
  const totalSeconds = Math.floor(diff / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const milliseconds = Math.floor((diff % 1000) / 10);

  updateDisplay(minutes, seconds, milliseconds);
}

/* ============================================
   イベントリスナー
   ============================================ */

// START（新規 or 再開）
startBtn.addEventListener("click", () => {
  if (timerState === TIMER_STATE.IDLE) {
    const totalSeconds = setMinutes * 60 + setSeconds;
    if (totalSeconds <= 0) return;
    endTime = Date.now() + totalSeconds * 1000;
  }

  if (timerState === TIMER_STATE.PAUSED) {
    endTime = Date.now() + remainingTime;
  }

  timerState = TIMER_STATE.RUNNING;
  intervalId = setInterval(tick, 10);
  updateUI();
});

// STOP（一時停止）
stopBtn.addEventListener("click", () => {
  if (timerState !== TIMER_STATE.RUNNING) return;

  clearInterval(intervalId);
  intervalId = null;

  remainingTime = endTime - Date.now();
  timerState = TIMER_STATE.PAUSED;

  updateUI();
});

// RESET（完全初期化）
resetBtn.addEventListener("click", () => {
  if (timerState !== TIMER_STATE.PAUSED) return;

  clearInterval(intervalId);
  intervalId = null;

  stopAlarm();

  timerState = TIMER_STATE.IDLE;
  remainingTime = 0;
  setMinutes = 0;
  setSeconds = 0;

  updateDisplay();
  updateUI();
});

// 時間設定（idle時のみ）
minUp.onclick = () => {
  if (timerState !== TIMER_STATE.IDLE) return;
  setMinutes = setMinutes === 60 ? 0 : setMinutes + 1;
  updateDisplay();
};

minDown.onclick = () => {
  if (timerState !== TIMER_STATE.IDLE) return;
  setMinutes = setMinutes === 0 ? 60 : setMinutes - 1;
  updateDisplay();
};

secUp.onclick = () => {
  if (timerState !== TIMER_STATE.IDLE) return;
  setSeconds++;
  if (setSeconds === 60) {
    setSeconds = 0;
    setMinutes = Math.min(setMinutes + 1, 60);
  }
  updateDisplay();
};

secDown.onclick = () => {
  if (timerState !== TIMER_STATE.IDLE) return;
  if (setSeconds === 0) {
    if (setMinutes === 0) return;
    setMinutes--;
    setSeconds = 59;
  } else {
    setSeconds--;
  }
  updateDisplay();
};

/* ============================================
   初期化
   ============================================ */

updateDisplay();
updateUI();
