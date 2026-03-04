import { color, concatShopString, splitArray, setPagingEmbeds, parsePage, getPaging, setComponentCollector, PagingButton, executePagingComponentCollector } from "../functions.js";

import { EmbedBuilder, MessageFlags } from "discord.js";

const data: Subcommand = {
  isSubcommand: true,
  async execute(interaction) {
    // 内容を入れる
    const shopContents = concatShopString("\n");

    // ページングの埋め込み用に整える
    const splitedShopContents = splitArray(shopContents, 4096);

    // それぞれ埋め込みを設定する
    const shopEmbeds = splitedShopContents.map((content) =>
      new EmbedBuilder()
        .setColor(color.default)
        .setDescription(content)
        .setTimestamp()
    );

    // 埋め込みのタイトルの設定
    const newShopEmbeds = setPagingEmbeds(shopEmbeds, "装備一覧");

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