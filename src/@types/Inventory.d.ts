// ユーザーの所持品の型をまとめたファイル

// ユーザーの持ち物のデータの型
interface Inventory {
  gold: number;
  sp: number;
  items: Array<Items>
}