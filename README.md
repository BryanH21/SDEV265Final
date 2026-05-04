# ClientBased Customer Management System

A web based client management system built for SDEV265. Allows users to create, view, edit, and delete client profiles with renewal tracking and a live MySQL database.

## Tech Stack

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** PHP (hosted on Hostinger)
- **Database:** MySQL (hosted on Hostinger)
- **Version Control:** GitHub

## Project Structure

SDEV265Final/
├── api/
│   └── clients.php        PHP API, handles all database operations
├── frontend/
│   ├── index.html         Main app UI
│   ├── css/
│   │   └── style.css      All styles
│   └── js/
│       └── app.js         All frontend logic
├── backend/               Original Node.js backend (replaced by PHP)
└── README.md

## Live Site

https://drifxs.com

## API Endpoint

All client data flows through:
https://drifxs.com/api/clients.php

| Method | URL | Description |
| GET | /api/clients.php | Get all clients |
| GET | /api/clients.php/{id} | Get one client |
| POST | /api/clients.php | Create client |
| PUT | /api/clients.php/{id} | Update client |
| DELETE | /api/clients.php/{id} | Delete client |

## Installation

No local server needed. The frontend connects directly to the live PHP API on Hostinger. To run locally, open frontend/index.html in a browser or use VS Code Live Server.

## Deployment

Frontend and PHP files are hosted on Hostinger. To update:
1. Push changes to GitHub
2. Upload updated files to Hostinger via File Manager or FTP

## Features

- Dashboard with all clients and live search
- Color coded renewal status badges (Active, Renewing Soon, Overdue)
- Client profile view with full details
- Create and edit clients via modal form
- Delete clients with confirmation prompt
- Stat cards showing total, renewing soon, and overdue counts

## Team

- Jesse A
- Nicholas A
- Bryan H