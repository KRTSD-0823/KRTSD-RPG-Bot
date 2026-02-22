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
export const color = {
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

// コマンド実行時にユーザーがクールダウン中か判定する
function checkCommandCooldown(client: Client, interaction: ChatInputCommandInteraction, commandName: string) {
  // ユーザーごとのクールダウンを読み込む
  const cooldown = client.cooldown.get(interaction.user.id);
  const userCooldown = cooldown?.[commandName] ?? 0;
  const nowTimestamp = getNowTimestamp();
  // クールダウン中か判定する
  if (nowTimestamp < userCooldown) {
    // クールダウン中の時
    return true;
  } else {
    // クールダウン中じゃない時
    return false;
  }
}

// ユーザーの指定のコマンドのクールダウンの処理をする
function executeCommandCooldown(client: Client, interaction: ChatInputCommandInteraction, cooldownData: CooldownData) {
  const { commandName, commandCooldown, isCooldown } = cooldownData;
  // ユーザーに設定されているクールダウン解除の時間のタイムスタンプを取得
  // 設定されていないなら0になるようにしている
  const userCooldown = client.cooldown.get(interaction.user.id)?.[commandName] ?? 0;
  // 現在時刻のタイムスタンプを取得
  const nowTimestamp = getNowTimestamp();
  if (!isCooldown) {
    // クールダウンじゃない時
    // クールダウンを設定
    client.cooldown.set(interaction.user.id, {
      [commandName]: nowTimestamp + commandCooldown
    });
  } else {
    // クールダウンの時
    // 次に実行できる時間のタイムスタンプを取得
    const nextTimestamp = userCooldown?.toString();
    interaction.reply({
      content: `クールダウン中です。\`${commandName}\`は <t:${nextTimestamp}:R> に使用できます。`,
      flags: MessageFlags.Ephemeral
    });
  }
}

// 非推奨ではある
// グローバル化(?)（要するに、どのファイルからもアクセスできるようにする）
(globalThis as any).checkCommandCooldown = checkCommandCooldown;
(globalThis as any).executeCommandCooldown = executeCommandCooldown;

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

  // クールダウンの存在確認
  if ("cooldown" in command) {
    // コマンドのクールダウンを取得
    const commandCooldown = command.cooldown;
    // クールダウン中か判定
    const isCooldown = checkCommandCooldown(client, interaction, commandName);
    // データの設定
    const cooldownData = {
      commandName,
      commandCooldown,
      isCooldown
    }
    // 設定
    executeCommandCooldown(client, interaction, cooldownData);
  }

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