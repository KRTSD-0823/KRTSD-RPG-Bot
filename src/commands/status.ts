import { SlashCommandBuilder } from "discord.js";

const data: Command = {
  data: new SlashCommandBuilder()
    .setName("status")
    .setDescription("ステータスの管理")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("create")
        .setDescription("ステータスを作成"))
    .addSubcommand((subcommand) =>
      subcommand
        .setName("info")
        .setDescription("ユーザーのステータスを表示")),
  async execute(interaction, client) {
    const { commandName } = interaction;
    // サブコマンド名を取得
    const subcommandName = interaction.options.getSubcommand();
    // 設定する時の名前
    const fileName = `${commandName}_${subcommandName}`;
    // 読み込み
    const command = client.subcommands.get(fileName);

    // 型ガード
    if (typeof command === "undefined") return;

    // データにする
    const cooldownData: CooldownData = {
      commandName: fileName,
      command
    };
    // サブコマンドがクールダウン中かの判定を受け取る
    const isCooldown = checkCommandCooldown(client, interaction, cooldownData);

    // 中断
    if (isCooldown) return;

    await command.execute(interaction, client);
  }
};

export default data;