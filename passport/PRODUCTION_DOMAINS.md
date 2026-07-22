# Production Domain Configuration

## Configured Domains

### Passport App (Student QR Code App)
- **Production**: `https://passport.vjstartup.com`
- **Development**: `https://dev-passport.vjstartup.com`
- **Local Dev**: `http://localhost:5173` (dev) / `http://localhost:4000` (preview)

### Scanner App (Security Scanner)
- **Production**: `https://scanner.vjstartup.com`
- **Development**: `https://dev-scanner.vjstartup.com`
- **Local Dev**: `http://localhost:5174` (dev) / `http://localhost:6000` (preview)

## What's Already Configured

### 1. API Server CORS (`api-server/index.js`)
✅ All domains added to `allowedOrigins`:
- passport.vjstartup.com
- dev-passport.vjstartup.com
- scanner.vjstartup.com
- dev-scanner.vjstartup.com
- localhost ports: 3000, 4000, 5173, 5174, 6000

### 2. Vite Configuration
✅ **Passport App** (`passport-pwa/vite.config.ts`):
- Preview port: 4000
- API proxy configured
- Base path: `/`

✅ **Scanner App** (`vjscanner-pwa/vite.config.ts`):
- Preview port: 6000
- API proxy configured
- HTTPS support for local dev
- Base path: `/`

## Deployment Steps

### Build the Apps

```bash
# Build Passport App
cd passport-pwa
npm run build
# Output: dist/

# Build Scanner App
cd vjscanner-pwa
npm run build
# Output: dist/
```

### Web Server Configuration (Nginx Example)

```nginx
# Passport Production
server {
    listen 443 ssl;
    server_name passport.vjstartup.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    root /var/www/passport-pwa/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}

# Passport Development
server {
    listen 443 ssl;
    server_name dev-passport.vjstartup.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    root /var/www/dev-passport-pwa/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}

# Scanner Production
server {
    listen 443 ssl;
    server_name scanner.vjstartup.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    root /var/www/vjscanner-pwa/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}

# Scanner Development
server {
    listen 443 ssl;
    server_name dev-scanner.vjstartup.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    root /var/www/dev-vjscanner-pwa/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### Environment Variables

Create `.env` files for each deployment:

**Passport Production** (`.env.production`):
```bash
VITE_API_BASE_URL=https://api.vjstartup.com
VITE_AUTH_SERVER_URL=https://auth.vjstartup.com
VITE_QR_VERSION=2
VITE_PORT=5173
```

**Passport Development** (`.env.development`):
```bash
VITE_API_BASE_URL=https://dev-api.vjstartup.com
VITE_AUTH_SERVER_URL=https://dev-auth.vjstartup.com
VITE_QR_VERSION=2
VITE_PORT=5173
```

**Scanner Production** (`.env.production`):
```bash
VITE_API_BASE_URL=https://api.vjstartup.com
VITE_AUTH_SERVER_URL=https://auth.vjstartup.com
VITE_HOSTEL_ID=BH1
VITE_PORT=5174
```

**Scanner Development** (`.env.development`):
```bash
VITE_API_BASE_URL=https://dev-api.vjstartup.com
VITE_AUTH_SERVER_URL=https://dev-auth.vjstartup.com
VITE_HOSTEL_ID=BH1
VITE_PORT=5174
VITE_DISABLE_AUTH=false
```

## DNS Configuration

Ensure DNS A/CNAME records point to your server:
- `passport.vjstartup.com` → Server IP
- `dev-passport.vjstartup.com` → Server IP
- `scanner.vjstartup.com` → Server IP
- `dev-scanner.vjstartup.com` → Server IP

## SSL Certificates

Use Let's Encrypt for free SSL certificates:
```bash
sudo certbot --nginx -d passport.vjstartup.com
sudo certbot --nginx -d dev-passport.vjstartup.com
sudo certbot --nginx -d scanner.vjstartup.com
sudo certbot --nginx -d dev-scanner.vjstartup.com
```

## Quick Deploy Script

```bash
#!/bin/bash
# deploy.sh

APP=$1  # passport or scanner
ENV=$2  # production or development

if [ "$APP" == "passport" ]; then
    cd passport-pwa
    if [ "$ENV" == "production" ]; then
        npm run build
        rsync -avz dist/ /var/www/passport-pwa/dist/
    else
        npm run build -- --mode development
        rsync -avz dist/ /var/www/dev-passport-pwa/dist/
    fi
elif [ "$APP" == "scanner" ]; then
    cd vjscanner-pwa
    if [ "$ENV" == "production" ]; then
        npm run build
        rsync -avz dist/ /var/www/vjscanner-pwa/dist/
    else
        npm run build -- --mode development
        rsync -avz dist/ /var/www/dev-vjscanner-pwa/dist/
    fi
fi

echo "✅ Deployed $APP ($ENV)"
```

Usage:
```bash
chmod +x deploy.sh
./deploy.sh passport production
./deploy.sh scanner development
```

## Testing After Deployment

1. **Passport App**:
   - Visit https://passport.vjstartup.com
   - Login with @vnrvjiet.in email
   - Generate QR code
   - Verify QR refreshes every 15 seconds

2. **Scanner App**:
   - Visit https://scanner.vjstartup.com
   - Login with authorized email
   - Scan QR code or barcode
   - Verify scan results display correctly
   - Test offline functionality

## Troubleshooting

### CORS Errors
- Check API server CORS configuration in `api-server/index.js`
- Verify domain is in `allowedOrigins` list
- Check browser console for exact error

### API Connection Failed
- Verify `VITE_API_BASE_URL` in `.env` files
- Check API server is running
- Test API endpoint directly: `curl https://api.vjstartup.com/health`

### Build Errors
- Clear node_modules and reinstall: `rm -rf node_modules package-lock.json && npm install`
- Check Node version: Should be 18.x or 20.x LTS
- Verify all environment variables are set

## Maintenance

### Update Dependencies
```bash
cd passport-pwa && npm update
cd ../vjscanner-pwa && npm update
cd ../api-server && npm update
```

### Monitor Logs
```bash
# API Server
pm2 logs api-server

# Nginx Access Logs
tail -f /var/log/nginx/access.log

# Nginx Error Logs
tail -f /var/log/nginx/error.log
```
