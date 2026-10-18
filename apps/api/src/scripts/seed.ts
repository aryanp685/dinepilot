import { connectDatabase, disconnectDatabase } from "../config/database";
import { ensureDemoDataSeeded } from "./seedData";

async function main() {
  await connectDatabase();
  await ensureDemoDataSeeded();
  await disconnectDatabase();
  console.log("Database seed completed successfully.");
}

main().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
