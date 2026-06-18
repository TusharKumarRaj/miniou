import { z } from "zod";

import { userIdSelectSchema, userPublicSelectSchema } from "@repo/database/schemas/zod";

import { dynamicObject } from "../shared/dynamic-schema";

export const createUserWithEmailAndPassword = dynamicObject({
    fullName: () => z.string().min(1).describe("Full name of the user"),
    email: () => z.email().describe("Email of the user"),
    password: () => z.string().min(8).describe("Password of the user"),
});

export type CreateUserWithEmailAndPasswordType = z.infer<typeof createUserWithEmailAndPassword>;

export const createUserWithEmailAndPasswordOutput = dynamicObject({
    id: () => z.string(),
    emailVerificationRequired: () => z.boolean(),
});

export const generateUserTokenPayload = dynamicObject({
    id: () => z.string().describe("ID of the user"),
});

export type GenerateUserTokenPayloadType = z.infer<typeof generateUserTokenPayload>;

export const signInUserWithEmailAndPassword = dynamicObject({
    email: () => z.email().describe("Email of the user"),
    password: () => z.string().describe("Password of the user"),
});

export type SignInUserWithEmailAndPasswordType = z.infer<typeof signInUserWithEmailAndPassword>;

export const signInUserWithEmailAndPasswordOutput = userIdSelectSchema;

export const getLoggedInUserInfoOutput = userPublicSelectSchema;

export const signOutOutput = dynamicObject({
    success: () => z.boolean(),
});
