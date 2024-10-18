# CLPD Smart Contracts

## Smart Contracts in the `src` Folder

This section describes the main smart contracts located in the project's `src` folder. It contains four main smart contracts:

### 1. CLPD_BaseMainnet.sol
This smart contract is designed for deployment on the Base mainnet. It implements CLPD's core functionality, including:
- ERC20 token management with custom mint and burn functions.
- Integration with Chainlink Functions to obtain external data.
- Role system with owner and authorized agents.
- Security mechanisms such as account freezing and blacklisting.
- Custom events for tracking transactions and state changes.

### 2. CLPD_BaseSepolia.sol
A variant of the previous contract optimized for the Base Sepolia testnet. Additional features include:
- Specific configurations for the test environment.
- Enhanced debugging and logging functions.
- Adjustable parameters to simulate different market scenarios.
- Compatibility with automated testing tools.

### 3. oracleTokenPriceCLPD.sol
Specialized oracle contract for providing CLPD price data:
- Interface with Uniswap V3 to obtain real-time liquidity and price data.
- Implementation of advanced mathematical logic for precise price calculations.
- Efficient update mechanisms and storage of historical data.
- Security functions to prevent price manipulations.

### 4. swap_InvestLiquidity_CLPD.sol
Advanced contract for CLPD-related DeFi operations:
- Full integration with the Uniswap V3 protocol for swaps and liquidity management.
- Functions to add, remove, and increase liquidity positions.
- Implementation of automated investment strategies.
- Slippage management and protection against impermanent losses.
- Fee collection and distribution mechanisms.

### Technologies Used
- Solidity: Programming language for smart contracts.
- Foundry: Development and testing toolkit.
- Uniswap: Protocol used in swap_InvestLiquidity_CLPD.sol for exchange and liquidity operations.
- Chainlink functions: Used for CLPD_BaseMainnet.sol and CLPD_BaseSepolia.sol
- OpenZeppelin: Used for CLPD_BaseMainnet.sol and CLPD_BaseSepolia.sol
- UniswapV3MathLib: Used in swap_InvestLiquidity_CLPD.sol for mathematical calculations in exchange operations.
- Base: Ethereum layer 2 network where contracts are deployed.
- ERC20: Token standard used to implement CLPD.
- Uniswap V3 Pool: Used in oracleTokenPriceCLPD.sol to obtain price data.
- ISwapRouter02: Uniswap V3 interface used in swap_InvestLiquidity_CLPD.sol for exchange operations.
- INonfungiblePositionManager: Uniswap V3 interface used in swap_InvestLiquidity_CLPD.sol to manage liquidity positions.

### Contract Compilation

To compile the contracts, follow these steps:

1. Make sure you have Foundry installed on your system.
2. Open a terminal and navigate to the project directory.
3. Enter the contracts directory:

   ```
   cd contracts
   ```

4. Run the Forge compilation command:

   ```
   forge build
   ```

   This command compiles all the smart contracts in the project using Forge, a Foundry tool. When executed, Forge will analyze and compile all Solidity files (.sol) in the project directory and its subdirectories, generating the necessary compilation artifacts for deployment and testing.

## Tests

The `test` folder contains test files for the contracts. These tests are designed to verify the correct functioning of the contracts and their functions.

### Main Test Files:

1. `CLPD_BaseMainnet.t.sol`: Tests for the CLPD contract on Base mainnet.
2. `CLPD_BaseSepolia.t.sol`: Tests for the CLPD contract on Base Sepolia testnet.
3. `oracleTokenPriceCLPD.t.sol`: Tests for the price oracle contract.
4. `swap_InvestLiquidity_CLPD.t.sol`: Tests for the swap and liquidity investment contract.

### Running Tests:

To run these tests, use the following commands in the terminal:

1. To run CLPD tests on Base mainnet:
   ```
   forge test -vvvv --match-path test/CLPD_BaseMainnet.t.sol --fork-url https://mainnet.base.org/
   ```

2. To run CLPD tests on Base Sepolia testnet:
   ```
   forge test -vvvv --match-path test/CLPD_BaseSepolia.t.sol --fork-url https://sepolia.base.org/
   ```

3. To run price oracle tests:
   ```
   forge test -vvvv --match-path test/oracleTokenPriceCLPD.t.sol --fork-url https://mainnet.base.org/
   ```

4. To run swap and liquidity investment tests:
   ```
   forge test -vvvv --match-path test/swap_InvestLiquidity_CLPD.t.sol --fork-url https://mainnet.base.org/
   ```

These commands will run the specific tests for each contract, using Forge to simulate the corresponding network conditions. The `-vvvv` option provides a detailed output level to assist in debugging if necessary.

## Deployment and Interaction Scripts

The `script` folder contains various script files that facilitate the deployment and interaction with the contracts. These scripts are designed to be used with Forge, Foundry's command-line tool.

### Main Script Files:

1. `DeployCLPD.s.sol`: Script to deploy the CLPD contract.
2. `DeployOracleTokenPriceCLPD.s.sol`: Script to deploy the price oracle contract.
3. `DeploySwapInvestLiquidity.s.sol`: Script to deploy the swap and liquidity investment contract.
4. `InteractWithCLPD.s.sol`: Script to interact with specific functions of the CLPD contract.

### Running Scripts:

To run these scripts, use the following commands in the terminal:

To run the deployment scripts, use the following commands:

1. CLPD on Base Mainnet:
   ```
   forge script scripts/CLPD_BaseMainnet.s.sol --rpc-url https://mainnet.base.org/ --broadcast
   ```

2. CLPD on Base Sepolia:
   ```
   forge script scripts/CLPD_BaseSepolia.s.sol --rpc-url https://sepolia.base.org/ --broadcast
   ```

3. CLPD price oracle:
   ```
   forge script scripts/oracleTokenPriceCLPD.s.sol --rpc-url https://mainnet.base.org/ --broadcast
   ```

4. CLPD swap and liquidity investment:
   ```
   forge script scripts/swap_InvestLiquidity_CLPD.s.sol --rpc-url https://mainnet.base.org/ --broadcast
   ```

These commands will run the corresponding scripts on the specified networks and broadcast the transactions.