// 店に関するデータの型をまとめたファイル

type ShopKeys = "種類" | "名前" | "値段" | "説明" | "威力";

// shop
interface ShopData {
  data: Array<Record<ShopKeys, string | number>>;
}