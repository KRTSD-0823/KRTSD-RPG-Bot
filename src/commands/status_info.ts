import { EmbedBuilder, MessageFlags } from "discord.js";

const __filename = import.meta.filename;
const extension = __filename.slice(-2);

const data: Subcommand = {
  isSubcommand: true,
  async execute(interaction, client) {
    // ユーザー全員分のデータを読み込む
    const usersData: UsersData = await import("../users_data.json", {
      with: {
        type: "json"
      }
    });
    // ユーザーのステータスを取得
    const status = usersData.default[interaction.user.id];

    // 型ガード
    if (typeof status === "undefined") return;

    // 拡張子は動的に変えている

    // 関数読み込み
    const { cleanJSON } = await import(`./status_create.${extension}`);
    // 色のデータ読み込み
    // importしたデータのdefaultにあるcolorを分割代入
    const { default: { color } } = await import(`../main.${extension}`) as BotColor;

    // 埋め込みの作成
    const embed = new EmbedBuilder()
      .setColor(color.default)
      .setTitle(`${interaction.user.displayName}の情報`)
      // アイコンを表示
      .setThumbnail(interaction.user.displayAvatarURL({ extension: "png" }))
      .addFields(
        {
          name: "ステータス",
          value: "```" + cleanJSON(JSON.stringify(status)) + "```"
        }
      );
    await interaction.reply({
      embeds: [embed],
      flags: MessageFlags.Ephemeral
    });
  }
};

export default data;