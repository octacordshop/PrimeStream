import { db } from "./server/db";
import { users, insertUserSchema } from "./shared/schema";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function createAdminUser() {
  console.log("Creating admin user...");

  try {
    // Check if admin already exists
    const adminUsername = "admin";
    const existingAdmin = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.username, adminUsername)
    });

    if (existingAdmin) {
      console.log("Admin user already exists.");
      process.exit(0);
    }

    // Admin doesn't exist, create one
    const password = "admin123"; // You can change this to any secure password
    const hashedPassword = await hashPassword(password);

    const newAdmin = {
      username: adminUsername,
      email: "admin@streamflex.com",
      password: hashedPassword,
      isAdmin: true
    };

    // Validate the admin user
    const validatedUser = insertUserSchema.parse(newAdmin);

    // Insert the admin user
    await db.insert(users).values(validatedUser);

    console.log("Admin user created successfully!");
    console.log("Username: admin");
    console.log("Password: admin123");
    console.log("\nYou can now log in with these credentials and access the admin panel.");
  } catch (error) {
    console.error("Error creating admin user:", error);
  } finally {
    process.exit(0);
  }
}

// Run the main function
createAdminUser();