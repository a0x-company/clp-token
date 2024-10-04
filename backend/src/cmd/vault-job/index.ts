import 'module-alias/register';

import { BigQuery } from '@google-cloud/bigquery';
import axios from 'axios';
import { config } from "@internal";

if (!config.PROJECT_ID || !config.A0X_API_KEY) {
  throw new Error("❌ Required environment variables are missing");
}

const VAULT_API_URL = 'https://development-vault-api-claucondor-61523929174.us-central1.run.app/vault/balance';
const DATASET_ID = 'vault_data';
const TABLE_ID = 'balance_history';

interface VaultBalance {
  balance: number;
}

async function getVaultBalance(): Promise<VaultBalance> {
  try {
    const response = await axios.get<VaultBalance>(VAULT_API_URL, {
      headers: {
        'api-key': config.A0X_API_KEY
      }
    });
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching vault balance:', error);
    throw error;
  }
}

async function saveBalanceToBigQuery(balance: number): Promise<void> {
  const bigquery = new BigQuery({
    projectId: config.PROJECT_ID,
  });

  const row = {
    timestamp: BigQuery.timestamp(new Date()),
    balance: balance
  };

  try {
    await bigquery
      .dataset(DATASET_ID)
      .table(TABLE_ID)
      .insert([row]);
    console.log('✅ Balance saved to BigQuery');
  } catch (error) {
    console.error('❌ Error saving to BigQuery:', error);
    throw error;
  }
}

async function createTableIfNotExists(): Promise<void> {
  const bigquery = new BigQuery({
    projectId: config.PROJECT_ID,
  });

  const schema = [
    { name: 'timestamp', type: 'TIMESTAMP' },
    { name: 'balance', type: 'FLOAT' },
  ];

  try {
    await bigquery
      .dataset(DATASET_ID)
      .createTable(TABLE_ID, { schema });
    console.log('✅ Tabla creada en BigQuery');
  } catch (error: any) {
    if (error.code === 409) {
      console.log('ℹ️ La tabla ya existe en BigQuery');
    } else {
      console.error('❌ Error al crear la tabla en BigQuery:', error);
      throw error;
    }
  }
}

async function main(): Promise<void> {
  console.log("🚀 Iniciando trabajo de actualización del saldo de la bóveda...");

  try {
    await createTableIfNotExists();

    const { balance } = await getVaultBalance();
    console.log(`📊 Saldo actual de la bóveda: ${balance}`);

    await saveBalanceToBigQuery(balance);

    console.log("🏁 Trabajo de actualización del saldo completado");
  } catch (error) {
    console.error("❌ Error en el trabajo de actualización:", error);
    process.exit(1);
  }
}


main();