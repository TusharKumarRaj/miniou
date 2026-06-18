import { db, eq } from "@repo/database";
import { usersTable } from "@repo/database/models/user";

import bcrypt from "bcryptjs";
import * as JWT from "jsonwebtoken";

import { isEmailVerified, sendUserVerificationEmail } from "../auth/google";
import { env } from "../env";
import IntegrationService from "../integration";

import {
    createUserWithEmailAndPassword,
    type CreateUserWithEmailAndPasswordType,
    generateUserTokenPayload,
    type GenerateUserTokenPayloadType,
    signInUserWithEmailAndPassword,
    type SignInUserWithEmailAndPasswordType,
} from "./model";

export default class UserService {
    private integrationService = new IntegrationService();

    private async getUserByEmail(email: string) {
        const result = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase()));

        if (!result || result.length === 0) return null;

        return result[0];
    }

    public async generateUserToken(payload: GenerateUserTokenPayloadType) {
        const { id } = await generateUserTokenPayload.parseAsync(payload);

        const token = JWT.sign({ id }, env.JWT_SECRET);

        return { token };
    }

    public async createUserWithEmailAndPassword(payload: CreateUserWithEmailAndPasswordType) {
        const { fullName, email, password } =
            await createUserWithEmailAndPassword.parseAsync(payload);

        const normalizedEmail = email.toLowerCase();
        const existingUser = await this.getUserByEmail(normalizedEmail);
        if (existingUser) throw new Error("User with this email already exists");

        const passwordHash = await bcrypt.hash(password, 10);

        const result = await db
            .insert(usersTable)
            .values({ fullName, email: normalizedEmail, passwordHash })
            .returning({ id: usersTable.id });

        if (!result || result.length === 0 || !result[0]?.id) {
            throw new Error("Something went wrong while creating a new user");
        }

        const userId = result[0].id;
        await this.integrationService.ensureTenant(userId);
        await sendUserVerificationEmail(userId, normalizedEmail);

        return {
            id: userId,
            emailVerificationRequired: true,
        };
    }

    public async signInUserWithEmailAndPassword(payload: SignInUserWithEmailAndPasswordType) {
        const { email, password } = await signInUserWithEmailAndPassword.parseAsync(payload);

        const existingUser = await this.getUserByEmail(email);
        if (!existingUser) {
            throw new Error("User with this email does not exist");
        }

        if (!existingUser.passwordHash) {
            throw new Error("This account uses Google sign-in. Continue with Google.");
        }

        const isValid = await bcrypt.compare(password, existingUser.passwordHash);
        if (!isValid) throw new Error("Invalid email address or password");

        if (!isEmailVerified(existingUser)) {
            await sendUserVerificationEmail(existingUser.id, existingUser.email);
            throw new Error("Please verify your email before signing in. We sent you a new verification link.");
        }

        const { token } = await this.generateUserToken({ id: existingUser.id });

        await this.integrationService.ensureTenant(existingUser.id);

        return {
            id: existingUser.id,
            token,
        };
    }

    public async getUserInfoById(id: string) {
        const user = await db
            .select({ id: usersTable.id, fullName: usersTable.fullName, email: usersTable.email })
            .from(usersTable)
            .where(eq(usersTable.id, id));

        if (!user || user.length === 0) throw new Error("User with this ID does not exist");

        return user[0]!;
    }

    public async verifyAndDecodeUserToken(token: string) {
        try {
            const result = JWT.verify(token, env.JWT_SECRET) as GenerateUserTokenPayloadType;

            return result;
        } catch {
            throw new Error("Invalid token");
        }
    }
}
