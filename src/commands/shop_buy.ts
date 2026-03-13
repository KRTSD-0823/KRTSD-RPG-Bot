import { getRootJSON, concatItems, getUserData, setUserData, createComponentCollector, initializeInventoryData } from "../functions.js";

import { ButtonBuilder, ButtonStyle, ActionRowBuilder, MessageFlags, ComponentType } from "discord.js";
import type { ButtonInteraction } from "discord.js";

const data: Subcommand = {
  isSubcommand: true,
  async autocomplete(interaction) {
    // 入力している文字の取得
    const focusedValue = interaction.options.getFocused();
    // データの読み込み
    const shopData: ShopData = getRootJSON("shop_data.json");
    // フィルターしたものを入れる
    const filteredData = shopData.data.filter((data) =>
      // 型ガード+フィルター
      typeof data.名前 === "string" && typeof data.種類 === "string" &&
      (data.名前.includes(focusedValue) || data.種類.includes(focusedValue))
    );
    // オブジェクトの設定
    const respondData = filteredData.map((data, index) => {
      // 表示用
      const content = `${data.名前}/${data.種類}`;
      return { name: content, value: `${index}_${content}` };
    });
    // 処理した選択肢を返す
    await interaction.respond(respondData);
  },
  async execute(interaction) {
    // ショップのデータの読み込み
    const shopData: ShopData = getRootJSON("shop_data.json");

    // 選択/入力された値を取得
    const selectedValue = interaction.options.getString("商品名", true);
    // 識別のための数字を取り出す正規表現
    const getIdRegexp = /[0-9]+(?=_.+)/
    // 取り出す
    const value = getIdRegexp.exec(selectedValue)?.[0];

    // 元の入力された値が不正な場合は中断
    if (typeof value !== "string") {
      // 返信
      await interaction.reply({
        content: `\`${selectedValue}\`は不正な値です。`,
        flags: MessageFlags.Ephemeral
      });
      // 中断
      return;
    }

    // 数字に変換
    const index = Number(value);

    // 選択された値に一致するデータを取得
    const selectedData = shopData.data[index];

    // 読み込み
    const userData = getUserData(interaction.user.id);

    // プロパティが存在しているかチェック
    if (typeof userData === "undefined") {
      // 返信
      await interaction.reply({
        content: "ステータスが未登録です。まずは`/status create`コマンドを使って登録を済ませてください。",
        flags: MessageFlags.Ephemeral
      });
      // 中断
      return;
    }

    // inventory、またはgoldが存在しないなら設定
    if (!("inventory" in userData) || !("gold" in userData.inventory)) {
      initializeInventoryData(userData);
    }

    // 型ガード
    if (typeof selectedData?.値段 !== "number") return;

    // 取り出し
    const { 値段 } = selectedData;
    const { inventory } = userData;

    // 購入した商品の名前を取り出す
      const replacedValue = selectedValue
        // 番号を削除
        .replace(/[0-9]+_(?=.+)/, "")
        // 武器種を削除
        .replace(/(?<=.+)\/.*/, "");

    // 所持金が十分かの判定
    if (userData.inventory!.gold! > selectedData.値段) {
      // ショップのデータを取得
      const shopData = getRootJSON("shop_data.json");
      // 説明の取得
      const description = concatItems(shopData)?.[index];

      // 決定ボタンの作成
      const confirmButton = new ButtonBuilder()
        .setCustomId("confirm")
        .setLabel("購入する")
        .setStyle(ButtonStyle.Success);
      
      // ActionRowにする
      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(confirmButton);

      // Collector用に保存
      const response = await interaction.reply({
        content: description + "\n" +
          "上記のアイテムを購入します。\n" +
          `所持金：\`${inventory!.gold}G\``,
        components: [row],
        flags: MessageFlags.Ephemeral,
        withResponse: true
      });

      // Collectorの作成
      const collector = createComponentCollector(response, ComponentType.Button);

      // ボタンの受信
      collector?.on("collect", async (i: ButtonInteraction) => {
        // 仮にIDが違うかった場合には中断
        if (i.customId !== "confirm") return;

        // 所持金を減らす
        inventory!.gold! -= 値段;

        // アイテムを追加
        inventory!.items!.push(selectedData);

        // データの設定
        setUserData(interaction.user.id, userData);

        // ボタンを無効化する
        confirmButton.setDisabled(true);

        // 新たに作成
        const newRow = row.setComponents(confirmButton);
        
        // 編集
        await interaction.editReply({
          content: response.resource!.message!.content,
          components: [newRow]
        });

        // 返信
        await i.reply({
          content: `\`${replacedValue}\`を購入しました。\n` +
            `所持金：\`${inventory!.gold}G\``,
          flags: MessageFlags.Ephemeral
        });
      });
    } else {
      // 足りない差額を計算
      const difference = selectedData.値段 - inventory!.gold!;

      // 返信
      await interaction.reply({
        content: `\`${replacedValue}\`を購入するにはあと\`${difference}G\`必要です。`
      });
    }
  }
};

export default data;