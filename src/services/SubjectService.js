import * as SubjectRepo from "../repositories/SubjectRepo.js";
export const getCompulsoryForTerm = (term) => SubjectRepo.findCompulsoryByTerm(term);
export const getGenEdForTerm = (term, studentId) => SubjectRepo.findGenEdByTerm(term, studentId);