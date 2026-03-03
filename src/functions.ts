// 関数やをまとめたファイル

const __dirname = import.meta.dirname;

import fs from "node:fs";
import path from "node:path";

import { MessageFlags, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from "discord.js";
import type { Client, ChatInputCommandInteraction, InteractionCallbackResponse } from "discord.js";

// 色(埋め込みなど)を他ファイルでも読み込めるようにする
export const color: BotColor = {
  default: [255, 120, 80]
};

// ルート(src)にあるJSONファイルを読み込む関数
function getRootJSON(name: string) {
  // パスの取得
  const dataPath = path.join(__dirname, name);
  // 読み込む
  const data = fs.readFileSync(dataPath, "utf-8");
  // オブジェクトに変換
  return JSON.parse(data);
}

// あるディレクトリから別のディレクトリまでの相対パスを返す関数
function getRelativePath(from: string, to: string) {
  // パスの文字列にする
  return `./${path.relative(from, to)}`;
}

// 現在時刻のタイムスタンプを秒単位で返す関数
function getNowTimestamp() {
  // Date.now()はミリ秒まで返すため、÷1000で秒に変換
  return Math.floor(Date.now() / 1000);
}

// 10から30のランダムな値を3回振る関数
function getRandomStatus() {
  // 保存する配列
  const randomValues: Array<number> = [];
  for (let i = 0; i < 3; i++) {
    // 範囲を指定して乱数を生成
    randomValues.push(Math.floor(Math.random() * (30 - (10 + 1)) + (10 + 1)));
  }
  return randomValues;
}

// JSON化したステータス(文字列)を綺麗にする
function cleanStatusJSON(data: string) {
  // RegExp(正規表現)の後にgフラグを付けないと一つしか置き換えしてくれない
  return data
    // プロパティ名のダブルクォーテーションを空白に置き換える(無くす)
    .replace(/"(?=.*:)/g, "")
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

// shop_data.jsonのデータを整形した文字列の配列にする関数
function concatShopString(last?: string) {
  // ショップのデータを持ってくる
  const shop: ShopData = getRootJSON("shop_data.json");

  // 全て順次に処理して返す
  return shop.data.reduce((current: Array<string>, shopData) => {
    // 取り出す
    const { 名前, 種類, 値段, 威力, 説明 } = shopData;
    // 内容を追加
    current.push(
      "```\n" +
      `・${名前}/${種類}\n` +
      `値段：${値段}\n` +
      // 威力がundefinedじゃないなら威力を表示
      `${typeof 威力 !== "undefined" ? `威力：${威力}\n` : ""}` +
      "【説明】\n" +
      説明 +
      "\n```" +
      (last ?? "")
    );
    // 返す(currentStringを次に回す)
    return current;
  }, []);
}

// 配列の文字列を指定した文字数以上にならないように連結する関数
function splitArray(data: Array<string>, count: number) {
  return data.reduce((previous: Array<string>, current) => {
    // どこを操作するかの値
    const index = previous.length > 0 ? previous.length - 1 : 0;

    // 存在しているかの確認
    if (typeof previous[index] === "undefined") {
      // 挿入
      previous.push("");
    }

    // 指定された文字数より多くならないようにする
    if ((previous[index] + current).length <= count) {
      // 追加
      previous[index] += current;
    } else {
      // 新しく挿入
      previous.push(current);
    }

    // previousを次に回す
    return previous;
  }, []);
}

// 文字に含まれる現在のページを抜き出す
function parsePage(text: string) {
  // 正規表現
  const regexp = /(?<=.*\()[0-9]+(?=\/[0-9]+\))/;
  // 抜き出す
  const page = regexp.exec(text)?.[0];
  // 数字に変える
  return Number(page);
}

// 指定したページの要素を取り出す(ページング機能)
function getPaging(array: Array<any>, current: number, to?: number) {
  // 移動後のページ数を入れる
  const difference = current + (to ?? 0);
  // 次のページの計算
  // differenceがプラスかマイナスかで処理を変える
  const index = Math.sign(difference) === 1 ?
    // -1で調整
    (difference - 1) % array.length :
    ((array.length + difference) - 1) % array.length;
  return array[index];
}

// ページングのための埋め込みを作成
function setPagingEmbeds(embeds: Array<EmbedBuilder>, title: string) {
  return embeds.map((emb, index) => {
    // 新しいEmbedBuilderを作成
    // 直接操作すると、参照渡しの影響なのか全部が同じ要素になってしまう
    const tempEmbed = new EmbedBuilder(emb.data);
    // タイトルの設定
    tempEmbed.setTitle(`${title}(${index + 1}/${embeds.length})`);
    return tempEmbed;
  });
}

// コマンド実行時のユーザーのクールダウンの処理をする関数
function checkCommandCooldown(client: Client, interaction: ChatInputCommandInteraction, cooldownData: CooldownData) {
  // 取り出す
  const { commandName, command } = cooldownData;

  // クールダウンが存在しないコマンドなら中断
  if (!("cooldown" in command)) return false;

  // ユーザーごとのクールダウンを読み込む
  const cooldown = client.cooldown.get(interaction.user.id);
  const userCooldown = cooldown?.[commandName] ?? 0;
  // タイムスタンプ
  const nowTimestamp = getNowTimestamp();
  // クールダウン中か判定する
  if (nowTimestamp < userCooldown) {
    // クールダウンの時
    // 次に実行できる時間のタイムスタンプを取得
    const nextTimestamp = userCooldown?.toString();
    // 返信
    interaction.reply({
      content: `クールダウン中です。\`${commandName}\`は <t:${nextTimestamp}:R> に使用できます。`,
      flags: MessageFlags.Ephemeral
    });
    return true;
  } else {
    // クールダウン中じゃない時
    // クールダウンを設定
    client.cooldown.set(interaction.user.id, {
      [commandName]: nowTimestamp + command.cooldown
    });
    return false;
  }
}

// ボタンの受信、メニューの受信などのためのCollectorを取得する関数
function setComponentCollector(
  response: InteractionCallbackResponse,
  componentType: ComponentCollectorComponentType,
  filter: ComponentFilter
) {
  // オプションの設定
  const options: ComponentsCollectorOptions = {
    componentType
  };

  // filterプロパティが存在するならそれも設定
  if (typeof filter !== "undefined") {
    options.filter = filter;
  }

  // Collectorの作成
  return response.resource?.message?.createMessageComponentCollector(options);
}

// ページングのボタンを作成するクラス
// 限定的
class PagingButton {
  // rowプロパティにActionRowを入れる
  row: ActionRowBuilder<ButtonBuilder>;
  constructor() {
    // ボタンの初期化
    const buttons = [
      new ButtonBuilder()
        .setCustomId("back")
        .setLabel("前に戻る")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("⏪"),
      new ButtonBuilder()
        .setCustomId("next")
        .setLabel("次に進む")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("⏩")
    ];

    // buttons全てに処理をし、二つのボタンを合わせたActionRowを作る
    const row = buttons.reduce((previous, button) => {
      return new ActionRowBuilder<ButtonBuilder>(previous).addComponents(button);
    }, new ActionRowBuilder<ButtonBuilder>);

    // 設定
    this.row = row;
  }
}

// ここでexport
export {
  getRootJSON,
  getRelativePath,
  getNowTimestamp,
  getRandomStatus,
  cleanStatusJSON,
  concatShopString,
  splitArray,
  parsePage,
  getPaging,
  setPagingEmbeds,
  checkCommandCooldown,
  setComponentCollector,
  PagingButton
}