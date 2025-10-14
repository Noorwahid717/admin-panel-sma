const { execSync } = require("child_process");

try {
  const cmd = `docker compose -f docker-compose.dev.yml exec -T postgres psql -U sma -d sma_dev -c "SELECT id, email, role, full_name, created_at FROM users WHERE role='SUPERADMIN' LIMIT 10;"`;
  const out = execSync(cmd, { stdio: "pipe" }).toString();
  console.log(out);
} catch (err) {
  console.error("Failed to query superadmin:", err.message || err);
  process.exit(1);
}
