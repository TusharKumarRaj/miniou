import { withUserTenant } from "@repo/corsair";

import IntegrationService from "../integration";

import {
    fetchGmailMessage,
    fetchGmailThread,
    fetchLabelMessages,
    sendGmailEmail,
} from "./client";
import {
    getMessageInputModel,
    type GetMessageInputModel,
    getThreadInputModel,
    type GetThreadInputModel,
    listInboxInputModel,
    type ListInboxInputModel,
    sendEmailInputModel,
    type SendEmailInputModel,
} from "./model";

export default class GmailService {
    private integrationService = new IntegrationService();

    private async requireGmail(userId: string) {
        const status = await this.integrationService.getConnectionStatus(userId);
        if (!status.gmail) {
            throw new Error("Connect Gmail in settings to use your inbox.");
        }
    }

    public async listInbox(userId: string, payload: ListInboxInputModel) {
        const { label, maxResults, pageToken, cursor } =
            await listInboxInputModel.parseAsync(payload);
        await this.requireGmail(userId);

        const tenant = withUserTenant(userId);
        return fetchLabelMessages(tenant, {
            labelIds: [label],
            maxResults,
            pageToken: pageToken ?? cursor ?? undefined,
        });
    }

    public async getMessage(userId: string, payload: GetMessageInputModel) {
        const { messageId } = await getMessageInputModel.parseAsync(payload);
        await this.requireGmail(userId);

        const tenant = withUserTenant(userId);
        return fetchGmailMessage(tenant, messageId);
    }

    public async getThread(userId: string, payload: GetThreadInputModel) {
        const { threadId } = await getThreadInputModel.parseAsync(payload);
        await this.requireGmail(userId);

        const tenant = withUserTenant(userId);
        return fetchGmailThread(tenant, threadId);
    }

    public async sendEmail(userId: string, payload: SendEmailInputModel) {
        const input = await sendEmailInputModel.parseAsync(payload);
        await this.requireGmail(userId);

        const tenant = withUserTenant(userId);
        return sendGmailEmail(tenant, input);
    }
}
