// コマンドに関する型をまとめたファイル

import type { Client, SlashCommandBuilder, SlashCommandSubcommandBuilder, ChatInputCommandInteraction } from "discord.js";

// exportするコマンドのデータの型
declare global {
	interface Command {
		// サブコマンドが設定されてる場合も考慮
		data: SlashCommandBuilder | SlashCommandBuilder<SlashCommandSubcommandBuilder>;
		// 秒数で指定
		cooldown?: number;
		// 非同期(async)関数だから返値はPromise
		execute?: (interaction: ChatInputCommandInteraction, client: Client) => Promise<void>;
	}
}

// サブコマンドの型
declare global {
	interface Subcommand {
		isSubcommand: true;
		cooldown?: number;
		execute: (interaction: ChatInputCommandInteraction, client: Client) => Promise<void>;
	}
}

// コマンドのファイルをimportした時の中身の型
declare global {
	interface OriginCommand {
		default: Command
	}
	interface OriginSubcommand {
		default: Subcommand
	}
}