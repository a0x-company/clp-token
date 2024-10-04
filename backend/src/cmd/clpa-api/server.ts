// dependencies
import { Firestore } from "@google-cloud/firestore";
import { http, config, users } from "@internal";


config.validateRequiredEnvs();

// clients
const firestore = new Firestore({projectId: config.PROJECT_ID, databaseId: config.DATABASE_ENV});

// storages
const userDataStorage = new users.UserDataStorage(firestore);

// services
const userService = new users.UserService(userDataStorage);



// http
const server = http.createServer();
http.setupUserRoutes(server, userService);

console.log("Server configured with user services");

export default server;