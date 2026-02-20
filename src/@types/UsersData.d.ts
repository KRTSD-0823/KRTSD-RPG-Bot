// users_data.jsonの型をまとめたファイル

// なんかね、import文を書かないとdeclareした時に他のファイルで読み込めないんよね
import "";

declare global {
  interface UsersData {
    // JSONをimportした時はdefault1プロパティにデータが入ってくる
    default: {
      [key: string]: Status;
    };
  }
}