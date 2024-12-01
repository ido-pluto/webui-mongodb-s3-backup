import nodeSchedule from 'node-schedule';
import { jsonDB } from '../utils/jsonDB.ts';
import { backupDatabase } from './mongoBackup.ts';
import { keepOnlyXRecentBackups } from './s3user.ts';

let currentJobs: nodeSchedule.Job[] = [];

function cancelAllJobs() {
    currentJobs.forEach(job => job?.cancel());
    currentJobs = [];
}

function scheduleJob(times: string[], task: () => any) {
    cancelAllJobs();

    times.forEach((time) => {
        const [hour, minute] = time.split(':').map(x => x.trim()).map(Number);
        const job = nodeSchedule.scheduleJob({ hour, minute }, task);
        currentJobs.push(job);
        console.log(`Job scheduled at ${hour}:${minute} every day`);
    });
}

export function changeBackupInterval(){
    if (jsonDB.data.backupON) {
        const backupIntervalHours = jsonDB.data.backupIntervalHours.split(',').map(x => x.trim());
        scheduleJob(backupIntervalHours, async () => {
            try {
            console.log(`${new Date().toLocaleString()} Backup started`);
            await backupDatabase();
            await keepOnlyXRecentBackups(jsonDB.data.maxBackupFiles);
            console.log(`${new Date().toLocaleString()} Backup completed`);
            } catch (error) {
                jsonDB.update(data => {
                    data.latestIntervalError = error?.message || error;
                    return data;
                });
                console.error('Error in backup interval', error);
            }
        });
    } else {
        cancelAllJobs();
        console.log('Backup is turned off');
    }
}

changeBackupInterval();