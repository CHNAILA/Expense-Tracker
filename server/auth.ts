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
    const buf = await scryptAsync(password, salt, 64) as Buffer;
    return `${buf.toString('hex')}.${salt}`;
  } catch (error) {
    console.error("[ERROR] Error in hashPassword:", error);
    throw error;
  }
}

async function comparePasswords(supplied: string, stored: string) {
  try {
    const [storedHash, salt] = stored.split(".");
    if (!storedHash || !salt) {
      throw new Error("Invalid stored password format");
    }

    // Generate supplied password hash using the same salt
    const suppliedHash = await hashPassword(supplied, salt);
    const [suppliedHashPart] = suppliedHash.split(".");

    return storedHash === suppliedHashPart;
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
        const user = await storage.getUserByUsername(username);
        if (!user) {
          return done(null, false);
        }

        const isValidPassword = await comparePasswords(password, user.password);
        if (!isValidPassword) {
          return done(null, false);
        }

        return done(null, user);
      } catch (err) {
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

      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).send("Invalid credentials");
      }

      if (user.cnic !== cnic) {
        return res.status(401).send("Invalid CNIC");
      }

      passport.authenticate("local", (err: any, user: any) => {
        if (err) return next(err);
        if (!user) return res.status(401).send("Invalid credentials");

        req.login(user, (err) => {
          if (err) return next(err);
          res.status(200).json(user);
        });
      })(req, res, next);
    } catch (err) {
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