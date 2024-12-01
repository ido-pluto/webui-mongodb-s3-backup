import fsExtra from "fs-extra/esm";
import { JSONFilePreset } from "lowdb/node";
import path from "path";
import { MONGO_DB_CONNECTION_STRING, STORAGE_PATH } from "../config.ts";

const storage = path.join(STORAGE_PATH, 'db.json');
await fsExtra.ensureDir(path.dirname(storage));

const DEFAULT_CONFIG = {
    mongoAdminConnectionString: "",
    backupIntervalHours: "",
    latestIntervalError: "",
    backupON: false,
    maxBackupFiles: 10,
    s3Backup: {
        accessKeyId: "",
        secretAccessKey: "",
        bucket: "",
        region: "",
        endpoint: ""
    }
}


export const jsonDB = await JSONFilePreset(storage, DEFAULT_CONFIG);
jsonDB.data.mongoAdminConnectionString ||= MONGO_DB_CONNECTION_STRING;
Object.assign(jsonDB.data, {...DEFAULT_CONFIG, ...jsonDB.data});