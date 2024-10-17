// dependencies
import { Firestore } from "@google-cloud/firestore";
import { Storage } from "@google-cloud/storage";
import { http, config, users, deposits } from "@internal";


config.validateRequiredEnvs();

// clients
const firestore = new Firestore({projectId: config.PROJECT_ID, databaseId: config.DATABASE_ENV});
const bucketStorage = new Storage({projectId: config.PROJECT_ID});

// storages
const userDataStorage = new users.UserDataStorage(firestore);

// services
const userService = new users.UserService(userDataStorage);
const depositService = new deposits.DepositService(
    firestore,
    bucketStorage,
    config.DISCORD_WEBHOOK_URL as string,
    config.RESEND_API_KEY as string
  );


// http
const server = http.createServer();
http.setupUserRoutes(server, userService);
http.setupDepositRoutes(server, depositService, userService);

console.log("Server configured with user services");

export default server;