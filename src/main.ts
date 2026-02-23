// const fs = require("node:fs");
// const path = require("node:path");
import fs from "node:fs";
import path from "node:path";

// __dirname, __filenameの宣言
// ES moduleでは元から宣言されていない
const __dirname = import.meta.dirname;
const __filename = import.meta.filename;

// tsファイルでのテストとjsファイルでの実行の時で拡張子が変わるから、あらかじめ拡張子を宣言しておく
const extension = __filename.slice(-2);

import { Client, GatewayIntentBits, Collection, Events, MessageFlags } from "discord.js";
import type { Message, Interaction, SlashCommandBuilder, ChatInputCommandInteraction, SlashCommandSubcommandBuilder } from "discord.js";

// 必要な情報を取得
import config from "./config.json" with { type: "json" };
const { token, clientId, guildId } = config;

// clientの設定
const client: Client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

// 色(埋め込みなど)を他ファイルでも読み込めるようにする
const color = {
  default: [255, 120, 80]
};

// あるディレクトリから別のディレクトリまでの相対パスを返す関数
function getRelativePath(from: string, to: string) {
  return `./${path.relative(from, to)}`;
}

// 現在時刻のタイムスタンプを秒単位で返す
function getNowTimestamp() {
  return Math.floor(Date.now() / 1000);
}

// コマンド実行時のユーザーのクールダウンの処理をする関数
function checkCommandCooldown(client: Client, interaction: ChatInputCommandInteraction, cooldownData: CooldownData) {
  // 取り出す
  const { commandName, command } = cooldownData;

  // クールダウンが存在しないコマンドなら中断
  if (!("cooldown" in command)) return false;

  // ユーザーごとのクールダウンを読み込む
  const cooldown = client.cooldown.get(interaction.user.id);
  const userCooldown = cooldown?.[commandName] ?? 0;
  const nowTimestamp = getNowTimestamp();
  // クールダウン中か判定する
  if (nowTimestamp < userCooldown) {
    // クールダウンの時
    // 次に実行できる時間のタイムスタンプを取得
    const nextTimestamp = userCooldown?.toString();
    // 返信
    interaction.reply({
      content: `クールダウン中です。\`${commandName}\`は <t:${nextTimestamp}:R> に使用できます。`,
      flags: MessageFlags.Ephemeral
    });
    return true;
  } else {
    // クールダウン中じゃない時
    // クールダウンを設定
    client.cooldown.set(interaction.user.id, {
      [commandName]: nowTimestamp + command.cooldown
    });
    return false;
  }
}

// 他のファイルから読み込めるようにする
export default {
  color
};

// 非推奨ではある
// グローバル化(?)する(要するに、どのファイルからもアクセスできるようにする)
(globalThis as any).checkCommandCooldown = checkCommandCooldown;

// コマンドをDiscordに登録する
(async () => {
  // Discordに登録用のコマンドのデータを入れる場所
  const commands = [];
  const commandsFolderPath = path.join(__dirname, "commands");
  // 拡張子をフィルターする
  const commandsFolder = fs.readdirSync(commandsFolderPath).filter((name: string) => name.endsWith(extension));
  for (const fileName of commandsFolder) {
    // (main.js/main.tsから)ファイルまでのパスを取得
    const commandPath = path.join(commandsFolderPath, fileName);
    // コマンドのファイルまでの相対パスを取得
    const relativePath = getRelativePath(__dirname, commandPath);
    // importは絶対パスを使うことができない
    const command: OriginCommand | OriginSubcommand = await import(relativePath);
    const data = command.default;

    // importしたcommandがサブコマンドならスキップ(次に進む)
    if ("isSubcommand" in data) continue;

    // 挿入
    commands.push(data.data.toJSON());
  }

  const { REST, Routes } = await import("discord.js");
  const rest = new REST().setToken(token);
  // // 一度初期化
  // await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: null});
  // 登録
  await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
})();

// コマンドの処理を保存しておくための初期化
client.commands = new Collection();
// サブコマンド用の処理も
client.subcommands = new Collection();

{
  const commandsFolderPath = path.join(__dirname, "commands");
  const commandsFolder = fs.readdirSync(commandsFolderPath).filter((name: String) => name.endsWith(extension));
  for (const fileName of commandsFolder) {
    const commandPath = path.join(commandsFolderPath, fileName);
    const relativePath = getRelativePath(__dirname, commandPath);
    (async () => {
      const command: OriginCommand | OriginSubcommand = await import(relativePath);
      const data = command.default;
      // サブコマンドかどうか判定
      if (!("isSubcommand" in data)) {
        // サブコマンドじゃない時
        // 設定
        client.commands.set(data.data.name, data);
      } else {
        // サブコマンドの時
        // 拡張子を消したファイル名
        const fileName = path.basename(commandPath, `.${extension}`);
        // サブコマンドの処理を設定
        client.subcommands.set(fileName, data);
      }
    })();
  }
}

// 任意のCollectionの設定
client.statusName = new Collection();
client.cooldown = new Collection();

// Botへのログイン時
client.once(Events.ClientReady, () => {
  console.log(`${client.user?.tag} にログインしました。`);
});

// メッセージの受信時
// client.on(Events.MessageCreate, async (message: Message) => {
//   // 送信者がBotか自身なら無視
//   if (message.author.bot || client.user!.id === message.author.id) return;

//   // await message.reply("I was made of TypeScript!");
// });

// コマンドの受信時
client.on(Events.InteractionCreate, async (interaction: Interaction) => {
  if (!interaction.isChatInputCommand()) return;

  // コマンド名を取得
  const { commandName } = interaction;

  // 設定されたコマンドを読み込む
  const command = client.commands.get(commandName);

  // コマンドの処理が設定されているかチェック
  if (typeof command === "undefined" || !("execute" in command)) {
    // コマンドの処理が設定されていなかった場合
    await interaction.reply({
      content: "このコマンドは未実装です。",
      flags: MessageFlags.Ephemeral
    });
    // 中断
    return;
  }

  // クールダウンの情報をデータにする
  const cooldownData = {
    commandName,
    command
  };
  // クールダウン中か判定・設定
  const isCooldown = checkCommandCooldown(client, interaction, cooldownData);
  // クールダウン中なら中断
  if (isCooldown) return;

  // エラーハンドリング
  try {
    // 処理の実行
    await command.execute(interaction, client);
  } catch (e) {
    // エラー時
    console.error(e);

    if (!interaction.replied) {
      interaction.reply({
        content: "エラーが発生しました。",
        flags: MessageFlags.Ephemeral
      });
    } else {
      interaction.followUp({
        content: "エラーが発生しました。",
        flags: MessageFlags.Ephemeral
      });
    }
  }
});

// Botにログイン
client.login(token);