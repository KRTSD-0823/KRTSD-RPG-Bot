// discord.jsのClientを拡張するためのファイル

import type { Collection } from "discord.js";

// client.commandsとstatusNameを参照しようとした時の警告を無くすために必要
// Collection使うときには適宜追加
declare module "discord.js" {
	interface Client {
		// コマンドのデータ
		commands: Collection<string, Command>;
		// クールダウン(主にコマンド)
		cooldown: Collection<string, Cooldown>;
		// characterコマンドでのステータス名の保存用(character.ts:234を参照)
		statusName: Collection<string, string>;
	}
}