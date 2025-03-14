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

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scryptAsync(password, salt, 32)) as Buffer;
  return `${derivedKey.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  try {
    const [hashedPassword, salt] = stored.split(".");
    const derivedKey = (await scryptAsync(supplied, salt, 32)) as Buffer;
    const storedDerivedKey = Buffer.from(hashedPassword, "hex");
    return timingSafeEqual(derivedKey, storedDerivedKey);
  } catch (error) {
    console.error("Error comparing passwords:", error);
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
        const user = await storage.getUserByUsername(username);
        if (!user) {
          console.log("User not found:", username);
          return done(null, false);
        }

        const isValidPassword = await comparePasswords(password, user.password);
        if (!isValidPassword) {
          console.log("Invalid password for user:", username);
          return done(null, false);
        }

        return done(null, user);
      } catch (err) {
        console.error("Error in LocalStrategy:", err);
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
      console.log("Login attempt for username:", username);

      const user = await storage.getUserByUsername(username);
      if (!user) {
        console.log("User not found during login:", username);
        return res.status(401).send("Invalid credentials");
      }

      if (user.cnic !== cnic) {
        console.log("Invalid CNIC for user:", username);
        return res.status(401).send("Invalid CNIC");
      }

      passport.authenticate("local", (err: any, user: any) => {
        if (err) {
          console.error("Authentication error:", err);
          return next(err);
        }
        if (!user) {
          console.log("Authentication failed for user:", username);
          return res.status(401).send("Invalid credentials");
        }

        req.login(user, (err) => {
          if (err) {
            console.error("Login error:", err);
            return next(err);
          }
          console.log("Login successful for user:", username);
          res.status(200).json(user);
        });
      })(req, res, next);
    } catch (err) {
      console.error("Unexpected error during login:", err);
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