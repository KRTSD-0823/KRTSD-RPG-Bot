// discord.jsのClientを拡張するためのファイル

import type { Client, Collection, ChatInputCommandInteraction, SlashCommandBuilder, SlashCommandSubcommandBuilder } from "discord.js";

// クールダウンに関する型
declare global {
	// ユーザーのクールダウンの型
	interface Cooldown {
		// ユーザーID：タイムスタンプという形式
		[key: string]: number;
	}
	// 関数に渡す用
	interface CooldownData {
		commandName: string;
		command: Command | Subcommand;
	}
}

// client.commandsとstatusNameを参照しようとした時の警告を無くすために必要
// Collection使うときには適宜追加
declare module "discord.js" {
	interface Client {
		// コマンドのデータ
		commands: Collection<string, Command>;
		// サブコマンドのデータ
		subcommands: Collection<string, Subcommand>;
		// クールダウン(主にコマンド)
		cooldown: Collection<string, Cooldown>;
		// characterコマンドでのステータス名の保存用(character.ts:234を参照)
		statusName: Collection<string, string>;
	}
}