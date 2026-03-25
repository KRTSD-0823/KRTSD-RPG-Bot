// 店に関するデータの型をまとめたファイル

// アイテムや装備などのデータの元となる型
interface BasicItems {
  "名前": string;
  "値段"?: number;
  "コスト"?: number;
  "説明": string;
}

// 防具のデータの型
interface Armors extends BasicItems {
  "種類": "防具"
  "値段": number;
}

// 武器の種類
type WeaponTypes = "大剣" | "剣"

// 武器のデータの型
interface Weapons extends BasicItems {
  "種類": "武器";
  "武器種": WeaponTypes;
  "値段": number;
  "威力": string;
}

// アビリティのデータの型
interface Abilities extends BasicItems {
  "種類": "アビリティ";
  "武器種": Array<WeaponTypes>;
  "コスト": number;
}

// アイテムの型
type Items = Armors | Weapons | Abilities;

// ショップ本体のデータの型
interface ShopData {
  data: Array<Items>;
}