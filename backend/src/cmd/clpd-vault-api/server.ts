// dependencies
import { http, bankScrap, config } from "@internal";

config.validateVaultApiEnvs();

// clients
// const firestore = new Firestore({ projectId: config.PROJECT_ID, databaseId: config.DATABASE_ENV });

// storages
const vaultBalanceStorage = new bankScrap.VaultBalanceStorage();

// services
const scrapService = new bankScrap.SantanderClScraper();


// http
const server = http.createServer();
http.setupVaultRoutes(server, { scrapService, storageService: vaultBalanceStorage });

export default server;
