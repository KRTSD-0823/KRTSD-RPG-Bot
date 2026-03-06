// users_data.jsonの型をまとめたファイル

interface UserData {
    status?: Status;
    inventory?: Inventory;
}

interface UsersData {
    [key: string]: UserData;
}