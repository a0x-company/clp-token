// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import {FunctionsClient} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/FunctionsClient.sol";
import {FunctionsRequest} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/libraries/FunctionsRequest.sol";

/**
 * @dev Contract deployed on Base Mainnet
 * @notice You can view the deployed contract at:
 * https://basescan.org/token/0x24460D2b3d96ee5Ce87EE401b1cf2FD01545d9b1
*/

// Main contract for CLPD that inherits from ERC20, Ownable, and FunctionsClient
contract CLPD is ERC20, Ownable, FunctionsClient {
    using FunctionsRequest for FunctionsRequest.Request;

    // Variables to store the last request ID and balance
    bytes32 private s_lastRequestId;
    bytes private s_lastResponse;
    bytes private s_lastError;
    uint256 private vaultBalance;
    uint64 private subscriptionId;
    string private _tokenName;
    string private _tokenSymbol;

    // Custom error
    error UnexpectedRequestID(bytes32 requestId);
    error MintConditionNotMet(uint256 balance, uint256 totalSupply, uint256 mintAmount);

    // Event to log responses
    event Response(
        bytes32 indexed requestId,
        uint256 balance,
        bytes response,
        bytes err
    );

    // Variables to store pending mint amounts and users
    uint256 private pendingMintAmount;
    address private pendingUser;

    // Variables to store pending users and amounts in mintBatch
    address[] private pendingUsers;
    uint256[] private pendingAmounts;

    // Events
    event Requestbalance(bytes32 indexed requestId, uint256 balance);

    // Address that will receive tokens
    address public receiver;

    // Mappings for authorized agents, frozen accounts, and blacklisted accounts
    mapping(address => bool) public agents;
    mapping(address => bool) public frozenAccounts;
    mapping(address => bool) public blacklisted;

    // Variable to block all transfers
    bool public freezeAll;

    // Additional events for different actions
    event TokensMinted(address indexed agent, address indexed user, uint256 amount);
    event BatchMintCompleted(address[] users, uint256[] amounts, uint256 totalAmount);
    event RedeemExecuted(address indexed user, uint256 amount, address receiver);
    event TokensBurned(address indexed user, uint256 amount);
    event AccountFrozen(address indexed user);
    event AccountUnfrozen(address indexed user);
    event AccountBlacklisted(address indexed user);
    event AccountRemovedFromBlacklist(address indexed user);
    event TokensRevoked(address indexed user, uint256 amount, address receiver);
    event ForceTransferExecuted(address indexed from, address indexed to, uint256 amount);
    event AllTokensFrozen();
    event AllTokensUnfrozen();
    event AddAgent();
    event RemoveAgent();
    event SetsubscriptionID();
    event SetReceiver();
    event TokenDetailsUpdated(string newName, string newSymbol);
    
    // Router address
    address router = 0xf9B8fc078197181C841c296C876945aaa425B278; //Base Mainnet

    // JavaScript source code to make the request to the Vault API
    string source =
        "const apiResponse = await Functions.makeHttpRequest({"
        "url: 'https://development-clpd-vault-api-claucondor-61523929174.us-central1.run.app/vault/balance/storage',"
        "headers: { 'User-Agent': 'vault-oracle' }"
        "});"
        "if (apiResponse.error) { throw Error('Request failed'); }"
        "const { data } = apiResponse;"
        "const balance = parseInt(data.balance, 10);"
        "return Functions.encodeUint256(balance);";

    // Gas limit for the callback
    uint32 gasLimit = 300000;

    // donID
    bytes32 donID = 0x66756e2d626173652d6d61696e6e65742d310000000000000000000000000000; // Base Mainnet

    // Constructor to initialize the contract and define the receiver
    constructor(address _receiver) FunctionsClient(router) ERC20(_tokenName, _tokenSymbol) Ownable(msg.sender) {
        require(_receiver != address(0), "Receiver cannot be the zero address");
        _tokenName = "CLPD";
        _tokenSymbol = "CLPD";
        receiver = _receiver;
    }

    // Modifier to restrict access to authorized agents
    modifier onlyAgent() {
        require(agents[msg.sender], "Only agents can execute this function");
        _;
    }

    // Modifier to check if the account is frozen or blacklisted
    modifier notFrozenOrBlacklisted(address _from, address _to) {
        require(!freezeAll, "All transfers are frozen");
        require(!frozenAccounts[_from], "Sender is frozen");
        require(!frozenAccounts[_to], "Recipient is frozen");
        require(!blacklisted[_from], "Sender is blacklisted");
        require(!blacklisted[_to], "Recipient is blacklisted");
        _;
    }

    // Change the value of subscriptionId
    function setSubscriptionId(uint64 _subscriptionId) external onlyAgent {
        subscriptionId = _subscriptionId;
        emit SetsubscriptionID();
    }

    // Function to add authorized agents
    function addAgent(address agent) external onlyOwner {
        agents[agent] = true;
        emit AddAgent();
    }

    // Function to remove authorized agents
    function removeAgent(address agent) external onlyOwner {
        agents[agent] = false;
        emit RemoveAgent();
    }

    // Function for agents to mint tokens
    function mint(address user, uint256 amount) external onlyAgent {
        require(!frozenAccounts[user] && !blacklisted[user], "User is frozen or blacklisted");
        require(!freezeAll, "Token minting is frozen");
        pendingMintAmount = amount;  // Store the pending mint amount
        pendingUser = user;  // Store the pending user
        sendRequest(subscriptionId);  // Call the function to get the balance
    }

    // Function to mint tokens in batch for multiple users
    function mintBatch(address[] calldata users, uint256[] calldata amounts) external onlyAgent {
        require(users.length == amounts.length, "Users and amounts length mismatch");
        require(!freezeAll, "Token minting is frozen");
        for (uint256 i = 0; i < users.length; i++) {
            require(!frozenAccounts[users[i]] && !blacklisted[users[i]], "User is frozen or blacklisted");
        }
        pendingUsers = users;  // Store the pending users
        pendingAmounts = amounts;  // Store the pending amounts
        sendRequest(subscriptionId);  // Start the balance request
    }

    // Function to send a request to get the Vault balance
    function sendRequest(
        uint64 _subscriptionId
    ) internal onlyAgent returns (bytes32 requestId) {
        FunctionsRequest.Request memory req;
        req.initializeRequestForInlineJavaScript(source);

        s_lastRequestId = _sendRequest(
            req.encodeCBOR(),
            _subscriptionId,
            gasLimit,
            donID
        );

        return s_lastRequestId;
    }

    // Function callback to handle the response
    function fulfillRequest(
        bytes32 requestId,
        bytes memory response,
        bytes memory err
    ) internal override {
        if (s_lastRequestId != requestId) {
            revert UnexpectedRequestID(requestId); // Check that the IDs match
        }
        // Update the received balance
        s_lastResponse = response;
        s_lastError = err;
        vaultBalance = abi.decode(response, (uint256));
        uint256 balance = vaultBalance * 10 **18;

        // Emit an event with the response
        emit Response(requestId, vaultBalance, s_lastResponse, s_lastError);

        // If it's a mintBatch
        if (pendingUsers.length > 0) {
            uint256 totalMintAmount = 0;
            for (uint256 i = 0; i < pendingAmounts.length; i++) {
                totalMintAmount += pendingAmounts[i];
            }

            // Check if the balance is equal to totalSupply() + totalMintAmount
            if (balance == (totalSupply() + totalMintAmount)) {
                for (uint256 i = 0; i < pendingUsers.length; i++) {
                    _mint(pendingUsers[i], pendingAmounts[i]);  // Mint to each user
                    emit TokensMinted(msg.sender, pendingUsers[i], pendingAmounts[i]);  // Emit event
                }
                emit BatchMintCompleted(pendingUsers, pendingAmounts, totalMintAmount);  // Event of batch mint
            } else {
                revert MintConditionNotMet(balance, totalSupply(), pendingMintAmount);
            }

            // Reset temporary variables
            delete pendingUsers;
            delete pendingAmounts;
        }
        // If it's a simple mint
        else if (pendingMintAmount > 0) {
            if (balance == (totalSupply() + pendingMintAmount)) {
                _mint(pendingUser, pendingMintAmount);  // Mint
                emit TokensMinted(msg.sender, pendingUser, pendingMintAmount);  // Emit event
            } else {
                revert MintConditionNotMet(balance, totalSupply(), pendingMintAmount);
            }

            // Reset variables
            pendingMintAmount = 0;
            pendingUser = address(0);
        }
    }

    // Function to return the value of vaultBalance
    function getVaultBalance() external view returns (uint256) {
        return vaultBalance;
    }

    // Function for forced transfers of tokens
    function forceTransfer(address from, address to, uint256 amount) external onlyAgent notFrozenOrBlacklisted(msg.sender, receiver) {
        require(to != address(0), "Recipient cannot be the zero address");
        require(balanceOf(from) >= amount, "Source address does not have enough tokens");
        _transfer(from, to, amount);
        emit ForceTransferExecuted(from, to, amount);
    }

    // Function to redeem tokens
    function redeem(uint256 amount, address recipient) external notFrozenOrBlacklisted(msg.sender, recipient) onlyAgent {
        require(balanceOf(recipient) >= amount, "Not enough tokens to redeem");
        burnFrom(recipient, amount);
        emit RedeemExecuted(recipient, amount, receiver);
    }

    // Functions to freeze specific accounts and unfreeze them
    function freezeAccount(address user) external onlyAgent {
        frozenAccounts[user] = true;
        emit AccountFrozen(user);
    }

    function unfreezeAccount(address user) external onlyAgent {
        frozenAccounts[user] = false;
        emit AccountUnfrozen(user);
    }

    // Functions to freeze or unfreeze all accounts
    function freezeAllTokens() external onlyAgent {
        freezeAll = true;
        emit AllTokensFrozen();
    }

    function unfreezeAllTokens() external onlyAgent {
        freezeAll = false;
        emit AllTokensUnfrozen();
    }

    // Functions to add or remove users from the blacklist
    function blacklist(address user) external onlyAgent {
        blacklisted[user] = true;
        emit AccountBlacklisted(user);
    }

    function removeFromBlacklist(address user) external onlyAgent {
        blacklisted[user] = false;
        emit AccountRemovedFromBlacklist(user);
    }

    // Function to revoke tokens from frozen accounts
    function revoke(address user, uint256 amount) external onlyAgent {
        require(frozenAccounts[user], "Account is not frozen");
        _transfer(user, receiver, amount);
        emit TokensRevoked(user, amount, receiver);
    }

    // Overrides the transfer functions to apply restrictions
    function transfer(address recipient, uint256 amount) public override notFrozenOrBlacklisted(msg.sender, recipient) returns (bool) {
        require(recipient != address(0), "Recipient cannot be the zero address");
        return super.transfer(recipient, amount);
    }

    function transferFrom(address sender, address recipient, uint256 amount) public override notFrozenOrBlacklisted(sender, recipient) returns (bool) {
        require(recipient != address(0), "Recipient cannot be the zero address");
        return super.transferFrom(sender, recipient, amount);
    }

    // Function to change the receiver address
    function setReceiver(address _receiver) external onlyAgent {
        receiver = _receiver;
        emit SetReceiver();
    }

    // Override the name and symbol functions
    function name() public view override returns (string memory) {
        return _tokenName;
    }

    function symbol() public view override returns (string memory) {
        return _tokenSymbol;
    }

    function burn(uint256 amount) external onlyAgent {
        _burn(msg.sender, amount);
        emit TokensBurned(msg.sender, amount);
    }

    function burnFrom(address user, uint256 amount) internal onlyAgent {
        _burn(user, amount);
        emit TokensBurned(user, amount);
    }

}