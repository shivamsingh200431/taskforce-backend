import { DIFFICULTY_POINTS } from "../constants/metadata.constants.js";

export const getDifficultyPoints = (difficulty) => {
    return DIFFICULTY_POINTS[difficulty];
};