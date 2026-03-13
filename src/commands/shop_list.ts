import { color, concatItems, splitArray, createPagingEmbeds, getPaging, PagingButton, executePagingComponentCollector, getRootJSON } from "../functions.js";

import { EmbedBuilder, MessageFlags } from "discord.js";

const data: Subcommand = {
  isSubcommand: true,
  async execute(interaction) {
    // ショップのデータを取得
    const shopData: ShopData = getRootJSON("shop_data.json");
    // 内容を入れる
    const shopContents = concatItems(shopData.data, "\n");

    // 型ガード
    if (typeof shopContents === "undefined") return;

    // ページングの埋め込み用に整える
    const splitedShopContents = splitArray(shopContents, 1024);

    // それぞれ埋め込みを設定する
    const shopEmbeds = splitedShopContents.map((content) =>
      new EmbedBuilder()
        .setColor(color.default)
        .setDescription(content)
        .setTimestamp()
    );

    // 埋め込みのタイトルの設定
    const newShopEmbeds = createPagingEmbeds(shopEmbeds, "装備一覧");

    // 埋め込みの初期化
    const embed = getPaging(newShopEmbeds, 1);

    const buttonsRow = new PagingButton();

    // 返信
    const response = await interaction.reply({
      embeds: [embed],
      components: [buttonsRow.row],
      flags: MessageFlags.Ephemeral,
      withResponse: true
    });

    // ボタンの受信とその処理
    executePagingComponentCollector(interaction, response, newShopEmbeds);
  }
};

export default data;