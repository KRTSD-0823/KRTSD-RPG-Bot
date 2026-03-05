// コマンドに関する型をまとめたファイル

import type { Client, SlashCommandBuilder, SlashCommandSubcommandBuilder, ChatInputCommandInteraction, Interaction, AutocompleteInteraction } from "discord.js";

// 受け取るインタラクションの型
type Interactions = ChatInputCommandInteraction | AutocompleteInteraction;

// exportするコマンドのデータの型
declare global {
	interface Command {
		// サブコマンドが設定されてる場合も考慮
		data: SlashCommandBuilder | SlashCommandBuilder<SlashCommandSubcommandBuilder>;
		// 秒数で指定
		cooldown?: number;
		// 非同期(async)関数だから返値はPromise
		autocomplete?: (interaction: AutocompleteInteraction) => Promise<void>;
		execute?: (interaction: Interactions, client: Client) => Promise<void>;
	}
}

// サブコマンドの型
declare global {
	interface Subcommand {
		isSubcommand: true;
		cooldown?: number;
		autocomplete?: (interaction: AutocompleteInteraction) => Promise<void>;
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