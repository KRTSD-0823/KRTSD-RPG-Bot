// ステータスに関する型をまとめたファイル

// ステータスの基本的な型
interface Status {
  体力: number;
  我慢強さ: number;
  魔力量: number;
  魔法効率: number;
  魔法抵抗: number;
  力: number;
  魔力: number;
  HP?: number;
  MP?: number;
  REG?: number;
  MREG?: number;
  AT?: number;
  MAT?: number;
  MPC?: number;
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
};

// ステータスオブジェクトのキーの型
type StatusKey = "体力" | "魔力量" | "我慢強さ" | "魔法抵抗" | "力" | "魔力" | "魔法効率";