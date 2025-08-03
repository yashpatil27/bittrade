# Deployment

This folder contains all deployment-related scripts, configuration files, and documentation for the BitTrade project.

## Structure

```
deployment/
├── README.md                    # This file
├── docker-compose.yml          # Docker composition for containerized deployment
├── scripts/                    # Deployment and setup scripts
│   ├── deploy.sh              # Main deployment script
│   ├── update.sh              # Update script (pull changes, run migrations, restart PM2)
│   ├── deploy-playbook.yml    # Ansible deployment playbook
│   └── setup-database.sh      # Database initialization script
└── docs/                      # Documentation
    ├── PRODUCTION_DEPLOYMENT_GUIDE.md  # Production deployment guide
    ├── README_PRODUCTION.md            # Production-specific readme
    ├── CLIENT_README.md               # Client-side documentation
    ├── DATABASE_README.md             # Database documentation
    └── SERVER_README.md               # Server-side documentation
```

## Quick Start

1. **For local development with Docker:**
   ```bash
   docker-compose up
   ```

2. **For production deployment:**
   ```bash
   ./scripts/deploy.sh
   ```

3. **For updating production (pull changes, run migrations, restart PM2):**
   ```bash
   ./scripts/update.sh
   ```

4. **For database setup:**
   ```bash
   ./scripts/setup-database.sh
   ```

## Documentation

- Read `docs/PRODUCTION_DEPLOYMENT_GUIDE.md` for detailed production deployment instructions
- Check `docs/README_PRODUCTION.md` for production-specific configuration
- Refer to component-specific READMEs in the `docs/` folder for detailed documentation

## Prerequisites

Before running any deployment scripts, ensure you have the necessary dependencies installed and configured as outlined in the documentation files.
