import passport from "passport";
import { Express } from "express";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

export function setupAuth(app: Express) {
  // Initialize passport after session is set up in index.ts
  app.use(passport.initialize());
  app.use(passport.session());

  // Serialize only the user ID to the session
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // Deserialize by fetching fresh user data each time
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        return done(null, false);
      }
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
}