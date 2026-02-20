// コマンドに関する型をまとめたファイル

import type { Client, CommandInteraction, SlashCommandBuilder } from "discord.js";

// exportするコマンドのデータの型
declare global {
  interface Command {
    data: SlashCommandBuilder;
    // 秒数で指定
    cooldown?: number;
    // 非同期(async)関数だから返値はPromise
    execute: (interaction: CommandInteraction, client: Client) => Promise<void>;
    
  }
}