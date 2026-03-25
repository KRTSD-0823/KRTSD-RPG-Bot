import { checkCommandCooldown } from "../functions.js";

import { SlashCommandBuilder } from "discord.js";

const data: Command = {
  data: new SlashCommandBuilder()
    .setName("shop")
    .setDescription("商店に関するコマンド")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("list")
        .setDescription("一覧を表示する"))
    .addSubcommand((subcommand) =>
      subcommand
        .setName("buy")
        .setDescription("商品を購入する")
        .addStringOption((option) =>
          option
            .setName("商品名")
            .setDescription("商品の名前を入力")
            .setAutocomplete(true)
            .setRequired(true)
        )
    ),
  async execute(interaction, client) {
    const { commandName } = interaction;
    // サブコマンド名を取得
    const subcommandName = interaction.options.getSubcommand();
    // 名前
    const fileName = `${commandName}_${subcommandName}`;
    // 読み込み
    const command = client.subcommands.get(fileName);

    // 型ガード
    if (typeof command === "undefined") return;

    if (interaction.isChatInputCommand()) {
      // クールダウンのデータ
      const cooldownData: CooldownData = {
        commandName: fileName,
        command
      };
      // サブコマンドがクールダウン中かの判定を受け取る
      const isCooldown = checkCommandCooldown(client, interaction, cooldownData);

      // 中断
      if (isCooldown) return;
    }

    // インテラクションの種類の判定
    switch(true) {
      case interaction.isChatInputCommand():
        // 通常のコマンドの実行
        await command.execute(interaction, client);
        // この後の文を処理をしない
        break;
    case interaction.isAutocomplete():
      // プロパティの存在確認
      if (!("autocomplete" in command)) return;

      // オートコンプリートの処理
      await command.autocomplete(interaction);
      break;
    }
  }
};

export default data;