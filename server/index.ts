import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import { setupAuth } from "./auth";

const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Trust first proxy
app.set("trust proxy", 1);

(async () => {
  try {
    // Test database connection before setting up session store
    await pool.query('SELECT NOW()');
    log('Database connection successful');

    const PostgresSessionStore = connectPg(session);
    const sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
      tableName: 'session'
    });

    // Set up session middleware with detailed configuration
    app.use(
      session({
        store: sessionStore,
        secret: process.env.SESSION_SECRET!,
        resave: false,
        saveUninitialized: false,
        cookie: {
          secure: process.env.NODE_ENV === "production",
          httpOnly: true,
          maxAge: 24 * 60 * 60 * 1000, // 24 hours
        },
        name: 'sid',
      })
    );

    // Debug logging for session initialization
    app.use((req, _res, next) => {
      if (process.env.NODE_ENV !== "production") {
        log(`Session ID: ${req.sessionID}`);
        log(`Session Data: ${JSON.stringify(req.session)}`);
      }
      next();
    });

    // Set up authentication after session
    setupAuth(app);
    log('Authentication configured successfully');

    // Register routes after auth setup
    const server = await registerRoutes(app);

    // Error handling middleware
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      console.error('Error:', err);
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
    });

    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    const port = 5000;
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      log(`serving on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();