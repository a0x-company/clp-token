// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import {FunctionsClient} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/FunctionsClient.sol";
import {FunctionsRequest} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/libraries/FunctionsRequest.sol";

// Contrato principal de CLPCoin que hereda de ERC20, Ownable y ChainlinkClient
contract ACLP is ERC20, Ownable, FunctionsClient {
    using FunctionsRequest for FunctionsRequest.Request;

    // Variables para almacenar el último request ID y balance
    bytes32 public s_lastRequestId;
    bytes public s_lastResponse;
    bytes public s_lastError;
    uint256 public vaultBalance;
    uint64 public subscriptionId;

    // Error customizado
    error UnexpectedRequestID(bytes32 requestId);

    // Evento para registrar respuestas
    event Response(
        bytes32 indexed requestId,
        uint256 balance,
        bytes response,
        bytes err
    );

    // Variables para almacenar el mint pendiente
    uint256 private pendingMintAmount;
    address private pendingUser;

    // Variables para almacenar los usuarios y montos pendientes en el mintBatch
    address[] private pendingUsers;
    uint256[] private pendingAmounts;

    // Eventos
    event Requestbalance(bytes32 indexed requestId, uint256 balance);

    // Dirección que recibirá los tokens durante el retiro o la revocación
    address public receiver;

    // Mappings para agentes autorizados, cuentas congeladas, y cuentas en lista negra
    mapping(address => bool) public agents;
    mapping(address => bool) public frozenAccounts;
    mapping(address => bool) public blacklisted;

    // Variable para bloquear todas las transferencias
    bool public freezeAll;

    // Eventos adicionales para diferentes acciones
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
    
    // Dirección del router - Hardcoded para Sepolia (cambiar según la red)
    address router = 0xf9B8fc078197181C841c296C876945aaa425B278;

    // Código JavaScript fuente para hacer la solicitud a la API Vault
    string source =
        "const apiResponse = await Functions.makeHttpRequest({"
        "url: 'https://development-vault-api-claucondor-61523929174.us-central1.run.app/vault/balance/storage',"
        "headers: { 'User-Agent': 'vault-oracle' }"
        "});"
        "if (apiResponse.error) { throw Error('Request failed'); }"
        "const { data } = apiResponse;"
        "const balance = parseInt(data.balance, 10);"
        "return Functions.encodeUint256(balance);";

    // Límite de gas para el callback
    uint32 gasLimit = 300000;

    // donID - Hardcoded para Sepolia
    bytes32 donID =
        0x66756e2d626173652d7365706f6c69612d310000000000000000000000000000;

    // Constructor para inicializar el contrato y definir el receptor
    constructor(address _receiver) FunctionsClient(router) ERC20("ACLP", "ACLP") Ownable(msg.sender) {}

    // Modificador para restringir el acceso solo a agentes autorizados
    modifier onlyAgent() {
        require(agents[msg.sender], "Only agents can execute this function");
        _;
    }

    // Modificador para verificar si la cuenta está congelada o en lista negra
    modifier notFrozenOrBlacklisted(address _from, address _to) {
        require(!freezeAll, "All transfers are frozen");
        require(!frozenAccounts[_from], "Account is frozen");
        require(!blacklisted[_from], "Sender is blacklisted");
        require(!blacklisted[_to], "Recipient is blacklisted");
        _;
    }

    // Cambiar de valor a subscriptionId
    function setSubscriptionId(uint64 _subscriptionId) external onlyOwner{
        subscriptionId = _subscriptionId;
    }

    // Función para agregar agentes autorizados
    function addAgent(address agent) external onlyOwner {
        agents[agent] = true;
    }

    // Función para eliminar agentes autorizados
    function removeAgent(address agent) external onlyOwner {
        agents[agent] = false;
    }

    // Función para que los agentes puedan mintear tokens
    function mint(address user, uint256 amount) external onlyAgent {
        pendingMintAmount = amount;  // Almacenar la cantidad pendiente de mint
        pendingUser = user;  // Almacenar el usuario pendiente
        sendRequest(subscriptionId);  // Llamar a la función para obtener el balance
    }

    // Función para mintear tokens en lote para múltiples usuarios
    function mintBatch(address[] calldata users, uint256[] calldata amounts) external onlyAgent {
        require(users.length == amounts.length, "Users and amounts length mismatch");

        pendingUsers = users;  // Almacenar usuarios pendientes
        pendingAmounts = amounts;  // Almacenar cantidades pendientes
        sendRequest(subscriptionId);  // Iniciar la solicitud de balance
    }

    // Función para enviar una solicitud para obtener el balance del Vault
    function sendRequest(
        uint64 _subscriptionId
    ) public onlyOwner returns (bytes32 requestId) {
        FunctionsRequest.Request memory req;
        req.initializeRequestForInlineJavaScript(source);

        s_lastRequestId = _sendRequest(
            req.encodeCBOR(),
            _subscriptionId, // Usar la nueva variable
            gasLimit,
            donID
        );

        return s_lastRequestId;
    }


    // Función callback para manejar la respuesta
    function fulfillRequest(
        bytes32 requestId,
        bytes memory response,
        bytes memory err
    ) internal override {
        if (s_lastRequestId != requestId) {
            revert UnexpectedRequestID(requestId); // Verificar que los IDs coincidan
        }
        // Actualizar el balance recibido
        s_lastResponse = response;
        s_lastError = err;
        vaultBalance = abi.decode(response, (uint256));
        uint256 balance = vaultBalance * 10 **18;

        // Emitir un evento con la respuesta
        emit Response(requestId, vaultBalance, s_lastResponse, s_lastError);

        // Si se trata de un mintBatch
        if (pendingUsers.length > 0) {
            uint256 totalMintAmount = 0;
            for (uint256 i = 0; i < pendingAmounts.length; i++) {
                totalMintAmount += pendingAmounts[i];
            }

            // Verificar si el balance es igual a totalSupply() + totalMintAmount
            if (balance == (totalSupply() + totalMintAmount)) {
                for (uint256 i = 0; i < pendingUsers.length; i++) {
                    _mint(pendingUsers[i], pendingAmounts[i]);  // Realizar mint a cada usuario
                    emit TokensMinted(msg.sender, pendingUsers[i], pendingAmounts[i]);  // Emitir evento
                }
                emit BatchMintCompleted(pendingUsers, pendingAmounts, totalMintAmount);  // Evento de mint en lote
            } else {
                revert("Mint batch condition not met, balance mismatch");
            }

            // Reiniciar variables temporales
            delete pendingUsers;
            delete pendingAmounts;
        }
        // Si se trata de un mint simple
        else if (pendingMintAmount > 0) {
            if (balance == (totalSupply() + pendingMintAmount)) {
                _mint(pendingUser, pendingMintAmount);  // Realizar mint
                emit TokensMinted(msg.sender, pendingUser, pendingMintAmount);  // Emitir evento
            } else {
                revert("Mint condition not met, balance mismatch");
            }

            // Reiniciar variables
            pendingMintAmount = 0;
            pendingUser = address(0);
        }
    }

    // Función para transferencias forzadas de tokens
    function forceTransfer(address from, address to, uint256 amount) external onlyAgent {
        require(balanceOf(from) >= amount, "Source address does not have enough tokens");
        _transfer(from, to, amount);
        emit ForceTransferExecuted(from, to, amount);
    }

    // Función de redención de tokens
    function redeem(uint256 amount) external notFrozenOrBlacklisted(msg.sender, receiver) {
        require(balanceOf(msg.sender) >= amount, "Not enough tokens to redeem");
        _transfer(msg.sender, receiver, amount);
        _burn(receiver, amount);
        emit TokensBurned(msg.sender, amount);
        emit RedeemExecuted(msg.sender, amount, receiver);
    }

    // Funciones para congelar cuentas específicas y desbloquearlas
    function freezeAccount(address user) external onlyAgent {
        frozenAccounts[user] = true;
        emit AccountFrozen(user);
    }

    function unfreezeAccount(address user) external onlyAgent {
        frozenAccounts[user] = false;
        emit AccountUnfrozen(user);
    }

    // Funciones para congelar o desbloquear todas las cuentas
    function freezeAllTokens() external onlyAgent {
        freezeAll = true;
    }

    function unfreezeAllTokens() external onlyAgent {
        freezeAll = false;
    }

    // Funciones para añadir o quitar usuarios de la lista negra
    function blacklist(address user) external onlyAgent {
        blacklisted[user] = true;
        emit AccountBlacklisted(user);
    }

    function removeFromBlacklist(address user) external onlyAgent {
        blacklisted[user] = false;
        emit AccountRemovedFromBlacklist(user);
    }

    // Función para revocar tokens de cuentas congeladas
    function revoke(address user, uint256 amount) external onlyAgent {
        require(frozenAccounts[user], "Account is not frozen");
        _transfer(user, receiver, amount);
        emit TokensRevoked(user, amount, receiver);
    }

    // Sobrescribe las funciones de transferencia para aplicar restricciones
    function transfer(address recipient, uint256 amount) public override notFrozenOrBlacklisted(msg.sender, recipient) returns (bool) {
        return super.transfer(recipient, amount);
    }

    function transferFrom(address sender, address recipient, uint256 amount) public override notFrozenOrBlacklisted(sender, recipient) returns (bool) {
        return super.transferFrom(sender, recipient, amount);
    }

    // Función para cambiar la dirección del receptor
    function setReceiver(address _receiver) external onlyOwner {
        receiver = _receiver;
    }
}