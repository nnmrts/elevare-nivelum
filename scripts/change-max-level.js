import { Database } from "sqlite3";
import { resolve } from "std/path";
import { getExperienceForLevel } from "../utilities.js";

const {
} = Deno;

const databasePath = resolve("./PhoenixShipData.sqlite");

const database = new Database(databasePath);

const deleteQuery = "DELETE FROM ExperienceLevels";

database.exec(deleteQuery);

const maxLevel = 52;
const lastLevelPoints = 100_000;

const insertQuery = `
    INSERT INTO ExperienceLevels (ExperienceLevel, PointsForNextLevel) VALUES
        ${Array(maxLevel).fill().map((empty, index) => `(${index + 1},${getExperienceForLevel({ level: index + 1, maxLevel, lastLevelPoints })})`).join(",")};
`;

database.exec(insertQuery);

database.close();