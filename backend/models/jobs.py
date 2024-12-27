from pymongo import MongoClient
from bson.objectid import ObjectId

class Jobs:
    def __init__(self, mongo_uri):
        self.client = MongoClient(mongo_uri)
        self.db = self.client.get_database("freelancing_platform")
        self.jobs_collection = self.db.get_collection("jobs")

    def get_all_jobs(self):
        jobs = self.jobs_collection.find()
        return [
            {
                "id": str(job["_id"]),
                "title": job["title"],
                "freelancer": job.get("freelancer"),
                "status": job.get("status", "open"),
            }
            for job in jobs
        ]

    def create_job(self, title):
        result = self.jobs_collection.insert_one({
            "title": title,
            "freelancer": None,
            "status": "open",
        })
        return str(result.inserted_id)

    def apply_for_job(self, job_id, freelancer):
        job = self.jobs_collection.find_one({"_id": ObjectId(job_id)})
        if job and job.get("freelancer") is None:
            self.jobs_collection.update_one(
                {"_id": ObjectId(job_id)},
                {"$set": {"freelancer": freelancer, "status": "in progress"}}
            )
            return True
        return False

    def update_job_status(self, job_id, status):
        job = self.jobs_collection.find_one({"_id": ObjectId(job_id)})
        if job:
            self.jobs_collection.update_one(
                {"_id": ObjectId(job_id)},
                {"$set": {"status": status}}
            )
            return True
        return False
