import { color, splitArray, concatItems, getUserData, initializeInventoryData, createPagingEmbeds, getPaging, PagingButton, executePagingComponentCollector } from "../functions.js";

import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from "discord.js";

const data: Command = {
  data: new SlashCommandBuilder()
    .setName("inventory")
    .setDescription("持ち物を表示"),
  async execute(interaction) {
    if (!interaction.isChatInputCommand()) return;

    // ユーザーのデータを取得
    const userData = getUserData(interaction.user.id);

    // ステータスが登録されているか判定
    if (typeof userData === "undefined") {
      // 返信
      await interaction.reply({
        content: "ステータスが未登録です。`/status create`を使ってステータスの登録を行ってください。",
        flags: MessageFlags.Ephemeral
      });
      // 中断
      return;
    }

    // inventoryが存在するか確認
    if (!("inventory" in userData)) {
      // inventoryの初期化
      initializeInventoryData(userData);
    }

    // 所持アイテムを文字列の配列にする
    const items = concatItems(userData.inventory?.items);

    // 型ガード
    if (typeof items === "undefined") return;

    // タイトル
    const title = `${interaction.user.displayName}の所持品`;

    const originEmbed = new EmbedBuilder()
    .setColor(color.default)
    .setTitle(title)
    // アイコンを表示
    .setThumbnail(interaction.user.displayAvatarURL({ extension: "png" }))
    .setTimestamp();

    // 持ち物が空かどうかの確認
    if (items.length > 0) {
      // 所持アイテム一覧の配列(文字列)にする
      const splitedItems = splitArray(items, 1024);
      // 埋め込みの設定
      const itemEmbeds = splitedItems.map(item =>
        // originEmbedを基に、新しく埋め込みを作る
        new EmbedBuilder(originEmbed.data)
          .setDescription(item)
      );
      // ページングの埋め込みを設定
      const newItemEmbeds = createPagingEmbeds(itemEmbeds, title);

      // 埋め込みを取得
      const embed = getPaging(newItemEmbeds, 1);
      // ボタンのActionRowの取得
      const buttons = new PagingButton();

      // Collector用に保存
      const response = await interaction.reply({
        embeds: [embed],
        components: [buttons.row],
        flags: MessageFlags.Ephemeral,
        withResponse: true
      });

      executePagingComponentCollector(interaction, response, newItemEmbeds);
    } else {
      // 埋め込みの説明(空)を設定
      const embed = new EmbedBuilder(originEmbed.data)
        .setDescription(
          "```\n" +
          "(どうやら持ち物は空のようだ。)" +
          "\n```"
        );

      // 返信
      await interaction.reply({
        embeds: [embed],
        flags: MessageFlags.Ephemeral
      });
    }
  }
}

export default data;