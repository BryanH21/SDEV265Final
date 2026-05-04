<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$conn = new mysqli(
    "localhost",
    "u807008053_sdevgrpproject",
    "SoftwareAnalysis2026!",
    "u807008053_sdevgroupprjct"
);

if ($conn->connect_error) {
    echo json_encode(["error" => "Connection failed: " . $conn->connect_error]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

// Get ID from URL if present: /api/clients.php/some-id
$id = null;
$path = isset($_SERVER['PATH_INFO']) ? $_SERVER['PATH_INFO'] : '';
if ($path && $path !== '/') {
    $id = trim($path, '/');
}

switch ($method) {

    // GET all clients or single client
    case 'GET':
        if ($id) {
            $stmt = $conn->prepare("SELECT * FROM clients WHERE id = ?");
            $stmt->bind_param("s", $id);
            $stmt->execute();
            $result = $stmt->get_result();
            $client = $result->fetch_assoc();
            if ($client) {
                echo json_encode($client);
            } else {
                http_response_code(404);
                echo json_encode(["error" => "Client not found."]);
            }
        } else {
            $result = $conn->query("SELECT * FROM clients ORDER BY created_at DESC");
            $clients = [];
            while ($row = $result->fetch_assoc()) {
                $clients[] = $row;
            }
            echo json_encode($clients);
        }
        break;

    // POST create client
    case 'POST':
        $data = json_decode(file_get_contents("php://input"), true);
        if (empty($data['first_name']) || empty($data['last_name']) || empty($data['email'])) {
            http_response_code(400);
            echo json_encode(["error" => "first_name, last_name, and email are required."]);
            exit;
        }
        $newId = bin2hex(random_bytes(16));
        $stmt = $conn->prepare("INSERT INTO clients (id, first_name, last_name, company, email, phone, renewal_date, contract_details, notes, additional_data) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->bind_param(
            "ssssssssss",
            $newId,
            $data['first_name'],
            $data['last_name'],
            $data['company'],
            $data['email'],
            $data['phone'],
            $data['renewal_date'],
            $data['contract_details'],
            $data['notes'],
            $data['additional_data']
        );
        if ($stmt->execute()) {
            $result = $conn->query("SELECT * FROM clients WHERE id = '$newId'");
            echo json_encode($result->fetch_assoc());
        } else {
            http_response_code(500);
            echo json_encode(["error" => "Failed to create client."]);
        }
        break;

    // PUT update client
    case 'PUT':
        if (!$id) {
            http_response_code(400);
            echo json_encode(["error" => "Client ID required."]);
            exit;
        }
        $data = json_decode(file_get_contents("php://input"), true);
        if (empty($data['first_name']) || empty($data['last_name']) || empty($data['email'])) {
            http_response_code(400);
            echo json_encode(["error" => "first_name, last_name, and email are required."]);
            exit;
        }
        $stmt = $conn->prepare("UPDATE clients SET first_name=?, last_name=?, company=?, email=?, phone=?, renewal_date=?, contract_details=?, notes=?, additional_data=? WHERE id=?");
        $stmt->bind_param(
            "ssssssssss",
            $data['first_name'],
            $data['last_name'],
            $data['company'],
            $data['email'],
            $data['phone'],
            $data['renewal_date'],
            $data['contract_details'],
            $data['notes'],
            $data['additional_data'],
            $id
        );
        if ($stmt->execute()) {
            $result = $conn->query("SELECT * FROM clients WHERE id = '$id'");
            echo json_encode($result->fetch_assoc());
        } else {
            http_response_code(500);
            echo json_encode(["error" => "Failed to update client."]);
        }
        break;

    // DELETE client
    case 'DELETE':
        if (!$id) {
            http_response_code(400);
            echo json_encode(["error" => "Client ID required."]);
            exit;
        }
        $stmt = $conn->prepare("DELETE FROM clients WHERE id = ?");
        $stmt->bind_param("s", $id);
        if ($stmt->execute()) {
            echo json_encode(["message" => "Client deleted."]);
        } else {
            http_response_code(500);
            echo json_encode(["error" => "Failed to delete client."]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(["error" => "Method not allowed."]);
        break;
}

$conn->close();
?>