import cron from "node-cron";
import { checkLowFloat } from "../distributor/low-float.service";

export function startFloatScheduler() {
  cron.schedule("*/5 * * * *", async () => {
    console.log("Running low float check...");
    try {
      await checkLowFloat();
    } catch (err: any) {
      console.error("[float-scheduler] checkLowFloat error:", err?.message ?? String(err));
    }
  });
}