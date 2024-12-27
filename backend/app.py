from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from bson import ObjectId
import json
from datetime import datetime
import traceback
import os
from dotenv import load_dotenv
import re  # Add regex for wallet address validation

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# MongoDB Connection
MONGO_URI = "mongodb+srv://skpvikaash:vikash100@cluster0.k3mnor2.mongodb.net/?retryWrites=true&w=majority"
try:
    client = MongoClient(MONGO_URI)
    db = client.freelance_platform
    jobs_collection = db.jobs
    applications_collection = db.job_applications
    
    # Test connection
    client.admin.command('ismaster')
    print("MongoDB connection successful!")
except Exception as e:
    print(f"MongoDB connection error: {e}")
    raise

# Custom JSON Encoder
class CustomJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, ObjectId):
            return str(obj)
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)

app.json_encoder = CustomJSONEncoder

@app.route('/api/jobs', methods=['GET'])
def get_jobs():
    try:
        # Get query parameters
        category = request.args.get('filter')

        # Fetch jobs from MongoDB
        query = {}
        if category and category != 'all':
            query['category'] = category

        # Convert cursor to list and handle ObjectId serialization
        jobs = []
        for job in jobs_collection.find(query):
            # Ensure all ObjectId are converted to strings
            job['_id'] = str(job['_id'])
            jobs.append(job)

        return jsonify(jobs), 200

    except Exception as e:
        print("Error fetching jobs:")
        traceback.print_exc()
        return jsonify({
            "error": "Internal server error",
            "details": str(e),
            "traceback": traceback.format_exc()
        }), 500

def is_valid_ethereum_address(address):
    """
    Validate Ethereum wallet address
    - Starts with 0x
    - Followed by 40 hexadecimal characters
    """
    if not address:
        return False
    
    # Regex pattern for Ethereum address
    pattern = r'^0x[a-fA-F0-9]{40}$'
    return re.match(pattern, address) is not None

@app.route('/api/jobs/create', methods=['POST'])
def create_job():
    try:
        # Get JSON data from request
        job_data = request.get_json()
        
        # Comprehensive validation
        validation_errors = []
        
        # Check required fields
        required_fields = [
            ('title', str, 'Job title must be a non-empty string'),
            ('description', str, 'Job description must be a non-empty string'),
            ('category', str, 'Category must be a non-empty string'),
            ('creatorWallet', str, 'Creator wallet address is required')
        ]
        
        for field, field_type, error_message in required_fields:
            if not job_data.get(field) or not isinstance(job_data.get(field), field_type):
                validation_errors.append(error_message)
        
        # Validate wallet address
        creator_wallet = job_data.get('creatorWallet', '')
        if not is_valid_ethereum_address(creator_wallet):
            validation_errors.append('Invalid Ethereum wallet address')
        
        # Optional field validations
        if job_data.get('budget'):
            try:
                float(job_data['budget'])
            except ValueError:
                validation_errors.append('Budget must be a valid number')
        
        # If there are validation errors, return them
        if validation_errors:
            return jsonify({
                "error": "Validation Failed",
                "details": validation_errors
            }), 400
        
        # Sanitize and prepare job data
        sanitized_job_data = {
            'title': job_data['title'].strip(),
            'description': job_data['description'].strip(),
            'category': job_data['category'],
            'creatorWallet': creator_wallet.lower(),  # Normalize wallet address
            'skills': job_data.get('skills', []),
            'budget': job_data.get('budget'),
            'deadline': job_data.get('deadline'),
            'created_at': datetime.utcnow(),
            'status': 'active'
        }
        
        # Insert job into MongoDB
        result = jobs_collection.insert_one(sanitized_job_data)
        
        return jsonify({
            "message": "Job created successfully",
            "job_id": str(result.inserted_id)
        }), 201
    
    except Exception as e:
        print("Error creating job:")
        traceback.print_exc()
        return jsonify({
            "error": "Internal server error",
            "details": str(e)
        }), 500

# Debugging route to check database connection
@app.route('/api/debug/db', methods=['GET'])
def debug_db():
    try:
        # Try to get database info
        database_info = client.list_database_names()
        return jsonify({
            "status": "success",
            "databases": database_info
        }), 200
    except Exception as e:
        return jsonify({
            "status": "error",
            "details": str(e)
        }), 500

@app.route('/api/jobs/apply', methods=['POST'])
def submit_job_application():
    try:
        # Get application data from request
        application_data = request.get_json()
        
        # Validate required fields
        required_fields = ['jobId', 'coverLetter', 'applicantWallet']
        for field in required_fields:
            if not application_data.get(field):
                return jsonify({
                    "error": f"Missing required field: {field}"
                }), 400
        
        # Check if job exists
        job = jobs_collection.find_one({'_id': ObjectId(application_data['jobId'])})
        if not job:
            return jsonify({"error": "Job not found"}), 404
        
        # Ensure applications collection is defined
        applications_collection = db.job_applications
        
        # Check for duplicate applications
        existing_application = applications_collection.find_one({
            'jobId': ObjectId(application_data['jobId']),
            'applicantWallet': application_data['applicantWallet']
        })
        
        if existing_application:
            return jsonify({
                "error": "You have already applied to this job",
                "applicationId": str(existing_application['_id'])
            }), 400
        
        # Prepare application document
        application = {
            'jobId': ObjectId(application_data['jobId']),
            'applicantWallet': application_data['applicantWallet'],
            'coverLetter': application_data['coverLetter'],
            'expectedBudget': application_data.get('expectedBudget'),
            'estimatedTime': application_data.get('estimatedTime'),
            'status': 'pending',
            'appliedAt': datetime.utcnow()
        }
        
        # Insert application
        result = applications_collection.insert_one(application)
        
        # Update job to track applications
        jobs_collection.update_one(
            {'_id': ObjectId(application_data['jobId'])},
            {'$push': {'applications': str(result.inserted_id)}}
        )
        
        return jsonify({
            "message": "Application submitted successfully",
            "applicationId": str(result.inserted_id)
        }), 201
    
    except Exception as e:
        print("Error submitting job application:")
        traceback.print_exc()
        return jsonify({
            "error": "Internal server error",
            "details": str(e)
        }), 500

@app.route('/api/jobs/applications/<application_id>/<action>', methods=['POST'])
def handle_application_action(application_id, action):
    try:
        # Validate action
        if action not in ['approve', 'reject']:
            return jsonify({"error": "Invalid action"}), 400
        
        # Update application status
        result = applications_collection.update_one(
            {'_id': ObjectId(application_id)},
            {'$set': {'status': action}}
        )
        
        if result.modified_count == 0:
            return jsonify({"error": "Application not found"}), 404
        
        # If approved, you might want to add additional logic here
        # For example, updating job status or creating a contract
        
        return jsonify({
            "message": f"Application {action}d successfully",
            "status": action
        }), 200

    except Exception as e:
        print(f"Error {action}ing application:")
        traceback.print_exc()
        return jsonify({
            "error": "Internal server error",
            "details": str(e)
        }), 500

@app.route('/api/jobs/applied/<wallet_address>', methods=['GET'])
def get_applied_jobs(wallet_address):
    try:
        # Find application IDs for the user
        user_applications = list(applications_collection.find({
            'applicantWallet': wallet_address
        }))
        
        # Fetch corresponding jobs
        applied_jobs = []
        for application in user_applications:
            job = jobs_collection.find_one({
                '_id': application['jobId']
            })
            
            if job:
                job['_id'] = str(job['_id'])
                # Add application status to the job
                job['applicationStatus'] = application.get('status', 'pending')
                applied_jobs.append(job)
        
        return jsonify(applied_jobs), 200

    except Exception as e:
        print("Error fetching applied jobs:")
        traceback.print_exc()
        return jsonify({
            "error": "Internal server error",
            "details": str(e)
        }), 500


@app.route('/api/jobs/created/<wallet_address>', methods=['GET'])
def get_created_jobs(wallet_address):
    try:
        # Find jobs created by the wallet address
        jobs = list(jobs_collection.find({
            'creatorWallet': wallet_address
        }))
        
        # Convert ObjectId to string
        for job in jobs:
            job['_id'] = str(job['_id'])
        
        return jsonify(jobs), 200

    except Exception as e:
        print("Error fetching created jobs:")
        traceback.print_exc()
        return jsonify({
            "error": "Internal server error",
            "details": str(e)
        }), 500

@app.route('/api/projects/ongoing/<wallet_address>', methods=['GET'])
def get_ongoing_projects(wallet_address):
    try:
        # Find applications that were approved for this wallet
        ongoing_projects = list(applications_collection.find({
            'applicantWallet': wallet_address,
            'status': 'approved'
        }))
        
        # Fetch corresponding jobs
        projects = []
        for project in ongoing_projects:
            job = jobs_collection.find_one({'_id': project['jobId']})
            if job:
                job['_id'] = str(job['_id'])
                job['applicationDetails'] = {
                    'status': project['status'],
                    'appliedAt': project['appliedAt']
                }
                projects.append(job)
        
        return jsonify(projects), 200

    except Exception as e:
        print("Error fetching ongoing projects:")
        traceback.print_exc()
        return jsonify({
            "error": "Internal server error",
            "details": str(e)
        }), 500

@app.route('/api/jobs/<job_id>/applications', methods=['GET'])
def get_job_applications(job_id):
    try:
        # Find all applications for the given job
        applications = list(applications_collection.find({
            'jobId': ObjectId(job_id)
        }))
        
        # Convert ObjectIds to strings
        for application in applications:
            application['_id'] = str(application['_id'])
            application['jobId'] = str(application['jobId'])
        
        return jsonify(applications), 200

    except Exception as e:
        print("Error fetching job applications:")
        traceback.print_exc()
        return jsonify({
            "error": "Internal server error",
            "details": str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)