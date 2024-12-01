import path from "path";

export const STORAGE_PATH = path.join(process.cwd(), 'storage');
export const WEBSITE_PASSWORD = process.env.WEBSITE_PASSWORD || "password";
export const MONGO_DB_CONNECTION_STRING = `mongodb://${process.env.MONGO_INITDB_ROOT_USERNAME}:${process.env.MONGO_INITDB_ROOT_PASSWORD}@localhost:27017/`;
