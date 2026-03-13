// ユーザーの所持品などについての型をまとめたファイル

type ItemsKey = "種類" | "名前" | "値段" | "説明" | "威力";

// アイテムのデータの型
type Items = Record<ItemsKey, string | number>;

// ユーザーの持ち物のデータの型
interface Inventory {
  gold?: number;
  items?: Array<Items>
}