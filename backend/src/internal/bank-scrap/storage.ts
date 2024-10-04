import { BigQuery } from '@google-cloud/bigquery';
import { config } from '@internal';

interface VaultBalanceData {
  timestamp: Date;
  balance: number;
}

export class VaultBalanceStorage {
  private bigquery: BigQuery;
  private datasetId: string = 'vault_data';
  private tableId: string = 'balance_history';

  constructor() {
    this.bigquery = new BigQuery({
      projectId: config.PROJECT_ID,
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
    } catch (error) {
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
      await this.bigquery
        .dataset(this.datasetId)
        .createTable(this.tableId, { schema });
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
    } catch (error) {
      console.error('❌ Error fetching current balance:', error);
      throw error;
    }
  }

  public async getHistoricalBalance(period: 'day' | 'week' | 'month' | 'year' = 'year'): Promise<VaultBalanceData[]> {
    const periodMap = {
      day: 'INTERVAL 1 DAY',
      week: 'INTERVAL 7 DAY',
      month: 'INTERVAL 1 MONTH',
      year: 'INTERVAL 1 YEAR'
    };

    const query = `
      SELECT timestamp, balance
      FROM \`${this.datasetId}.${this.tableId}\`
      WHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), ${periodMap[period]})
      ORDER BY timestamp ASC
    `;

    try {
      const [rows] = await this.bigquery.query(query);
      return rows.map((row: any) => ({
        timestamp: new Date(row.timestamp.value),
        balance: row.balance
      }));
    } catch (error) {
      console.error(`❌ Error fetching historical balance for ${period}:`, error);
      throw error;
    }
  }
}