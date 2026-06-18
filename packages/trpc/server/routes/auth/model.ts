import { z } from "zod";

export {
    createUserWithEmailAndPassword as createUserWithEmailAndPasswordInputModel,
    createUserWithEmailAndPasswordOutput as createUserWithEmailAndPasswordOutputModel,
    signInUserWithEmailAndPassword as signInUserWithEmailAndPasswordInputModel,
    signInUserWithEmailAndPasswordOutput as signInUserWithEmailAndPasswordOutputModel,
    getLoggedInUserInfoOutput as getLoggedInUserInfoOutputModel,
    signOutOutput as signOutOutputModel,
} from "@repo/services/user/model";

export const getLoggedInUserInfoInputModel = z.undefined();
export const signOutInputModel = z.object({});
