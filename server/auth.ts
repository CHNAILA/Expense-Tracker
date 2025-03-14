import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string, existingSalt?: string) {
  try {
    const salt = existingSalt || randomBytes(16).toString("hex");
    const derivedKey = (await scryptAsync(password, salt, 32)) as Buffer;
    const hashedPassword = `${derivedKey.toString('hex')}.${salt}`;
    console.log("[DEBUG] Generated hash:", hashedPassword);
    return hashedPassword;
  } catch (error) {
    console.error("[ERROR] Error in hashPassword:", error);
    throw error;
  }
}

async function comparePasswords(supplied: string, stored: string) {
  try {
    const [storedHash, salt] = stored.split(".");
    if (!storedHash || !salt) {
      console.error("[ERROR] Invalid stored password format");
      return false;
    }

    // Generate hash for supplied password using same salt
    const suppliedPassword = await hashPassword(supplied, salt);
    console.log("[DEBUG] Comparing passwords:");
    console.log("[DEBUG] Stored password:", stored);
    console.log("[DEBUG] Supplied password hash:", suppliedPassword);

    return suppliedPassword === stored;
  } catch (error) {
    console.error("[ERROR] Error comparing passwords:", error);
    return false;
  }
}

export function setupAuth(app: Express, createDefaultCategories: (userId: number) => Promise<void>) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        console.log("[DEBUG] Login attempt for:", username);
        const user = await storage.getUserByUsername(username);

        if (!user) {
          console.log("[DEBUG] User not found:", username);
          return done(null, false);
        }

        const isValidPassword = await comparePasswords(password, user.password);
        console.log("[DEBUG] Password validation result:", isValidPassword);

        if (!isValidPassword) {
          console.log("[DEBUG] Invalid password for user:", username);
          return done(null, false);
        }

        console.log("[DEBUG] Login successful for user:", username);
        return done(null, user);
      } catch (err) {
        console.error("[ERROR] Error in LocalStrategy:", err);
        return done(err);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  app.post("/api/login", async (req, res, next) => {
    try {
      const { username, password, cnic } = req.body;
      console.log("[DEBUG] Login attempt - username:", username, "cnic:", cnic);

      const user = await storage.getUserByUsername(username);
      if (!user) {
        console.log("[DEBUG] User not found");
        return res.status(401).send("Invalid credentials");
      }

      if (user.cnic !== cnic) {
        console.log("[DEBUG] CNIC mismatch - Provided:", cnic, "Stored:", user.cnic);
        return res.status(401).send("Invalid CNIC");
      }

      passport.authenticate("local", (err: any, user: any) => {
        if (err) {
          console.error("[ERROR] Authentication error:", err);
          return next(err);
        }
        if (!user) {
          console.log("[DEBUG] Authentication failed");
          return res.status(401).send("Invalid credentials");
        }

        req.login(user, (err) => {
          if (err) {
            console.error("[ERROR] Login error:", err);
            return next(err);
          }
          console.log("[DEBUG] Login successful");
          res.status(200).json(user);
        });
      })(req, res, next);
    } catch (err) {
      console.error("[ERROR] Unexpected error during login:", err);
      next(err);
    }
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
}