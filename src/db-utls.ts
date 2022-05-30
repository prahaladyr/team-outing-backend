import { MongoClient, Collection } from 'mongodb';

export const DB_NAME = 'team-outing';
export const DATABASE_URL = `mongodb+srv://prahalad:tTGb7PvKYICULf8E@prahaladcluster.enn0b4u.mongodb.net`;

let databaseClient: MongoClient;

export function connectToDatabaseServer() {
    return new Promise<void>((resolve, reject) => {
        const defaultMongoClient = new MongoClient(DATABASE_URL);
        defaultMongoClient.connect(async (error, returnedDatabaseClient) => {
            if (error) {
                reject(error);
                return;
            }
            databaseClient = returnedDatabaseClient;
            resolve();
        });
    })
}

export function getDatabaseClient() {
    return databaseClient;
}