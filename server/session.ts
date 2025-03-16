import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import { log } from "./vite";

const PostgresSessionStore = connectPg(session);

export async function setupSession(app: any) {
  if (!process.env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET environment variable is required");
  }

  // Test database connection before setting up session store
  try {
    await pool.query('SELECT NOW()');
    log('Database connection successful for session store');
  } catch (error) {
    console.error('Failed to connect to database for session store:', error);
    throw error;
  }

  const sessionStore = new PostgresSessionStore({
    pool,
    createTableIfMissing: true,
    tableName: 'session' // Explicitly name the session table
  });

  // Set up session middleware
  app.use(
    session({
      store: sessionStore,
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      },
      name: 'sid', // Custom session cookie name
    })
  );

  // Add session debug logging in development
  if (process.env.NODE_ENV !== "production") {
    app.use((req: any, _res: any, next: any) => {
      log(`Session ID: ${req.sessionID}`);
      log(`Session Data: ${JSON.stringify(req.session)}`);
      next();
    });
  }

  return sessionStore;
}
