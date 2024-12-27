// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract JobRegistry {
    struct Job {
        address creator;
        string title;
        string description;
        uint256 budget;
        string category;
        address[] applicants;
        bool isActive;
        uint256 createdAt;
    }

    mapping(uint256 => Job) public jobs;
    uint256 public jobCount;

    event JobCreated(
        uint256 indexed jobId, 
        address creator, 
        string title, 
        uint256 budget
    );

    event JobApplied(
        uint256 indexed jobId, 
        address applicant
    );

    function createJob(
        string memory _title, 
        string memory _description, 
        uint256 _budget,
        string memory _category
    ) public returns (uint256) {
        jobCount++;
        jobs[jobCount] = Job({
            creator: msg.sender,
            title: _title,
            description: _description,
            budget: _budget,
            category: _category,
            applicants: new address[](0),
            isActive: true,
            createdAt: block.timestamp
        });

        emit JobCreated(jobCount, msg.sender, _title, _budget);
        return jobCount;
    }

    function applyToJob(uint256 _jobId) public {
        require(jobs[_jobId].isActive, "Job is not active");
        
        jobs[_jobId].applicants.push(msg.sender);
        
        emit JobApplied(_jobId, msg.sender);
    }

    function getJobApplicants(uint256 _jobId) public view returns (address[] memory) {
        return jobs[_jobId].applicants;
    }

    function deactivateJob(uint256 _jobId) public {
        require(jobs[_jobId].creator == msg.sender, "Only job creator can deactivate");
        jobs[_jobId].isActive = false;
    }
}