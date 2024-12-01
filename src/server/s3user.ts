import { DeleteObjectCommand, GetObjectCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { jsonDB } from "../utils/jsonDB.ts";
import fsExtra from "fs-extra/esm";
import path from "path";
import fs from "fs";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const LINK_EXPIRATION_TIME = 60 * 60 * 1; // 1 hours

function getClient() {
    return new S3Client({
        endpoint: jsonDB.data.s3Backup.endpoint,
        region: jsonDB.data.s3Backup.region,
        credentials: {
            accessKeyId: jsonDB.data.s3Backup.accessKeyId,
            secretAccessKey: jsonDB.data.s3Backup.secretAccessKey
        },
        forcePathStyle: true
    });
}

export async function listAllS3Files(nextFilesToken?: string) {
    const client = getClient();
    const command = new ListObjectsV2Command({
        Bucket: jsonDB.data.s3Backup.bucket,
        ContinuationToken: nextFilesToken
    });
    const response = await client.send(command);
    if (response.NextContinuationToken) {
        return {
            ...response,
            Contents: [
                ...(response.Contents ?? []),
                ...await listAllS3Files(response.NextContinuationToken)
            ]
        };
    }

    return response?.Contents ?? [];
}


export async function uploadFileStream(filePath: string, Key = path.basename(filePath)) {
    try {
        const client = getClient();
        if (!await fsExtra.pathExists(filePath)) {
            throw new Error("File not found");
        }

        const fileStream = fs.createReadStream(filePath);

        const params = {
            Bucket: jsonDB.data.s3Backup.bucket,
            Key,
            Body: fileStream,
        };

        const command = new PutObjectCommand(params);
        await client.send(command);
        return Key;
    } catch (err) {
        console.error("Error", err);
    }
}

export async function deleteFileS3(key: string) {
    try {
        const client = getClient();
        const params = {
            Bucket: jsonDB.data.s3Backup.bucket,
            Key: key
        };

        const command = new DeleteObjectCommand(params);
        await client.send(command);
    } catch (err) {
        console.error("Error", err);
    }
}

export async function createDownloadLink(key: string) {
    // download link for private bucket
    const client = getClient();
    const command = new GetObjectCommand({
        Bucket: jsonDB.data.s3Backup.bucket,
        Key: key
    });

    const presignedUrl = await getSignedUrl(client, command, {
        expiresIn: LINK_EXPIRATION_TIME,
    });

    return presignedUrl;
}

export async function keepOnlyXRecentBackups(x: number) {
    const allFiles = await listAllS3Files();
    const filesToDelete = allFiles
        .sort((a, b) => a.LastModified?.getTime() - b.LastModified?.getTime())
        .slice(0, -x);

    for (const file of filesToDelete) {
        await deleteFileS3(file.Key);
    }
}