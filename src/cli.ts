import { Command } from "commander";
import { registerEstimateCommand } from "./commands/estimate.js";
import { registerBeforeYouBuildCommand } from "./commands/before-you-build.js";
import { registerTokenDoctorCommand } from "./commands/token-doctor.js";
import { registerSavingsReportCommand } from "./commands/savings-report.js";
import { registerPricingUpdateCommand } from "./commands/pricing-update.js";
import { registerOptimizeCommand } from "./commands/optimize.js";
import { registerPassportCommand } from "./commands/passport.js";
import { registerDemoCommand } from "./commands/demo.js";
import { registerBadgeCommand } from "./commands/badge.js";

const program = new Command();

program
  .name("costpassport")
  .description("AI Project Cost Planner. Know your AI build cost before you start.")
  .version("0.1.0");

registerEstimateCommand(program);
registerBeforeYouBuildCommand(program);
registerTokenDoctorCommand(program);
registerSavingsReportCommand(program);
registerPricingUpdateCommand(program);
registerOptimizeCommand(program);
registerPassportCommand(program);
registerDemoCommand(program);
registerBadgeCommand(program);

program.parseAsync(process.argv).catch((err: Error) => {
  process.stderr.write(`[costpassport] error: ${err.message}\n`);
  process.exit(1);
});
