const getExperienceForLevel = ({ level, maxLevel, lastLevelPoints }) => level !== maxLevel ? Math.round(((lastLevelPoints * (level ** 2)) / ((maxLevel - 1) ** 2)) / 5) * 5 : 99999999;

export default getExperienceForLevel;