// const fs = require("node:fs");
// const path = require("node:path");
import fs from "node:fs";
import path from "node:path";

// __dirname, __filenameの宣言
// ES moduleでは元から宣言されていない
const __dirname = import.meta.dirname;
const __filename = import.meta.filename;
// tsファイルでのテストとjsファイルでの実行の時で拡張子が変わるから、あらかじめ拡張子を宣言しておく
const extension: string = __filename.slice(-2);

// const { Client, Message, Interaction, GatewayIntentBits, Collection, Events } = require("discord.js");
import { Client, GatewayIntentBits, Collection, Events, MessageFlags } from "discord.js";
import type { Message, Interaction, SlashCommandBuilder } from "discord.js";

// 必要な情報を取得
import config from "./config.json" with { type: "json" };

const client: Client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });
// const { token, clientId, guildId } = require("./config.json");
const { token, clientId, guildId } = config;

// あるディレクトリから別のディレクトリまでの相対パスを返す関数
function getRelativePath(from: string, to: string): string {
  return `./${path.relative(from, to)}`;
}

// 現在時刻のタイムスタンプを秒単位で返す
function getNowTimestamp(): number {
  return Math.floor(Date.now() / 1000);
}

// コマンドをDiscordに登録する
(async () => {
  // コマンドのデータを入れる場所
  const commands: Array<SlashCommandBuilder> = [];
  const commandsFolderPath = path.join(__dirname, "commands");
  const commandsFolder = fs.readdirSync(commandsFolderPath).filter((name: String) => name.endsWith(extension));
  for (const fileName of commandsFolder) {
    const commandPath = path.join(commandsFolderPath, fileName);
    // const command = require(commandPath);
    // コマンドのファイルまでの相対パスを取得
    const relativePath = getRelativePath(__dirname, commandPath);
    const command = await import(relativePath); // importは絶対パスを使うことができない
    const { data } = command.data;
    // 挿入
    commands.push(data.toJSON());
  }

  const { REST, Routes } = await import("discord.js");
  const rest = new REST().setToken(token);
  // 登録
  await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
})();

// コマンドの処理を保存しておくための初期化
client.commands = new Collection();

{
  const commandsFolderPath = path.join(__dirname, "commands");
  const commandsFolder = fs.readdirSync(commandsFolderPath).filter((name: String) => name.endsWith(extension));
  for (const fileName of commandsFolder) {
    const commandPath = path.join(commandsFolderPath, fileName);
    // const command = require(commandPath);
    const relativePath = getRelativePath(__dirname, commandPath);
    (async () => {
      const command = await import(relativePath);
      const { data } = command.data;
      // 設定
      client.commands.set(data.name, command.data);
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

  const { commandName } = interaction;
  // 設定されたコマンドを読み込む
  const command = client.commands.get(commandName);
  // ユーザーごとのクールダウンを読み込む
  const cooldown = client.cooldown.get(interaction.user.id);

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
    const userCooldown = cooldown?.[commandName] ?? 0;
    const nowTimestamp = getNowTimestamp();
    // クールダウン中か判定する
    if (nowTimestamp > userCooldown) {
      // クールダウン中じゃないとき
      client.cooldown.set(interaction.user.id, {
        [commandName]: nowTimestamp + command.cooldown
      });
    } else {
      // クールダウン中の時
      // 次に実行できる時間のタイムスタンプ
      const nextTimestamp = userCooldown.toString();
      await interaction.reply({
        content: `クールダウン中です。\`${commandName}\`は <t:${nextTimestamp}:R> に使用できます。`,
        flags: MessageFlags.Ephemeral
      });
      // 先の処理を実行しないようにする
      return;
    }
  }

  // エラーハンドリング
  try {
    // 実行
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