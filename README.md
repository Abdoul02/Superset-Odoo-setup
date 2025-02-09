# Superset with Odoo PostgreSQL Integration

This guide walks through setting up Apache Superset with a custom Odoo PostgreSQL database for dashboard integration.

---

## Prerequisites
- Docker & Docker Compose installed
- Git installed
- Access to this repository's `miscellaneous` folder

---

## Step 1: Set Up Superset with Odoo PostgreSQL

### 1. Clone Superset Repository
```bash
git clone https://github.com/apache/superset
cd superset
```

### 2. Checkout Release Branch
```bash
git checkout tags/5.0.0rc1
```

### 3. Replace Configuration Files
Replace these files with versions from the `miscellaneous` folder:
```bash
cp path/to/miscellaneous/Dockerfile .
cp path/to/miscellaneous/docker-compose-image-tag.yml .
cp path/to/miscellaneous/.env docker/
cp path/to/miscellaneous/superset_config.py docker/pythonpath_dev/
```

### 4. Start Docker Containers
```bash
docker compose -f docker-compose-image-tag.yml up
```

### 5. Access Superset
- **URL**: http://localhost:8088
- **Credentials**:
    - Username: `admin`
    - Password: `admin`

---

## Step 2: Add Odoo Database to Superset

### 1. Import Database Dump
```bash
# Copy dump file to container
docker cp /path/to/miscellaneous/dump.sql odoo_postgres:/tmp/dump.sql

# Import SQL dump
docker exec -it odoo_postgres psql -U odoo_user -d odoo_db -f /tmp/dump.sql
```

### 2. Verify Connection
```bash
docker exec -it superset_app python3 -c "
import psycopg2
try:
    conn = psycopg2.connect(
        dbname='odoo_db',
        user='odoo_user',
        password='odoo_pass',
        host='odoo_data',
        port='5432'
    )
    print('✅ Connection successful!')
except Exception as e:
    print('❌ Connection failed:', e)
"
```

**Expected Output**:  
`✅ Connection successful!`

### 3. Add Database to Superset
1. Go to **Data > Databases**
2. Click **+ Database**
3. Use connection URI:
   ```bash
   postgresql+psycopg2://odoo_user:odoo_pass@odoo_data:5432/odoo_db
   ```
4. Test connection and save

---

## Troubleshooting

### Common Issues
1. **Docker Compose Errors**:
    - Verify file replacements were done correctly
    - Clean and rebuild containers:
      ```bash
      docker compose -f docker-compose-image-tag.yml down -v
      docker compose -f docker-compose-image-tag.yml up
      ```

2. **Connection Failures**:
    - Ensure containers are on same network:
      ```bash
      docker network inspect superset_default
      ```
    - Install required driver in Superset container:
      ```bash
      docker exec -it superset_app pip install psycopg2-binary
      ```

3. **Authentication Issues**:
    - Verify credentials in:
        - `docker-compose-image-tag.yml`
        - Superset database connection URI

4. **Embed Superset Dashboard in Odoo**
   - This step assumes you have odoo running on your local machine, if not you can refer to https://github.com/Keling64/Yumi-Organics/blob/custom/README.md.
   - Replace your custom_dashboard folder with the one from this module.

### Create Embed Role in Superset

1. Log in to Superset (http://localhost:8088)

2. Go to Settings → Security → List Roles

3. Click + Add a new role

4. Set Role Name: embed_dashboard

5. Set Permissions (Please see list of permissions under miscellaneous/images/permission.png)

6. Click Save

### Create Odoo Dashboard User

1. Go to Settings → Security → List Users

2. Click + Add a new user

3. Set fields:
   - Username: odoo_dashboard
   - First Name: Guest
   - Last Name: User
   - Email: odoo@example.com
   - Password: secure_password_here

4. Under Roles, select embed_dashboard and Gamma

5. Click Save

### Generate Embedded Dashboard ID

Go to dashboard and select a dashboard you want to embed on Odoo then follow the steps below: 

 - In the top right corner near 'EDIT DASHBOARD' click on the three dots and click Embed Dashboard.
 - In the pop-up, under allowed domains add 'http://localhost:8069' and click enable
 - An Id will be generated.
 - Go to your newly copied custom_dashboard and replace value of dashboardId in 'custom_dashboard/static/src/js/dashboard.js' with the generated Id.

### Start Odoo with Your Custom Dashboard Module.

In Odoo-community run the following:

```bash
python3 odoo-bin --addons-path=/path/to/OdooDev/odoo-community/addons,/path/to/OdooDev/custom_addons
```

---

## Next Steps
- Add datasets from `odoo_db` through **Data > Datasets**
- Build charts/dashboards using your Odoo data
- Configure scheduled data refreshes if needed

For Superset documentation, see: [superset.apache.org/docs](https://superset.apache.org/docs)