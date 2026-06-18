import { z } from "zod";

import { dynamicEnum, dynamicObject } from "../shared/dynamic-schema";

const CORSAIR_PLUGINS = ["gmail", "googlecalendar"] as const;

export const corsairPluginModel = dynamicEnum(CORSAIR_PLUGINS);

export type CorsairPlugin = z.infer<typeof corsairPluginModel>;

export const getIntegrationStatusInputModel = z.undefined();

export const getIntegrationStatusOutputModel = dynamicObject({
    gmail: () => z.boolean(),
    googlecalendar: () => z.boolean(),
});

export const getConnectUrlInputModel = dynamicObject({
    plugin: () => corsairPluginModel,
});

export type GetConnectUrlInputModel = z.infer<typeof getConnectUrlInputModel>;

export const getConnectUrlOutputModel = dynamicObject({
    url: () => z.string(),
});
