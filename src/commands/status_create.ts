import fs from "node:fs";
import path from "node:path";

import { EmbedBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder, ComponentType, MessageFlags } from "discord.js";
import type { BaseGuildTextChannel, Embed } from "discord.js";

import descriptionsData from "../description.json" with { type: "json" };

const __dirname = import.meta.dirname;
const __filename = import.meta.filename;

const extension = __filename.slice(-2);

// ステータス値を計算してくれるクラス
class StatusCalculator {
  // 指定したステータスが入力されているか確認
  check(status: Status, property: Array<StatusKey>): boolean {
    return property.every(p => (status[p] ?? 0) > 0);
  }
  // プロパティstatusにデータを入れる
  status: Status
  constructor(status: Status) {
    // 値渡しを行う
    const temp = JSON.stringify(status);
    this.status = JSON.parse(temp);

    // 初期化
    this.status.HP = 0;
    this.status.MP = 0;
    this.status.REG = 0;
    this.status.MREG = 0;
    this.status.AT = 0;
    this.status.MAT = 0;
    this.status.MPC = 0;

    // HP
    if (this.check(status, ["体力", "我慢強さ"])) {
      const { 体力: health, 我慢強さ: stand } = status;
      const value = Math.floor(health + stand / 3)
      this.status.HP = value > 20 ? value : 20;
    }
    // MP
    if (this.check(status, ["魔力量", "魔法効率", "魔法抵抗"])) {
      const { 魔力量: magic, 魔法効率: productivity, 魔法抵抗: resistance } = status;
      const difference = productivity - resistance;
      const value = Math.floor(magic + (difference > 0 ? difference : 0));;
      this.status.MP = value > 0 ? value : 10;
    }
    // REG
    if (this.check(status, ["我慢強さ"])) {
      const { 我慢強さ: stand } = status;
      const value = Math.floor(stand / 10);
      this.status.REG = value;
    }
    // MREG
    if (this.check(status, ["魔法抵抗"])) {
      const { 魔法抵抗: resistance } = status;
      const value = Math.floor(resistance / 5);
      this.status.MREG = value;
    }
    // AT
    if (this.check(status, ["力"])) {
      const { 力: power } = status;
      const value = Math.floor(power / 10);
      this.status.AT = value;
    }
    // MAT
    if (this.check(status, ["魔力"])) {
      const { 魔力: magic } = status;
      const value = Math.floor(magic / 15);
      this.status.MAT = value;
    }
    // MPC
    if (this.check(status, ["魔法効率"])) {
      const { 魔法効率: productivity } = status;
      const value = Math.floor(productivity / 20);
      this.status.MPC = value;
    }
  }
}

// 10から30のランダムな値を3回振る関数
function getRandomStatus(): Array<number> {
  const randomValues: Array<number> = [];
  for (let i = 0; i < 3; i++) {
    randomValues.push(Math.floor(Math.random() * (30 - (10 + 1)) + (10 + 1)));
  }
  return randomValues;
}

// JSON(文字列)を綺麗にする
export function cleanJSON(data: string): string {
  // プロパティ名のダブルクォーテーションを空白に置き換える(無くす)
  // RegExp(正規表現)の後にgフラグを付けないと一つしか置き換えしてくれない
  return data.replace(/"(?=.*:)/g, "")
    // 区切りのコンマを消す
    .replace(/(?<=[0-9]+\]?),(?![0-9]+)/g, "\n")
    // 配列のかっこを無くす
    // 正規表現の\sはあらゆる空白文字(スペース、改行など)を表す
    .replace(/(?<=:.*)[\[\]]/g, "")
    // スペースを無くす
    .replace(/ /g, "")
    // 半角コロンを全角にする
    .replace(/:/g, "：")
    // カギかっこを無くす
    .replace("{", "")
    .replace("}", "");
}

const data: Subcommand = {
  isSubcommand: true,
  cooldown: 3600,
  async execute(interaction, client) {
    // ステータスの初期化
    const statusData: Status = {
      体力: 0,
      魔力量: 0,
      我慢強さ: 0,
      魔法抵抗: 0,
      力: 0,
      魔力: 0,
      魔法効率: 0
      // HP: 0,
      // MP: 0,
      // REG: 0,
      // MREG: 0,
      // AT: 0,
      // MAT: 0,
      // MPC: 0
    };
    // 選択肢を生成
    const statusChoices: StatusChoice = {
      体力: getRandomStatus(),
      魔力量: getRandomStatus(),
      我慢強さ: getRandomStatus(),
      魔法抵抗: getRandomStatus(),
      力: getRandomStatus(),
      魔力: getRandomStatus(),
      魔法効率: getRandomStatus()
    };

    // ステータス名を選択するメニュー
    const nameChoicesMenu = new StringSelectMenuBuilder()
      .setCustomId("statusName")
      .setPlaceholder("ステータス名を選択");
    // 各ステータス名をオプションに追加
    Object.keys(statusChoices).forEach((name: string) => {
      nameChoicesMenu.addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel(name)
          .setValue(name)
      );
    });

    // HPやMPなどを計算したステータスのオブジェクトを返す
    const statusDataLabel = new StatusCalculator(statusData);

    const { color } = await import(`../main.${extension}`) as BotColor;

    // 埋め込みを作成
    const embed = new EmbedBuilder()
      .setColor(color.default)
      .setTitle("ステータスの設定")
      .setDescription("下にあるメニューを使ってステータスの設定を行ってください。")
      .addFields(
        // ここでstatusChoicesとstatusDataを整形したJSON(文字列)に変えている
        {
          name: "選択用ステータス",
          value: "```\n" + cleanJSON(JSON.stringify(statusChoices)) + "\n```"
        },
        {
          name: "ステータス",
          value: "```\n" + cleanJSON(JSON.stringify(statusDataLabel.status)) + "\n```"
        },
        {
          name: "ステータスの説明",
          // 後に更新する
          value: "```\n ```"
        }
      )
      .setTimestamp();

    // 送信ボタンの作成
    const confirmButton = new ButtonBuilder()
      .setCustomId("confirm")
      .setLabel("送信する")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(true);

    // 配列にして二つのActionRowBuilderをまとめた
    const row1 = [
      new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(nameChoicesMenu),
      new ActionRowBuilder<ButtonBuilder>().addComponents(confirmButton)
    ];

    // オブジェクトを受け取る
    const response = await interaction.reply({
      embeds: [embed],
      components: row1,
      withResponse: true
    });

    // メニューのCollector
    const stringMenuCollector = response.resource?.message?.createMessageComponentCollector({
      componentType: ComponentType.StringSelect
    });
    // ボタンが押された時のCollector
    const buttonCollector = response.resource?.message?.createMessageComponentCollector({
      componentType: ComponentType.Button
    });

    // Collectorでメニューが選択された時の処理をする
    stringMenuCollector?.on("collect", async (i) => {
      // 選択されたメニューの値
      const [value] = i.values;

      // 型ガード
      if (typeof value !== "string") return;

      // 「インタラクションに失敗しました」というメッセージを出さないように先にしておく
      await i.deferUpdate();

      // ステータス名なのかステータス値なのか判定する正規表現
      const isValueRegExp = /(?<=[0-9]+_)[0-9]+/;
      if (!isValueRegExp.test(value)) {
        // ステータス名の処理
        // valueを型StatusKeyとして代入
        const statusName = value as StatusKey;
        const valueChoices: Array<number> = statusChoices[statusName];

        // ステータス値を選択するのメニュー
        const valueSelectMenu = new StringSelectMenuBuilder()
          .setCustomId("statusValue")
          .setPlaceholder(`${statusName}の値を選択`);
        valueChoices.forEach((choice: number, i) => {
          // choiceとiは数字型なので文字列型にしてあげる(別定数に代入)
          const choiceString: string = choice.toString();
          const indexString = i.toString();
          // ステータス値をオプションに追加
          valueSelectMenu.addOptions(
            new StringSelectMenuOptionBuilder()
              .setLabel(choiceString)
              .setValue(`${indexString}_${choiceString}`) // ここでは文字列しか使えない
          );
        });
        const cancelButton = new ButtonBuilder()
          .setCustomId("cancel")
          .setLabel("戻る")
          .setStyle(ButtonStyle.Danger);
        const row2 = [
          new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(valueSelectMenu),
          new ActionRowBuilder<ButtonBuilder>().addComponents(cancelButton)
        ];
        // ステータスの説明を元の埋め込みに追加
        embed.data.fields![2]!.value = "```" + descriptionsData.status[statusName] + "```";
        await interaction.editReply({
          embeds: [embed],
          components: row2
        });
        // ステータス名を保存しておく
        client.statusName.set(i.message.id, statusName);
      } else {
        // ステータス値の処理
        // ステータス名を読み込み
        const statusName = client.statusName.get(i.message.id) as StatusKey;
        // valueから選択されたステータス値を取り出す
        const statusValue = isValueRegExp.exec(value)?.[0];
        // 正しいものか判定
        if (typeof statusValue === "string" && statusName in statusData) {
          // 数値化して代入
          statusData[statusName] = parseInt(statusValue);
        }

        // キーと値を配列にする
        const statusDataEntries = Object.entries(statusData);
        // 全部のステータスが入力されたか判定する
        const isAllSet = statusDataEntries.every(([, value]) => value > 0);
        // 全ステータスが埋まってる時の処理
        if (isAllSet) {
          const buttonData = row1[1]?.components[0]?.data;
          // 送信するボタンの無効化を解除
          buttonData!.disabled = false;
        }
        // ステータスの計算
        const calculatedStatusData = new StatusCalculator(statusData).status;

        // 元の埋め込みを書き換え
        embed.data.fields![1]!.value = "```" + cleanJSON(JSON.stringify(calculatedStatusData)) + "```";
        embed.data.fields![2]!.value = "```\n ```";
        // メッセージを編集(最初の状態に戻す)
        await interaction.editReply({
          embeds: [embed],
          components: row1
        });
      }
    });

    // ボタンが押された時の処理をする
    buttonCollector?.on("collect", async (i) => {
      // customIdというidでボタンを識別する
      const { customId } = i;

      if (customId === "cancel") {
        await i.deferUpdate();
        // ステータスの値を選択したとき、一つ前のステータス名を選択する画面に戻る
        await interaction.editReply({
          embeds: [embed],
          components: row1
        });
      } else if (customId === "confirm") {
        await i.deferReply({
          flags: MessageFlags.Ephemeral
        });

        // 作成を確定するボタン
        const enterButton = new ButtonBuilder()
          .setCustomId("enter")
          .setLabel("確定する")
          .setStyle(ButtonStyle.Success);
        const row3 = new ActionRowBuilder<ButtonBuilder>().addComponents(enterButton);
        // followUpはMessageオブジェクトが返ってくる
        // replyはInteractionCallbackResponseオブジェクトが返ってくる
        const enterButtonMessage = await i.followUp({
          content: "```\n" +
            cleanJSON(JSON.stringify(statusData)) +
            "\n```\n以上のステータスを登録します。",
          components: [row3],
          flags: MessageFlags.Ephemeral,
          withResponse: true
        });

        // 確定ボタンの検知とか
        const enterButtonCollector = enterButtonMessage.createMessageComponentCollector({
          componentType: ComponentType.Button
        });

        // 確定ボタンが押された時の処理
        enterButtonCollector?.on("collect", async (enterButtonInteraction) => {
          // 決定ボタンを無効化(選択できないように)する
          enterButton.setDisabled(true);
          const newRow3 = new ActionRowBuilder<ButtonBuilder>().addComponents(enterButton);

          // 確認のメッセージを編集
          await i.editReply({
            embeds: enterButtonMessage.embeds, // Embedの流用
            components: [newRow3]
          });

          // deferReplyで処理が遅れても15分までなら「インタラクションに失敗しました」というメッセージを出さなくなる
          await enterButtonInteraction.deferReply({
            flags: MessageFlags.Ephemeral
          });

          // 万が一、違う人が押してしまってもいいようにinteractionから取得している
          const userId = interaction.user.id;
          // users_data.jsonを読み込む
          const usersData: UsersData = await import("../users_data.json", {
            with: {
              type: "json"
            }
          });
          // 設定
          usersData.default[userId] = statusData;
          const usersDataPath = path.join(__dirname, "../users_data.json");
          // ユーザーのデータを保存する
          fs.writeFileSync(usersDataPath, JSON.stringify(usersData.default, null, 2));

          // ステータス名を選ぶメニューを無効化する
          nameChoicesMenu.setDisabled(true);

          // 送信するボタンを無効化する
          confirmButton.setDisabled(true);

          const newRow1 = [
            new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(nameChoicesMenu),
            new ActionRowBuilder<ButtonBuilder>().addComponents(confirmButton)
          ];

          await interaction.editReply({
            embeds: [embed],
            components: newRow1
          });

          // BaseGuildTextChannelって型を付けてあげないとsendメソッドが出てこない
          const nowChannel = client.channels.cache.get(enterButtonInteraction.channelId) as BaseGuildTextChannel;

          const finalStatusData = new StatusCalculator(statusData);

          if (typeof nowChannel !== "undefined") {
            nowChannel.send(
              `<@${interaction.user.id}>\n` + // メンションを飛ばす
              "```\n" +
              cleanJSON(JSON.stringify(finalStatusData.status)) +
              "\n```"
            )
          }

          await enterButtonInteraction.followUp({
            content: "登録が完了しました。",
            flags: MessageFlags.Ephemeral
          });
        });
      }
    });
  }
};

export default data;