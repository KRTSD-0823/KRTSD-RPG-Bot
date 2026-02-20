// コマンドのクールダウンの型をまとめたファイル

import { Collection } from "discord.js";

declare global {
  interface Cooldown {
    // ユーザーID：タイムスタンプという形式
    [key: string]: number;
  }
}