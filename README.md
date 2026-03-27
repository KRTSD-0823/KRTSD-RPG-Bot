# はじめに
このDiscord Botはほぼ自分のサーバーのためだけに存在していると言えるBotです。  
コードの見づらさや間違いなどなど、突っ込むところしかないと思いますが、あくまで自己満足で作ったものなので温かい目でコードを見守ってください。
# 個別で用意するファイル
- `src/config.json`：BotのトークンやID含む機密情報が書かれたファイル。  
  ```
  {
    // Botのトークン
    token: "Bot_Token",
    // BotのID
    clientId: "Bot_Client_ID",
    // コマンドを登録するサーバーのID
    guildId: "Server_ID"
  }
  ```
- `src/users_data.json`：ユーザーのステータスを保存しておくファイル。空(`{}`のみを書く)でOK。
# コマンドについて
package.jsonを見れば分かると思いますが、一応`npm run (任意のコマンド)`で使えるコマンドをまとめておきます。  
例：`npm run compile`(コンパイルするコマンドを実行)
- test：`src`フォルダー内の`main.ts`を直接実行。
- start：`build`フォルダーにあるコンパイルされた`main.js`を実行。事前にコンパイルをしておく必要がある。
- compile：`src`内のファイルおよびフォルダーをコンパイルする。
- all：compileとstartを合わせたもの。
# ライセンスについて  
`LICENSE`を参照してください。
