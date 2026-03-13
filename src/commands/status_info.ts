import { color, cleanUserDataJSON, getUserData } from "../functions.js";

import { EmbedBuilder, MessageFlags } from "discord.js";

const data: Subcommand = {
  isSubcommand: true,
  async execute(interaction) {
    // ユーザーのデータを読み込む
    const userData = getUserData(interaction.user.id);

    // ステータスが登録済みか判定
    if (typeof userData === "undefined") {
      // 返信
      await interaction.reply({
        content: "ステータスを登録していません。`/status create`コマンドを使ってステータスの作成をしてください。",
        flags: MessageFlags.Ephemeral
      });
      // 中断
      return;
    }

    // ユーザーのステータスを取得
    const { status } = userData;

    // 埋め込みの作成
    const embed = new EmbedBuilder()
      .setColor(color.default)
      .setTitle(`${interaction.user.displayName}の情報`)
      // アイコンを表示
      .setThumbnail(interaction.user.displayAvatarURL({ extension: "png" }))
      .addFields(
        {
          name: "ステータス",
          value: "```\n" + cleanUserDataJSON(JSON.stringify(status)) + "\n```"
        }
      );

    // 返信
    await interaction.reply({
      embeds: [embed],
      flags: MessageFlags.Ephemeral
    });
  }
};

export default data;