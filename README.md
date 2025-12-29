# countdown-timer-app

Countdown Timer Application（ドットインストールから改造）


【概要】
- 分・秒指定のカウントダウンタイマー
- START / STOP / RESET 対応
- 一時停止・再開可能
- 終了時にアラーム音＋画面点滅

【設計の中心】
- timerState（状態）で全挙動を制御
- 時間計算は endTime を基準に行う
- UI制御とロジックを明確に分離
