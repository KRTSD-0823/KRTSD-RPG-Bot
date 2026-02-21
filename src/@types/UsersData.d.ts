// users_data.jsonの型をまとめたファイル

interface UsersData {
  // JSONをimportした時はdefault1プロパティにデータが入ってくる
  default: {
    [key: string]: Status;
  };
}