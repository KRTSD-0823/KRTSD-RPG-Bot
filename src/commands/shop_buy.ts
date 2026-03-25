import { defaultUserInventory, getRootJSON, concatShopItems, getUserData, setUserData, createComponentCollector } from "../functions.js";

import { ButtonBuilder, ButtonStyle, ActionRowBuilder, MessageFlags, ComponentType } from "discord.js";
import type { ButtonInteraction } from "discord.js";

const data: Subcommand = {
  isSubcommand: true,
  async autocomplete(interaction) {
    // データの読み込み
    const shopData: ShopData = getRootJSON("shop_data.json");
    // 入力している文字の取得
    const focusedValue = interaction.options.getFocused();

    // フィルターしたものを入れる
    const filteredData = shopData.data.filter((data) =>
      (data.名前.includes(focusedValue) ||
      // 武器種と種類のフィルター
      (data.種類 === "武器" ?
        data.武器種.includes(focusedValue as WeaponTypes) : data.種類.includes(focusedValue))
      )
    );

    // オブジェクトの設定
    const respondData = filteredData.map((data, index) => {
      // 表示用
      const content = `${data.名前}/${data.種類 === "武器" ? data.武器種 : data.種類}`;
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

    // 型ガード
    if (typeof selectedData === "undefined") return;

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

    // inventory、またはその他のプロパティが存在しないならそれらを設定
    if (!("inventory" in userData) || (!("gold" in userData?.inventory) || !("sp" in userData?.inventory))) {
      userData.inventory = defaultUserInventory;
    }

    const { inventory } = userData;

    // 型ガード
    if (typeof inventory === "undefined") return;

    // 購入した商品の名前を取り出す
    const replacedValue = selectedValue
      // 番号を削除
      .replace(/[0-9]+_(?=.+)/, "")
      // 武器種を削除
      .replace(/(?<=.+)\/.*/, "");

    // 所持金/所持SPが不足しているか判定
    if (("値段" in selectedData && inventory.gold < selectedData.値段) || ("コスト" in selectedData && inventory.sp < selectedData.コスト)) {
      // 取り出す
      const { 値段, コスト } = selectedData;

      // 足りない差額を計算
      const goldDifference = Math.abs((値段 ?? 0) - inventory.gold);
      const spDifference = Math.abs((コスト ?? 0) - inventory.sp);
      // 返信
      await interaction.reply({
        content: `\`${replacedValue}\`を購入するには以下が必要です。\n` +
          (typeof 値段 !== "undefined" ? `\`${値段}G\`` + `(\`${goldDifference}G\`不足)\n` : "") +
          (typeof コスト !== "undefined" ? `\`${コスト}SP\`` +`(\`${spDifference}SP\`不足)` : ""),
          flags: MessageFlags.Ephemeral
      });

      // 中断
      return;
    }

    // 説明の取得
    const description = concatShopItems(shopData.data)?.[index];

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
        ("値段" in selectedData ? `所持金：\`${inventory.gold}G\`\n` : "") +
        ("コスト" in selectedData ? `所持SP：\`${inventory.sp}SP\`` : ""),
      components: [row],
      flags: MessageFlags.Ephemeral,
      withResponse: true
    });

    // Collectorの作成
    const collector = createComponentCollector(response, ComponentType.Button);

    // ボタンの受信
    collector?.on("collect", async (i: ButtonInteraction) => {
      // ボタンは1つしかないが、仮にIDが違うかった場合には中断
      if (i.customId !== "confirm") return;

      // 所持金を減らす
      if ("値段" in selectedData) inventory.gold -= selectedData.値段;
      // 所持技能ポイントを減らす
      if ("コスト" in selectedData) inventory.sp -= selectedData.コスト;

      // アイテムを追加
      inventory.items.push(selectedData);

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
          ("値段" in selectedData ? `所持金：\`${inventory.gold}G\`\n` : "") +
          ("コスト" in selectedData ? `所持SP：\`${inventory.sp}SP\`` : ""),
        flags: MessageFlags.Ephemeral
      });
    });
  }
};

export default data;