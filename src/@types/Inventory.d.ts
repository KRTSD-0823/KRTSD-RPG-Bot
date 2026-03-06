// ユーザーの所持品などについての型をまとめたファイル

interface Items {
  [key: string]: string | number;
}

interface Inventory {
  gold?: number;
  items?: Array<Items>
}