// main.tsでexportした関数などの型をまとめたファイル

import { Client, ChatInputCommandInteraction} from "discord.js";

declare global {
  function checkCommandCooldown(client: Client, interaction: ChatInputCommandInteraction, commandName: string): boolean;
  function executeCommandCooldown(client: Client, interaction: ChatInputCommandInteraction, cooldownData: CooldownData): void;
}