import { MongoClient, ServerApiVersion, MongoClientOptions, Db } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

if (!process.env.MONGODB_DB) {
  throw new Error('Please define the MONGODB_DB environment variable inside .env.local');
}

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB;

const options: MongoClientOptions = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  maxPoolSize: 10,
  // Keep a warm pool: Atlas over TLS costs ~100ms+ to hand-shake a fresh socket, and with
  // minPoolSize 0 an idle period meant the next request paid that on top of the query.
  minPoolSize: 2,
  maxIdleTimeMS: 60_000,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

// A single client, reused across hot reloads in dev AND across invocations in production.
// The previous version built a fresh MongoClient per module instance in production, so every
// cold lambda re-did the full TLS + auth handshake before its first query could run.
const globalWithMongo = global as typeof globalThis & {
  _mongoClient?: MongoClient;
  _mongoConnectPromise?: Promise<Db>;
};

const client: MongoClient = globalWithMongo._mongoClient ?? new MongoClient(uri, options);
globalWithMongo._mongoClient = client;

// connect() is idempotent in the driver, but we memoise the *promise* so concurrent callers
// during a cold start queue on one handshake instead of racing several.
function connect(): Promise<Db> {
  if (!globalWithMongo._mongoConnectPromise) {
    globalWithMongo._mongoConnectPromise = client
      .connect()
      .then((c) => c.db(dbName))
      .catch((error) => {
        // Don't cache a failed handshake -- the next request should be free to retry.
        globalWithMongo._mongoConnectPromise = undefined;
        console.error('MongoDB connection error:', error);
        throw new Error('Failed to connect to MongoDB');
      });
  }
  return globalWithMongo._mongoConnectPromise;
}

export async function connectToDatabase() {
  const db = await connect();
  return { client, db };
}

/** Prefer this over connectToDatabase() when you only need the Db handle. */
export async function getDb(): Promise<Db> {
  return connect();
}

export async function closeConnection() {
  if (client) {
    await client.close();
    globalWithMongo._mongoConnectPromise = undefined;
  }
}

export default client;
