// ステータスに関する型をまとめたファイル

// ステータスオブジェクトのキーの型
type StatusKey = "体力" | "魔力量" | "我慢強さ" | "魔法効率" | "魔法抵抗" | "力" | "魔力" | "俊敏";

// ステータスの基本的な型
interface Status {
  体力: number;
  我慢強さ: number;
  魔力量: number;
  魔法効率: number;
  魔法抵抗: number;
  力: number;
  魔力: number;
  俊敏: number;
  HP?: number;
  AP?: number;
  MP?: number;
  防御力?: number;
  魔法耐性?: number;
  攻撃力?: number;
  魔法攻撃力?: number;
  素早さ?: number;
  魔力節約術?: number;
};

// ステータス値の選択肢の型
interface StatusChoice {
  体力: Array<number>;
  我慢強さ: Array<number>;
  魔力量: Array<number>;
  魔法効率: Array<number>;
  魔法抵抗: Array<number>;
  力: Array<number>;
  魔力: Array<number>;
  俊敏: Array<number>;
};