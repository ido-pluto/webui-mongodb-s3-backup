import fsExtra from "fs-extra/esm";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

export const mongodbKeyFile = path.join(process.cwd(), 'storage', 'mongodb-keyfile');
await fsExtra.ensureDir(path.dirname(mongodbKeyFile));

console.log("Creating MongoDB key file...");
const key = crypto.randomBytes(756).toString('base64');
await fs.writeFile(mongodbKeyFile, key);
await fs.chmod(mongodbKeyFile, 0o600);
console.log("MongoDB key file created successfully.");

