// main.tsでexportした関数などの型をまとめたファイル

import { Client, ChatInputCommandInteraction} from "discord.js";

// 色の型
declare global {
  interface BotColor {
    // タプル型
    [key: string]: Array<number, number, number>;
  }
}

// 使える関数
declare global {
  function checkCommandCooldown(client: Client, interaction: ChatInputCommandInteraction, commandName: string): boolean;
  function executeCommandCooldown(client: Client, interaction: ChatInputCommandInteraction, cooldownData: CooldownData): void;
}