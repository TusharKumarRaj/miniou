import { authenticatedProcedure, publicProcedure, router } from "../../trpc";
import {
    createUserWithEmailAndPasswordInputModel,
    createUserWithEmailAndPasswordOutputModel,
    signInUserWithEmailAndPasswordInputModel,
    signInUserWithEmailAndPasswordOutputModel,
    getLoggedInUserInfoInputModel,
    getLoggedInUserInfoOutputModel,
    signOutInputModel,
    signOutOutputModel,
} from "./model";

import { userService } from "../../services";

import { getAuthCookieOptions, getClearAuthCookieOptions } from "../../utils/session-cookie";
import { generatePath } from "../../utils/path-generator";
const getPath = generatePath("/authentication");
const TAGS = ["Authentication"];

export const authRouter = router({
    createUserWithEmailAndPassword: publicProcedure
        .meta({
            openapi: {
                method: "POST",
                path: getPath("/createUserWithEmailAndPassword"),
                tags: TAGS,
            },
        })
        .input(createUserWithEmailAndPasswordInputModel)
        .output(createUserWithEmailAndPasswordOutputModel)
        .mutation(async ({ input, ctx }) => {
            const { fullName, email, password } = input;

            const { id, token } = await userService.createUserWithEmailAndPassword({
                fullName,
                email,
                password,
            });

            ctx.setCookie("token", token, getAuthCookieOptions());

            return { id };
        }),
    signInUserWithEmailAndPassword: publicProcedure
        .meta({
            openapi: {
                method: "POST",
                path: getPath("/signInUserWithEmailAndPassword"),
                tags: TAGS,
            },
        })
        .input(signInUserWithEmailAndPasswordInputModel)
        .output(signInUserWithEmailAndPasswordOutputModel)
        .mutation(async ({ input, ctx }) => {
            const { email, password } = input;

            const { id, token } = await userService.signInUserWithEmailAndPassword({
                email,
                password,
            });

            ctx.setCookie("token", token, getAuthCookieOptions());

            return {
                id,
            };
        }),
    getLoggedInUserInfo: publicProcedure
        .meta({
            openapi: {
                method: "GET",
                path: getPath("/getLoggedInUserInfo"),
                tags: TAGS,
            },
        })
        .input(getLoggedInUserInfoInputModel)
        .output(getLoggedInUserInfoOutputModel.nullable())
        .query(async ({ ctx }) => {
            const userToken = ctx.getCookie("token");
            if (!userToken) {
                return null;
            }

            try {
                const { id } = await userService.verifyAndDecodeUserToken(userToken);
                return await userService.getUserInfoById(id);
            } catch {
                return null;
            }
        }),
    signOut: authenticatedProcedure
        .meta({
            openapi: {
                method: "POST",
                path: getPath("/signOut"),
                tags: TAGS,
            },
        })
        .input(signOutInputModel)
        .output(signOutOutputModel)
        .mutation(async ({ ctx }) => {
            ctx.clearCookie("token", getClearAuthCookieOptions());

            return { success: true };
        }),
});
