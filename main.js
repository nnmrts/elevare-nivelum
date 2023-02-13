import { Database } from "sqlite3";
import { join, resolve } from "std/path";

import { Temporal, toTemporalInstant } from "npm:@js-temporal/polyfill";

import { findIndexOfSequence } from "./utilities.js";

Date.prototype.toTemporalInstant = toTemporalInstant;

const {
    readFile,
    readDir,
    stat,
    writeFile
} = Deno;

const {
    Instant,
} = Temporal;

const savesFolder = resolve("./saves");

let latestSaveFileEntry;

for await (const { name, isFile } of readDir(savesFolder)) {
    if (isFile && name.startsWith("HL") && name.endsWith(".sav")) {
        const path = join(savesFolder, name);

        const { mtime: modifiedDate } = await stat(path);

        const modified = modifiedDate.toTemporalInstant();

        let isLatest = true;

        if (latestSaveFileEntry) {
            const { modified: latestModified } = latestSaveFileEntry;
            isLatest = Instant.compare(modified, latestModified) >= 0;
        }

        if (isLatest) {
            latestSaveFileEntry = {
                path,
                modified,
            };
        }
    }
}

const {
    path: latestSaveFilePath,
} = latestSaveFileEntry;

console.log(`changing ${latestSaveFilePath}`);

const saveData = await readFile(latestSaveFilePath);

const databaseStartSequence = "RawDatabaseImage"
    .split("")
    .map((character) =>
        Number.parseInt(
            character.charCodeAt(0).toString(16),
            16,
        )
    );

const databaseStartSequenceIndex = findIndexOfSequence(saveData, databaseStartSequence);

const databaseSizeOffsetIndex = databaseStartSequenceIndex + 61;
const databaseStartOffsetIndex = databaseSizeOffsetIndex + 4;
const databaseSizeBytes = saveData.slice(databaseSizeOffsetIndex, databaseStartOffsetIndex);
const dataView = new DataView(databaseSizeBytes.buffer);
const databaseSize = dataView.getInt32(0, true);
const databaseEndOffsetIndex = databaseStartOffsetIndex + databaseSize;
const databaseData = saveData.slice(databaseStartOffsetIndex, databaseEndOffsetIndex);

const databasePath = resolve("./db.sqlite");

await writeFile(databasePath, databaseData);

const database = new Database(databasePath);

const query = `
    UPDATE MiscDataDynamic
        SET DataValue = 80000
        WHERE DataOwner = 'ExperienceManager'
        AND DataName = 'ExperiencePoints';
`;

database.exec(query);

database.close();

const newDatabaseData = await readFile(databasePath);

dataView.setUint32(0, newDatabaseData.length, true);

const newSaveData = Uint8Array.from([
    ...saveData.slice(0, databaseSizeOffsetIndex),
    ...new Uint8Array(dataView.buffer),
    ...newDatabaseData,
    ...saveData.slice(databaseEndOffsetIndex),
]);

await writeFile(latestSaveFilePath, newSaveData);