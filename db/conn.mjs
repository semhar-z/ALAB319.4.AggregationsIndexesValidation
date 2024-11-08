import dotenv from 'dotenv';
dotenv.config();

import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.ATLAS_URI);

// const connectionString = "mongodb+srv://zesemy:Heran%402023@mongopractice.7e8lj.mongodb.net/" || "";
// console.log(connectionString);
// const client = new MongoClient(connectionString);

let conn;
try {
  conn = await client.connect();
} catch (e) {
  console.error(e);
}

let db = conn.db("sample_training");

export default db;
