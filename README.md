# Study Project B2: VLAN Configuration Automation

## Problem Statement

How can we automate and simplify the creation of VLANs using a web application on Windows Server and Cisco equipment?

## Oral Presentation Outline

### Introduction

- Group presentation
- Explanation of the problem statement
- Task distribution

### Part 1: Web Development

- **Technologies**: HTML, CSS, JavaScript (optional database)
  - VLSM segmentation features
  - Script creation
  - Database integration (optional)
  - Excel integration (optional)

### Part 2: Configuration Scripts

- **Technologies**: PowerShell, Python, .txt, Windows Server, Networking
  - Explanation of the DHCP server configuration code
  - Explanation of the router configuration code

### Part 3: Practical Implementation

- Execution of the script on Windows Server in a VM
- Execution of the script on a physical router
- Presentation of generated Excel data (optional)

### Conclusion

## Task List

### Project Management

- [x] Create a GitHub repository for the project - _Marc_
- [x] Invite other contributors to collaborate - _Marc_
- [x] Develop a task distribution table - _Marc_
- [x] Set up Linear or ClickUp for project management - _Marc_

### Script Development

- [x] Develop a prototype of the PowerShell script - _Martin_
- [x] Develop a prototype of the router script - _Marc_
- [x] Retrieve subnet results into memory variables - _Adrien_
- [x] Generate code to create a PowerShell script - _Adrien_
- [x] Generate a Python script to configure the router from JS - _Marc_
- [x] Generate code to create or complete a PDF file from VLSM segmentation - _Adrien_
- [x] Link the codebase to the script*dhcp.js file to use DHCP script creation in the web application - _Adrien_
- [x] Link the codebase to the script*router_pyserial.js file to use Router script creation in the web application - _Marc_

### Infrastructure and Testing

- [x] Create a VM on the presenter's computer - _Martin_
- [x] Borrow a physical router to test commands and prepare the demonstration - _Martin_
- [x] Test on the physical router - _Marc_
- [x] Test on the VM to verify the DHCP script - _Martin_
- [x] Deploy the website using Vercel - _Marc_

### Presentation and Documentation

- [x] Create and start the presentation PowerPoint - _Adrien_

## Technologies Used

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: PowerShell, Python
- **Database**: MySQL | MongoDB (optional)
- **Systems**: Windows Server, Cisco equipment

<a href="https://www.w3.org/html/" target="_blank" rel="noreferrer">
  <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/html5/html5-original-wordmark.svg" alt="html5" width="40" height="40" border="0"/>
</a>
<a href="https://www.w3schools.com/css/" target="_blank" rel="noreferrer">
  <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/css3/css3-original-wordmark.svg" alt="css3" width="40" height="40" border="0"/>
</a>
<a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript" target="_blank" rel="noreferrer">
  <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/javascript/javascript-original.svg" alt="javascript" width="40" height="40" border="0"/>
</a>
<a href="https://www.python.org" target="_blank" rel="noreferrer">
  <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/python/python-original.svg" alt="python" width="40" height="40" border="0"/>
</a>
<a href="https://docs.microsoft.com/en-us/powershell/" target="_blank" rel="noreferrer">
  <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/powershell/powershell-original.svg" alt="powershell" width="40" height="40" border="0"/>
</a>
<a href="https://www.microsoft.com/en-us/evalcenter/evaluate-windows-server" target="_blank" rel="noreferrer">
  <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/windows8/windows8-original.svg" alt="windows server" width="40" height="40" border="0"/>
</a>
<a href="https://www.cisco.com/site/fr/fr/index.html" target="_blank" rel="noreferrer">
  <img src="https://upload.wikimedia.org/wikipedia/commons/0/08/Cisco_logo_blue_2016.svg" alt="cisco" width="40" height="40" border="0"/>
</a>

## Installation and Dependencies

### Prerequisites

Before running the project, ensure you have installed:

- Python 3.x
- pip (Python package manager)
- A network environment with a Cisco router (physical or simulated with GNS3 or Packet Tracer)

### Project Installation

1. Clone the GitHub repository:

   ```sh
   git clone https://github.com/marc-awad/projet-etude-b2.git
   cd projet-etude-b2
   ```

2. Install the required dependencies with:

   ```sh
   pip install -r requirements.txt
   ```

3. Run the Python script to configure the router once the segmentation is done:

   ```sh
   python config-router.py
   ```

## How to Contribute?

1. Fork the repository
2. Clone the project: `git clone https://github.com/marc-awad/projet-etude-b2`
3. Create a branch: `git checkout -b feature-name`
4. Add your changes: `git add .`
5. Commit your changes: `git commit -m "Added a new feature"`
6. Push the branch: `git push origin feature-name`
7. Create a pull request

## Contact

For any questions or suggestions, please contact the project group at: marc.awad@supdevinci-edu.fr.
