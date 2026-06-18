import { publicProcedure, router } from "../../trpc";
import { getHealthInputModel, getHealthOutputModel } from "./model";

export const healthRouter = router({
  getHealth: publicProcedure
    .meta({ openapi: { method: "GET", path: "/health" } })
    .input(getHealthInputModel)
    .output(getHealthOutputModel)
    .query(async () => {
      return {
        status: "healthy",
      };
    }),
});
