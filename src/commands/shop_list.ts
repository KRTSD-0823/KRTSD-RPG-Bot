import { color, concatShopString, splitArray, setPagingEmbeds, parsePage, getPaging, setComponentCollector, PagingButton } from "../functions.js";

import { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ComponentType } from "discord.js";
import type { ButtonInteraction, MessageComponentInteraction } from "discord.js";

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
      withResponse: true
    });

    // フィルター
    const collectorFilter = (i: MessageComponentInteraction) => interaction.user.id === i.user.id;

    // 受信するためのcollector
    const collector = setComponentCollector(response, ComponentType.Button, collectorFilter);

    collector?.on("collect", async (i: ButtonInteraction) => {
      // インタラクションに失敗しました対策
      await i.deferUpdate();

      // 現在のページを取得
      const currentPage = parsePage(i.message.embeds[0]!.data.title!);
      // ボタンのIDごとに処理
      if (i.customId === "next") {
        // 次のページを取得
        const nextEmbed = getPaging(newShopEmbeds, currentPage, 1);
        // 編集
        await interaction.editReply({
          embeds: [nextEmbed],
          components: [buttonsRow.row]
        });
      } else if (i.customId === "back") {
        // 前のページを取得
        const nextEmbed = getPaging(newShopEmbeds, currentPage, -1);
        // 編集
        await interaction.editReply({
          embeds: [nextEmbed],
          components: [buttonsRow.row]
        });
      }
    });
  }
};

export default data;