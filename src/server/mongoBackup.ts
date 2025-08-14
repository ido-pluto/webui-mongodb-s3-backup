import { $ } from 'execa';
import * as fs from "fs-extra";
import oldFs from "fs";
import path from "path";
import { STORAGE_PATH } from '../config.ts';
import { jsonDB } from '../utils/jsonDB.ts';
import archiver from "archiver";
import { createDownloadLink, uploadFileStream } from './s3user.ts';
import { downloadFile } from 'ipull';
import { withLock, isLockActive } from 'lifecycle-utils';
import filenamify from 'filenamify';
import unzipper from "unzipper";

const backupPath = path.join(STORAGE_PATH, 'db-temp');
const backupDBZipPath = path.join(STORAGE_PATH, 'tempDb.zip');

const oneProcessAtATimeLockContext = {};

export function isBackupInProgress() {
    return isLockActive(oneProcessAtATimeLockContext, "backupDatabase");
}

export function isRestoreInProgress() {
    return isLockActive(oneProcessAtATimeLockContext, "restoreDatabaseFromZip");
}

export async function backupDatabase() {
    return await withLock(oneProcessAtATimeLockContext, "database", async () => {
        return await withLock(oneProcessAtATimeLockContext, "backupDatabase", async () => {
            await fs.emptyDir(backupPath);

            try {
                const { stderr, code } = await $`mongodump --uri="${jsonDB.data.mongoAdminConnectionString}" --out="${backupPath}"`;
                if (code) {
                    throw new Error(stderr);
                }

                const out = oldFs.createWriteStream(backupDBZipPath);
                const archive = archiver("zip", {
                    zlib: { level: 9 },
                    forceZip64: true
                });

                archive.pipe(out);
                archive.directory(backupPath, false);
                await archive.finalize();

                const backupName = filenamify(`mongodb-backup-${new Date().toISOString()}.zip`, { replacement: '_' });
                await uploadFileStream(backupDBZipPath, backupName);

                return stderr;
            } finally {
                await fs.emptyDir(backupPath);
                await fs.remove(backupDBZipPath);
            }
        });
    });
}

export async function restoreDatabaseFromZip(key: string) {
    return await withLock(oneProcessAtATimeLockContext, "database", async () => {
        return await withLock(oneProcessAtATimeLockContext, "restoreDatabaseFromZip", async () => {
            const downloadLink = await createDownloadLink(key);
            const downloader = await downloadFile({
                url: downloadLink,
                directory: STORAGE_PATH,
            });

            try {
                await downloader.download();
                await fs.emptyDir(backupPath);

                await oldFs.createReadStream(downloader.finalFileAbsolutePath)
                    .pipe(unzipper.Extract({ path: backupPath }))
                    .promise();

                const { stderr, code } = await $`mongorestore --uri="${jsonDB.data.mongoAdminConnectionString}" --dir="${backupPath}" --drop`;
                if (code) {
                    throw new Error(stderr);
                }
                return stderr;
            } finally {
                await fs.remove(downloader.finalFileAbsolutePath);
                await fs.emptyDir(backupPath);
            }
        });
    });
}