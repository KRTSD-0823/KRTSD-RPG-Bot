import fs from "node:fs";
import path from "node:path";

import { color, getRootJSON, getRandomStatus, cleanStatusJSON } from "../functions.js";

import { EmbedBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder, ComponentType, MessageFlags } from "discord.js";
import type { BaseGuildTextChannel, ButtonInteraction, StringSelectMenuInteraction } from "discord.js";

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
    this.status.AP = 0;
    this.status.MP = 0;
    this.status.防御力 = 0;
    this.status.魔法耐性 = 0;
    this.status.攻撃力 = 0;
    this.status.魔法攻撃力 = 0;
    this.status.魔力節約術 = 0;
    this.status.素早さ = 0;

    // HP
    if (this.check(status, ["体力", "我慢強さ"])) {
      // 必要な値を取り出す
      const { 体力, 我慢強さ } = status;
      // 値の計算
      const value = 体力 + 我慢強さ / 3;
      // 設定
      this.status.HP = value > 20 ? value : 20;
    }
    // AP
    if (this.check(status, ["体力", "力"])) {
      const { 体力, 力 } = status;
      const value = (体力 + 力) / 2;
      this.status.AP = value > 15 ? value : 15;
    }
    // MP
    if (this.check(status, ["魔力量", "魔法効率", "魔法抵抗"])) {
      const { 魔力量, 魔法効率, 魔法抵抗 } = status;
      const difference = 魔法効率 - 魔法抵抗;
      const value = 魔力量 + (difference > 0 ? difference : 0);
      this.status.MP = value > 0 ? value : 10;
    }
    // 防御力
    if (this.check(status, ["我慢強さ"])) {
      const { 我慢強さ } = status;
      const value = 我慢強さ / 10;
      this.status.防御力 = value;
    }
    // 魔法耐性
    if (this.check(status, ["魔法抵抗"])) {
      const { 我慢強さ, 魔法抵抗 } = status;
      const value = 我慢強さ / 20 + 魔法抵抗 / 5;
      this.status.魔法耐性 = value;
    }
    // 攻撃力
    if (this.check(status, ["力"])) {
      const { 力 } = status;
      const value = 力 / 10;
      this.status.攻撃力 = value;
    }
    // 魔法攻撃力
    if (this.check(status, ["魔力"])) {
      const { 魔力 } = status;
      const value = 魔力 / 15;
      this.status.魔法攻撃力 = value;
    }
    // 素早さ
    if (this.check(status, ["俊敏"])) {
      const { 俊敏 } = status;
      const value = 俊敏 / 2;
      this.status.素早さ = value > 10 ? value : 10;
    }
    // 魔法節約術
    if (this.check(status, ["魔法効率"])) {
      const { 魔法効率 } = status;
      const value = Math.floor(魔法効率 / 20);
      this.status.魔力節約術 = value;
    }

    // 反復処理して全ステータスを切り捨て
    for (const [key, value] of Object.entries(this.status)) {
      this.status[(key as StatusKey)] = Math.floor(value);
    }
  }
}

const data: Subcommand = {
  isSubcommand: true,
  cooldown: 3600,
  async execute(interaction, client) {
    // ユーザー全体のデータ(users_data.json)を取得
    const usersData: UsersData = getRootJSON("users_data.json");
    // 既に登録されているか判定
    if (interaction.user.id in usersData) {
      // 返信
      await interaction.reply({
        content: "既にステータスを作成しています。",
        flags: MessageFlags.Ephemeral
      });
      // 中断
      return;
    }

    // ステータスの初期化
    const statusData: Status = {
      体力: 0,
      魔力量: 0,
      我慢強さ: 0,
      魔法効率: 0,
      魔法抵抗: 0,
      力: 0,
      魔力: 0,
      俊敏: 0
    };
    // 選択肢を生成
    const statusChoices: StatusChoice = {
      体力: getRandomStatus(),
      魔力量: getRandomStatus(),
      我慢強さ: getRandomStatus(),
      魔法効率: getRandomStatus(),
      魔法抵抗: getRandomStatus(),
      力: getRandomStatus(),
      魔力: getRandomStatus(),
      俊敏: getRandomStatus()
    };

    // ステータス名を選択するメニュー
    const nameChoicesMenu = new StringSelectMenuBuilder()
      .setCustomId("statusName")
      .setPlaceholder("ステータス名を選択");
    // 各ステータス名をオプションに追加
    Object.keys(statusChoices).forEach((name: string) => 
      nameChoicesMenu.addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel(name)
          .setValue(name)
      )
    );

    // HPやMPなどを計算したステータスのオブジェクトを返す
    const statusDataLabel = new StatusCalculator(statusData);

    // 埋め込みを作成
    const embed = new EmbedBuilder()
      .setColor(color.default)
      .setTitle("ステータスの設定")
      .setDescription("下にあるメニューを使ってステータスの設定を行ってください。")
      .addFields(
        // ここでstatusChoicesとstatusDataを整形したJSON(文字列)に変えている
        {
          name: "選択用ステータス",
          value: "```\n" + cleanStatusJSON(JSON.stringify(statusChoices)) + "\n```"
        },
        {
          name: "ステータス",
          value: "```\n" + cleanStatusJSON(JSON.stringify(statusDataLabel.status)) + "\n```"
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

    // フィルターするための関数
    const componentFilter = function (i: StringSelectMenuInteraction | ButtonInteraction) {
      return i.user.id === interaction.user.id
    };

    // メニューのCollector
    const stringMenuCollector = response.resource?.message?.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      filter: componentFilter
    });
    // ボタンが押された時のCollector
    const buttonCollector = response.resource?.message?.createMessageComponentCollector({
      componentType: ComponentType.Button,
      filter: componentFilter
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
        embed.data.fields![1]!.value = "```" + cleanStatusJSON(JSON.stringify(calculatedStatusData)) + "```";
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

      // ボタンごとの処理
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

        const finalStatusData = new StatusCalculator(statusData);

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
            cleanStatusJSON(JSON.stringify(finalStatusData.status)) +
            "\n```\n以上のステータスを登録します。",
          components: [row3],
          flags: MessageFlags.Ephemeral,
          withResponse: true
        });

        // 確定ボタンの検知とか
        const enterButtonCollector = enterButtonMessage.createMessageComponentCollector({
          componentType: ComponentType.Button,
          filter: componentFilter
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
          // 設定
          usersData[userId] = finalStatusData.status;
          const usersDataPath = path.join(__dirname, "../users_data.json");
          // ユーザーのデータを保存する
          fs.writeFileSync(usersDataPath, JSON.stringify(usersData, null, 2));

          // ステータス名を選ぶメニューを無効化する
          nameChoicesMenu.setDisabled(true);

          // 送信するボタンを無効化する
          confirmButton.setDisabled(true);

          const newRow1 = [
            new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(nameChoicesMenu),
            new ActionRowBuilder<ButtonBuilder>().addComponents(confirmButton)
          ];

          // 編集
          await interaction.editReply({
            embeds: [embed],
            components: newRow1
          });

          // BaseGuildTextChannelって型を付けてあげないとsendメソッドが出てこない
          const nowChannel = client.channels.cache.get(enterButtonInteraction.channelId) as BaseGuildTextChannel;

          if (typeof nowChannel !== "undefined") {
            // チャンネルにステータスを送信
            nowChannel.send(
              `<@${interaction.user.id}>\n` + // メンションを飛ばす
              "```\n" +
              cleanStatusJSON(JSON.stringify(finalStatusData.status)) +
              "\n```"
            )
          }

          // 返信
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