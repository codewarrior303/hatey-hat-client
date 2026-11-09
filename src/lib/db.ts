import { MongoClient, Db } from "mongodb";

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGODB_DB || "hatey-hat";

declare global {
  var _mongoClientInstance: MongoClient | undefined;
}

const client =
  global._mongoClientInstance ||
  new MongoClient(uri, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
  });

if (process.env.NODE_ENV === "development") {
  global._mongoClientInstance = client;
}

export function getClientDb(): Db {
  return client.db(dbName);
}
