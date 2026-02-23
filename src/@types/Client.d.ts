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