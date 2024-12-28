
# WorkSphere 3.0: Revolutionizing Freelancing with Web3

## Overview

**WorkSphere 3.0** is a decentralized freelancing platform that integrates **Web3 blockchain technology** to provide secure, transparent transactions and a reliable reputation system for freelancers and clients. By utilizing blockchain and modern technologies, WorkSphere aims to address the trust and transparency issues that exist in traditional freelancing platforms.

## Problem Statement
Traditional freelancing platforms often face challenges such as high platform fees, lack of transparency in payment processing, and centralized control, which can lead to disputes and inefficiencies. Freelancers and clients often struggle with trust issues and ensuring secure, milestone-based payments.

## Solution
The proposed freelancing platform leverages Web3 technology to provide a decentralized solution that ensures transparency, security, and efficiency. By integrating blockchain for milestone-based payments and IPFS/Skynet for decentralized file hosting, the platform eliminates intermediaries and provides a trustless environment for clients and freelancers. Key features include MetaMask wallet connectivity for secure transactions, milestone tracking, and decentralized file submissions.


## Features
- **Job Creation**: Users can create jobs and define project milestones.
- **Milestone-based Payments**: Fund the project in ETH via MetaMask. Payments are released as milestones are completed.
- **Freelancer Application**: Freelancers can browse and apply for available jobs.
- **Decentralized File Submission**: Freelancers submit completed work via IPFS or Skynet links.
- **Secure Transactions**: Powered by blockchain for secure and transparent payments.

## Tech Stack
### Frontend
- **React.js**: For building the user interface.
- **TailwindCSS**: For responsive and modern UI styling.

### Backend
- **Flask**: For handling API requests and server-side logic.
- **MongoDB**: As the database to store job and user information.

### Blockchain Integration
- **MetaMask**: For wallet connectivity and ETH transactions.
- **Smart Contracts**: To manage milestone payments securely.

### File Storage
- **IPFS/Skynet**: For decentralized file hosting.

## Installation
### Prerequisites
- **Node.js**: For running the frontend.
- **Python**: For running the Flask backend.
- **MetaMask**: Installed in your browser.
- **MongoDB**: Running instance for the database.

### Setup Instructions
1. Clone the repository:
   ```bash
   git clone https://github.com/WorkSphere-3.0.git
   cd WorkSphere-3.0/
   ```

2. Install backend dependencies:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

3. Install frontend dependencies:
   ```bash
   cd ../frontend
   npm install
   ```

4. Start the backend server:
   ```bash
   cd ../backend
   python3 app.py
   ```

5. Start the frontend server:
   ```bash
   cd ../frontend
   npm run dev
   ```

6. Open the application in your browser at `http://localhost:5173`.

## Usage
1. Connect your wallet via MetaMask.
2. Create a job by specifying details and project milestones.
3. Fund the project milestones with ETH via MetaMask.
4. Freelancers can browse available jobs and apply.
5. Job creators can accept applications and assign tasks.
6. Freelancers complete milestones and submit work via IPFS or Skynet links.
7. Upon milestone completion, ETH is transferred to the freelancer.
8. Final work is submitted upon project completion.

## Folder Structure
```
freelancing-platform/
├── backend/               # Flask backend code
│   ├── app.py             # Main application file
├── frontend/              # React.js frontend code
│   ├── src/               # Source code
│   ├── components/        # React components
├── README.md              # Project documentation
```

## Contributing
Contributions are welcome! Please fork the repository and submit a pull request with your changes.

## Acknowledgments
- **MetaMask** for seamless blockchain integration.
- **IPFS/Skynet** for decentralized file hosting.
- **MongoDB** for a reliable database solution.
