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

const saveData = await readFile(latestSaveFilePath);

const dbStartSequence = "RawDatabaseImage"
    .split("")
    .map((character) =>
        Number.parseInt(
            character.charCodeAt(0).toString(16),
            16,
        )
    );

const dbStartSequenceIndex = findIndexOfSequence(saveData, dbStartSequence);

const dbSizeOffsetIndex = dbStartSequenceIndex + 61;
const dbStartOffsetIndex = dbSizeOffsetIndex + 4;
const dbSizeBytes = saveData.slice(dbSizeOffsetIndex, dbStartOffsetIndex);
const dataView = new DataView(dbSizeBytes.buffer);
const dbSize = dataView.getInt32(0, true);
const dbEndOffsetIndex = dbStartOffsetIndex + dbSize;
const dbData = saveData.slice(dbStartOffsetIndex, dbEndOffsetIndex);

console.log(dbData);

const dbPath = resolve("./db.sqlite");

await writeFile(dbPath, dbData);