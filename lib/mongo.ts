import { MongoClient, ServerApiVersion, Db } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

if (!process.env.MONGODB_DB) {
  throw new Error('Please define the MONGODB_DB environment variable inside .env.local');
}

const dbName = process.env.MONGODB_DB;

// One client per process, kept on `global` so dev hot reloads and warm lambdas reuse it.
const globalWithMongo = global as typeof globalThis & {
  _mongoClient?: MongoClient;
  _mongoConnectPromise?: Promise<Db>;
};

const client = globalWithMongo._mongoClient ?? new MongoClient(process.env.MONGODB_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  maxPoolSize: 10,
  // Warm sockets skip the ~100ms Atlas TLS handshake after an idle period.
  minPoolSize: 2,
  maxIdleTimeMS: 60_000,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
});
globalWithMongo._mongoClient = client;

/** Connects once; concurrent callers share the same pending handshake. */
export function getDb(): Promise<Db> {
  globalWithMongo._mongoConnectPromise ??= client
    .connect()
    .then((c) => c.db(dbName))
    .catch((error) => {
      // Forget the failed handshake so the next request retries.
      globalWithMongo._mongoConnectPromise = undefined;
      console.error('MongoDB connection error:', error);
      throw new Error('Failed to connect to MongoDB');
    });
  return globalWithMongo._mongoConnectPromise;
}

