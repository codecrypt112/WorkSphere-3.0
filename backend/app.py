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
#CORS(app, resources={r"/api/*": {"origins": "*"}})
CORS(app)
# MongoDB Connection
MONGO_URI = "mongodb+srv://skpvikaash:vikash100@cluster0.k3mnor2.mongodb.net/?retryWrites=true&w=majority"
try:
    client = MongoClient(MONGO_URI)
    db = client.freelance_platform
    jobs_collection = db.jobs
    applications_collection = db.job_applications
    ongoing_projects_collection = db.ongoing_projects 
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
                applied_job = {
                    '_id': str(job['_id']),
                    'title': job.get('title', ''),
                    'description': job.get('description', ''),
                    'category': job.get('category', ''),
                    'applicationStatus': application.get('status', 'pending'),
                    'applicationDetails': {
                        'coverLetter': application.get('coverLetter', ''),
                        'expectedBudget': application.get('expectedBudget', ''),
                        'estimatedTime': application.get('estimatedTime', ''),
                        'appliedAt': application.get('appliedAt')
                    }
                }
                applied_jobs.append(applied_job)
        
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
        
        # Enrich jobs with application information
        enriched_jobs = []
        for job in jobs:
            job_details = {
                '_id': str(job['_id']),
                'title': job.get('title', ''),
                'description': job.get('description', ''),
                'category': job.get('category', ''),
                'budget': job.get('budget', ''),
                'deadline': job.get('deadline', ''),
                'skills': job.get('skills', []),
                'status': job.get('status', 'active')
            }

            # Fetch applications for this job
            job_applications = list(applications_collection.find({
                'jobId': job['_id']
            }))

            # Summarize applications
            job_details['applicationSummary'] = {
                'total': len(job_applications),
                'pending': len([a for a in job_applications if a.get('status') == 'pending']),
                'approved': len([a for a in job_applications if a.get('status') == 'approved']),
                'rejected': len([a for a in job_applications if a.get('status') == 'rejected'])
            }

            enriched_jobs.append(job_details)
        
        return jsonify(enriched_jobs), 200

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
        # Find ongoing projects for the user
        ongoing_projects = list(ongoing_projects_collection.find({
            'applicantWallet': wallet_address,
            'status': 'ongoing'
        }))
        
        # Fetch corresponding jobs with additional details
        projects = []
        for project in ongoing_projects:
            job = jobs_collection.find_one({'_id': project['jobId']})
            if job:
                project_details = {
                    '_id': str(job['_id']),
                    'title': job.get('title', ''),
                    'description': job.get('description', ''),
                    'creatorWallet': job.get('creatorWallet', ''),
                    'milestones': project.get('milestones', []),
                    'applicationDetails': {
                        'status': project['status'],
                        'startedAt': project['startedAt'],
                        'expectedBudget': project.get('expectedBudget', ''),
                        'estimatedTime': project.get('estimatedTime', '')
                    }
                }
                projects.append(project_details)
        
        return jsonify(projects), 200

    except Exception as e:
        print("Error fetching ongoing projects:")
        traceback.print_exc()
        return jsonify({
            "error": "Internal server error",
            "details": str(e)
        }), 500

@app.route('/api/jobs/applications/<application_id>/confirm', methods=['POST'])
def confirm_application(application_id):
    try:
        # Get the milestones from the request
        milestones = request.json.get('milestones', [])
        if not milestones:
            return jsonify({"error": "Milestones are required"}), 400
        
        # Validate application exists
        application = applications_collection.find_one({'_id': ObjectId(application_id)})
        if not application:
            return jsonify({"error": "Application not found"}), 404
        
        # Update the application status
        result = applications_collection.update_one(
            {'_id': ObjectId(application_id)},
            {'$set': {
                'status': 'approved',
                'milestones': milestones
            }}
        )
        
        # Create ongoing project
        ongoing_project = {
            'jobId': application['jobId'],
            'applicantWallet': application['applicantWallet'],
            'creatorWallet': application.get('creatorWallet', ''),
            'milestones': milestones,
            'status': 'ongoing',
            'startedAt': datetime.utcnow(),
            'expectedBudget': application.get('expectedBudget', ''),
            'estimatedTime': application.get('estimatedTime', '')
        }
        
        # Insert ongoing project
        ongoing_projects_collection.insert_one(ongoing_project)

        return jsonify({
            "message": "Application confirmed and project created successfully",
            "status": "approved"
        }), 200

    except Exception as e:
        print("Error confirming application:")
        traceback.print_exc()
        return jsonify({
            "error": "Internal server error",
            "details": str(e)
        }), 500

@app.route('/api/jobs/applications/<application_id>/approve', methods=['POST'])
def approve_application(application_id):
  try:
    # Get the milestones from the request
    milestones = request.json.get('milestones', [])
    if not milestones:
      return jsonify({"error": "Milestones are required when approving an application"}), 400
    
    # Update application status
    result = applications_collection.update_one(
      {'_id': ObjectId(application_id)},
      {'$set': {'status': 'approved'}}
    )
    
    if result.modified_count == 0:
      return jsonify({"error": "Application not found"}), 404
    
    # Create a new ongoing project entry
    application = applications_collection.find_one({'_id': ObjectId(application_id)})
    if not application:
      return jsonify({"error": "Application not found"}), 404
    
    ongoing_project = {
      'jobId': application['jobId'],
      'applicantWallet': application['applicantWallet'],
      'creatorWallet': application.get('creatorWallet', ''),  # Assuming you have this in the application
      'milestones': milestones,
      'status': 'ongoing',
      'startedAt': datetime.utcnow(),
      'expectedBudget': application.get('expectedBudget', ''),
      'estimatedTime': application.get('estimatedTime', '')
    }
    
    # Insert ongoing project into the new collection
    ongoing_projects_collection.insert_one(ongoing_project)

    return jsonify({
      "message": "Application approved successfully",
      "status": "approved"
    }), 200

  except Exception as e:
    print("Error approving application:")
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
        
        if action == 'approve':
            # Handle approval logic...
            pass

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
    
@app.route('/api/jobs/applications/<application_id>/reject', methods=['POST'])
def reject_application(application_id):
    try:
        # Find the application first to get the job ID
        application = applications_collection.find_one({'_id': ObjectId(application_id)})
        
        if not application:
            return jsonify({"error": "Application not found"}), 404
            
        # Update application status to rejected
        result = applications_collection.update_one(
            {'_id': ObjectId(application_id)},
            {'$set': {
                'status': 'rejected',
                'rejectedAt': datetime.utcnow()
            }}
        )
        
        return jsonify({
            "message": "Application rejected successfully",
            "status": "rejected",
            "jobId": str(application['jobId'])
        }), 200

    except Exception as e:
        print("Error rejecting application:")
        traceback.print_exc()
        return jsonify({
            "error": "Internal server error",
            "details": str(e)
        }), 500
    
@app.route('/api/jobs/<job_id>/applications', methods=['GET'])
def get_job_applications(job_id):
    try:
        # Find all non-rejected applications for the given job
        applications = list(applications_collection.find({
            'jobId': ObjectId(job_id),
            'status': {'$ne': 'rejected'}  # Exclude rejected applications
        }))
        
        # Enrich applications with additional details
        enriched_applications = []
        for application in applications:
            app_details = {
                '_id': str(application['_id']),
                'jobId': str(application['jobId']),
                'applicantWallet': application.get('applicantWallet', ''),
                'coverLetter': application.get('coverLetter', ''),
                'expectedBudget': application.get('expectedBudget', ''),
                'estimatedTime': application.get('estimatedTime', ''),
                'status': application.get('status', 'pending'),
                'appliedAt': application.get('appliedAt')
            }
            enriched_applications.append(app_details)
        
        return jsonify(enriched_applications), 200

    except Exception as e:
        print("Error fetching job applications:")
        traceback.print_exc()
        return jsonify({
            "error": "Internal server error",
            "details": str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)