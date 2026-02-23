// main.tsでexportした関数などの型をまとめたファイル

import { Client, ChatInputCommandInteraction} from "discord.js";

declare global {
  // 色の型
  interface BotColor {
    // タプル型
    [key: string]: Array<number, number, number>;
  }
}

// 関数
declare global {
  // クールダウンか確認して設定する関数
  function checkCommandCooldown(client: Client, interaction: ChatInputCommandInteraction, cooldownData: CooldownData): boolean;
}