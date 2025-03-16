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
  // Initialize passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Debug logging for serialization
  passport.serializeUser((user: Express.User, done) => {
    console.log('Serializing user:', user.id);
    done(null, user.id);
  });

  // Deserialize by fetching fresh user data
  passport.deserializeUser(async (id: number, done) => {
    try {
      console.log('Deserializing user:', id);
      const user = await storage.getUser(id);
      if (!user) {
        console.log('User not found during deserialization');
        return done(null, false);
      }
      console.log('User deserialized successfully');
      done(null, user);
    } catch (err) {
      console.error('Error during deserialization:', err);
      done(err);
    }
  });

  // User endpoint to check current session
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
}