// main.tsでexportした関数などの型をまとめたファイル

import { Client, ChatInputCommandInteraction} from "discord.js";

declare global {
  // 色の型
  interface BotColor {
    // タプル型
    [key: string]: Array<number, number, number>;
  }
}