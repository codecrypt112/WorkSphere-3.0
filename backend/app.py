from flask import Flask, request, jsonify
from pymongo import MongoClient
from web3 import Web3
import os
from flask_cors import CORS
from pymongo import MongoClient
from werkzeug.security import generate_password_hash, check_password_hash


app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:5173"}})


# MongoDB setup
MONGO_URI = "mongodb+srv://skpvikaash:vikash100@cluster0.k3mnor2.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"  # Replace with your MongoDB URI
client = MongoClient(MONGO_URI)
db = client["websphere3"]
job_collection = db["jobs"]

# Infura setup
INFURA_URL = "https://mainnet.infura.io/v3/f77611e3621f4e0591f0d90056fe598b"  # Replace with your Infura URL
web3 = Web3(Web3.HTTPProvider(INFURA_URL))

# Check connection to Infura
if not web3.is_connected():
    raise Exception("Unable to connect to Infura")

@app.route('/jobs', methods=['GET'])
def get_jobs():
    """Fetch all job postings."""
    jobs = list(job_collection.find({}, {"_id": 0}))  # Exclude MongoDB ObjectId from response
    return jsonify(jobs), 200

@app.route('/jobs', methods=['POST'])
def create_job():
    """
    Create a new job posting and store relevant blockchain data in MongoDB.
    Requires a signed MetaMask transaction for authentication.
    """
    data = request.json
    if not data:
        return jsonify({"error": "Invalid request data"}), 400

    title = data.get("title")
    budget = data.get("budget")
    description = data.get("description")
    wallet_address = data.get("walletAddress")
    signature = data.get("signature")

    if not title or not budget or not description or not wallet_address or not signature:
        return jsonify({"error": "Missing required fields"}), 400

    # Verify wallet address using signature
    message = f"Create job posting: {title}"
    try:
        message_hash = web3.keccak(text=message)
        recovered_address = web3.eth.account.recoverHash(message_hash, signature=signature)
        if recovered_address.lower() != wallet_address.lower():
            return jsonify({"error": "Invalid signature"}), 401
    except Exception as e:
        return jsonify({"error": f"Blockchain verification failed: {str(e)}"}), 500

    # Store job data in MongoDB
    job_data = {
        "title": title,
        "budget": budget,
        "description": description,
        "walletAddress": wallet_address,
        "blockchainData": {
            "messageHash": message_hash.hex(),
            "verifiedAddress": recovered_address,
        },
        "status": "Open",
    }

    job_collection.insert_one(job_data)
    return jsonify({"message": "Job created successfully", "job": job_data}), 201

@app.route('/jobs/<string:title>', methods=['DELETE'])
def delete_job(title):
    """Delete a job posting by title."""
    result = job_collection.delete_one({"title": title})
    if result.deleted_count == 0:
        return jsonify({"error": "Job not found"}), 404
    return jsonify({"message": "Job deleted successfully"}), 200

@app.route('/jobs/<string:title>', methods=['PUT'])
def update_job(title):
    """Update a job's details."""
    data = request.json
    if not data:
        return jsonify({"error": "Invalid request data"}), 400

    update_fields = {}
    if "budget" in data:
        update_fields["budget"] = data["budget"]
    if "description" in data:
        update_fields["description"] = data["description"]
    if "status" in data:
        update_fields["status"] = data["status"]

    result = job_collection.update_one({"title": title}, {"$set": update_fields})
    if result.matched_count == 0:
        return jsonify({"error": "Job not found"}), 404

    return jsonify({"message": "Job updated successfully"}), 200

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'message': 'Missing fields'}), 400

    user = users_collection.find_one({"email": email})
    if not user or not check_password_hash(user['password'], password):
        return jsonify({'message': 'Invalid credentials'}), 401

    return jsonify({'message': 'User registered successfully'}), 201

users_collection = db["users"]

@app.route('/register', methods=['POST'])
def register():
    data = request.json
    email = data.get('email')
    username = data.get('username')
    password = data.get('password')

    if not email or not username or not password:
        return jsonify({'message': 'Missing fields'}), 400

    if users_collection.find_one({"email": email}):
        return jsonify({'message': 'Email already registered'}), 400

    hashed_password = generate_password_hash(password)
    users_collection.insert_one({
        "email": email,
        "username": username,
        "password": hashed_password
    })

    return jsonify({'message': 'User registered successfully'}), 201


if __name__ == '__main__':
    app.run(debug=True)
