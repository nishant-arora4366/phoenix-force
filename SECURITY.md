# Security Configuration

## JWT Secret Management

This application uses JWT tokens for authentication. The JWT secret is a critical security component that must be properly configured.

### ⚠️ Security Requirements

1. **Never commit JWT secrets to version control**
2. **Use a strong, unique secret (minimum 32 characters)**
3. **Rotate secrets regularly in production**

### Setup Instructions

1. **Create your local environment file:**
   ```bash
   touch .env.local
   ```

2. **Generate a secure JWT secret:**
   ```bash
   node scripts/generate-jwt-secret.js
   ```

3. **Add the generated secret to your .env.local file:**
   ```bash
   JWT_SECRET=your-generated-secret-here
   ```

4. **Add your Supabase credentials to .env.local:**
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
   ```

### Environment File Priority (Next.js)

Next.js loads environment variables in this order (higher priority overrides lower):

1. `.env.development.local` (development only, not committed)
2. `.env.local` (local overrides, not committed) ⭐ **Use this for your secrets**
3. `.env.development` (development defaults, can be committed)
4. `.env` (base defaults, can be committed)

**Recommendation:** Use `.env.local` for your personal development secrets.

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `JWT_SECRET` | ✅ Yes | Secret key for JWT signing (min 32 chars) |
| `JWT_EXPIRES_IN` | ❌ No | Token expiration time (default: 30m) |

### Validation

The application will automatically validate that:
- JWT_SECRET is present
- JWT_SECRET is at least 32 characters long
- JWT_SECRET is not a common weak value

If validation fails, the application will not start and will display helpful error messages.

### Production Deployment

For production deployments:

1. Set environment variables in your hosting platform
2. Never use the example values
3. Consider using a secrets management service
4. Rotate secrets periodically

### Security Best Practices

- Use different secrets for different environments
- Monitor for secret exposure in logs
- Implement proper secret rotation procedures
- Use HTTPS in production
- Consider implementing token refresh mechanisms
