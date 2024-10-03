// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import {FunctionsClient} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/FunctionsClient.sol";
import {FunctionsRequest} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/libraries/FunctionsRequest.sol";

// Main contract for ACLP that inherits from ERC20, Ownable, and FunctionsClient
contract ACLP is ERC20, Ownable, FunctionsClient {
    using FunctionsRequest for FunctionsRequest.Request;

    // Variables to store the last request ID and balance
    bytes32 public s_lastRequestId;
    bytes public s_lastResponse;
    bytes public s_lastError;
    uint256 public vaultBalance;
    uint64 public subscriptionId;

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
    
    // Router address
    address router = 0xf9B8fc078197181C841c296C876945aaa425B278;

    // JavaScript source code to make the request to the Vault API
    string source =
        "const apiResponse = await Functions.makeHttpRequest({"
        "url: 'https://development-vault-api-claucondor-61523929174.us-central1.run.app/vault/balance/storage',"
        "headers: { 'User-Agent': 'vault-oracle' }"
        "});"
        "if (apiResponse.error) { throw Error('Request failed'); }"
        "const { data } = apiResponse;"
        "const balance = parseInt(data.balance, 10);"
        "return Functions.encodeUint256(balance);";

    // Gas limit for the callback
    uint32 gasLimit = 300000;

    // donID
    bytes32 donID =
        0x66756e2d626173652d7365706f6c69612d310000000000000000000000000000;

    // Constructor to initialize the contract and define the receiver
    constructor(address _receiver) FunctionsClient(router) ERC20("ACLP", "ACLP") Ownable(msg.sender) {
        require(_receiver != address(0), "Receiver cannot be the zero address");
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

    // Función para que los agentes puedan mintear tokens
    function mint(address user, uint256 amount) external onlyAgent {
        pendingMintAmount = amount;  // Store the pending mint amount
        pendingUser = user;  // Store the pending user
        sendRequest(subscriptionId);  // Call the function to get the balance
    }

    // Función para mintear tokens en lote para múltiples usuarios
    function mintBatch(address[] calldata users, uint256[] calldata amounts) external onlyAgent {
        require(users.length == amounts.length, "Users and amounts length mismatch");
        pendingUsers = users;  // Store the pending users
        pendingAmounts = amounts;  // Store the pending amounts
        sendRequest(subscriptionId);  // Start the balance request
    }

    // Function to send a request to get the Vault balance
    function sendRequest(
        uint64 _subscriptionId
    ) public onlyAgent returns (bytes32 requestId) {
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

    // Function for forced transfers of tokens
    function forceTransfer(address from, address to, uint256 amount) external onlyAgent notFrozenOrBlacklisted(msg.sender, receiver) {
        require(balanceOf(from) >= amount, "Source address does not have enough tokens");
        _transfer(from, to, amount);
        emit ForceTransferExecuted(from, to, amount);
    }

    // Function to redeem tokens
    function redeem(uint256 amount) external notFrozenOrBlacklisted(msg.sender, receiver) {
        require(balanceOf(msg.sender) >= amount, "Not enough tokens to redeem");
        _transfer(msg.sender, receiver, amount);
        _burn(receiver, amount);
        emit TokensBurned(msg.sender, amount);
        emit RedeemExecuted(msg.sender, amount, receiver);
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
        return super.transfer(recipient, amount);
    }

    function transferFrom(address sender, address recipient, uint256 amount) public override notFrozenOrBlacklisted(sender, recipient) returns (bool) {
        return super.transferFrom(sender, recipient, amount);
    }

    // Function to change the receiver address
    function setReceiver(address _receiver) external onlyAgent {
        receiver = _receiver;
        emit SetReceiver();
    }
}