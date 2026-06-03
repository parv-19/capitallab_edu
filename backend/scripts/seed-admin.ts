import "dotenv/config";
import bcrypt from "bcryptjs";
import pool from "../src/db/pool";

async function seedAdmin() {
  const email = "admin@capitallabedu.com";
  const password = "Admin@1234";
  const name = "Admin";

  const hashedPassword = await bcrypt.hash(password, 12);

  const { rows } = await pool.query(
    `INSERT INTO users (name, email, password, role)
     VALUES ($1, $2, $3, 'admin')
     ON CONFLICT (email) DO UPDATE SET password = $3, role = 'admin'
     RETURNING id, name, email, role`,
    [name, email, hashedPassword],
  );

  console.log("Admin created:", rows[0]);
  console.log("\n--- Login credentials ---");
  console.log(`Email:    ${email}`);
  console.log(`Password: ${password}`);
  await pool.end();
}

seedAdmin().catch(console.error);
