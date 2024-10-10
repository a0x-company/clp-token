import { BigQuery } from '@google-cloud/bigquery';
import { config } from '@internal';

interface VaultBalanceData {
  timestamp: Date;
  balance: number;
}

export class VaultBalanceStorage {
  private bigquery: BigQuery;
  private datasetId: string = 'clpd_vault_data';
  private tableId: string = 'balance_history';

  constructor() {
    this.bigquery = new BigQuery({
      projectId: config.PROJECT_ID,
    });

    // Ensure the table exists upon instantiation
    this.createTableIfNotExists().catch(error => {
      console.error('❌ Error ensuring the table exists:', error);
    });
  }

  public async saveBalance(balance: number): Promise<void> {
    const row = {
      timestamp: BigQuery.timestamp(new Date()),
      balance: balance
    };

    try {
      await this.bigquery
        .dataset(this.datasetId)
        .table(this.tableId)
        .insert([row]);
      console.log('✅ Balance saved to BigQuery');
    } catch (error: any) {
      // Handle specific BigQuery errors if necessary
      console.error('❌ Error saving to BigQuery:', error);
      throw error;
    }
  }

  public async createTableIfNotExists(): Promise<void> {
    const schema = [
      { name: 'timestamp', type: 'TIMESTAMP' },
      { name: 'balance', type: 'FLOAT' },
    ];

    try {
      const dataset = this.bigquery.dataset(this.datasetId);
      const table = dataset.table(this.tableId);

      const [exists] = await table.exists();
      if (!exists) {
        await table.create({ schema });
        console.log('✅ Table created in BigQuery');
      } else {
        console.log('ℹ️ Table already exists in BigQuery');
      }
    } catch (error: any) {
      console.error('❌ Error creating table in BigQuery:', error);
      throw error;
    }
  }

  public async getCurrentBalance(): Promise<number | null> {
    const query = `
      SELECT balance
      FROM \`${this.datasetId}.${this.tableId}\`
      ORDER BY timestamp DESC
      LIMIT 1
    `;

    try {
      const [rows] = await this.bigquery.query(query);
      return rows.length > 0 ? rows[0].balance : null;
    } catch (error: any) {
      console.error('❌ Error fetching current balance:', error);
      throw error;
    }
  }

  public async getHistoricalBalance(period: 'day' | 'week' | 'month' | 'year' = 'year'): Promise<VaultBalanceData[]> {
    const periodMap: { [key: string]: string } = {
      day: 'INTERVAL 1 DAY',
      week: 'INTERVAL 7 DAY',
      month: 'INTERVAL 1 MONTH',
      year: 'INTERVAL 365 DAY' // Cambiado de 'INTERVAL 1 YEAR' a 'INTERVAL 365 DAY'
    };

    const interval = periodMap[period];
    if (!interval) {
      throw new Error(`Invalid period: ${period}`);
    }

    const query = `
      SELECT timestamp, balance
      FROM \`${this.datasetId}.${this.tableId}\`
      WHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), ${interval})
      ORDER BY timestamp ASC
    `;

    try {
      const [rows] = await this.bigquery.query(query);
      return rows.map((row: any) => ({
        timestamp: row.timestamp instanceof Date ? row.timestamp : new Date(row.timestamp.value),
        balance: row.balance
      }));
    } catch (error: any) {
      console.error(`❌ Error fetching historical balance for ${period}:`, error);
      throw error;
    }
  }
}