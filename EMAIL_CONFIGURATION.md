# Email Notifications Configuration

The Jira Estimation Tool now includes email notifications to enhance collaboration and keep users informed about important events.

## 📧 Email Notifications

The application sends emails for the following events:

### 1. Welcome Email on Registration 🎉
- **Trigger**: When a new user registers an account
- **Recipient**: The newly registered user
- **Content**: Welcome message with features overview and getting started tips

### 2. Session Invitation Email 🎯
- **Trigger**: When a user is invited to join an estimation session
- **Recipient**: The invited user
- **Content**: Session details, voting instructions, and direct link to join

### 3. First Vote Notification 🗳️
- **Trigger**: When someone casts their first vote in a session
- **Recipient**: The session creator
- **Content**: Vote details and session management information

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the project root with the following configuration:

```bash
# Email Server Configuration
MAIL_SERVER=mail.vas-hosting.cz
MAIL_PORT=465
MAIL_USE_TLS=false
MAIL_USE_SSL=true
MAIL_USERNAME=no-reply@mitruk.eu
MAIL_SENDER=no-reply@mitruk.eu
MAIL_PASSWORD=4w9f8/!-jUP3?AwH
APP_BASE_URL=http://localhost:8080

# Flask Application Configuration
FLASK_ENV=production
FLASK_APP=main.py
```

### Configuration Options

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `MAIL_SERVER` | SMTP server hostname | `localhost` | Yes |
| `MAIL_PORT` | SMTP server port | `587` | Yes |
| `MAIL_USE_TLS` | Use TLS encryption | `true` | No |
| `MAIL_USE_SSL` | Use SSL encryption | `false` | No |
| `MAIL_USERNAME` | SMTP authentication username | None | Yes* |
| `MAIL_PASSWORD` | SMTP authentication password | None | Yes* |
| `MAIL_SENDER` | Default sender email address | `MAIL_USERNAME` | No |
| `APP_BASE_URL` | Base URL for links in emails | `http://localhost:8080` | No |

*Required if your SMTP server requires authentication

### Common SMTP Configurations

#### Gmail
```bash
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=true
MAIL_USE_SSL=false
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
```

#### Outlook/Hotmail
```bash
MAIL_SERVER=smtp-mail.outlook.com
MAIL_PORT=587
MAIL_USE_TLS=true
MAIL_USE_SSL=false
MAIL_USERNAME=your-email@outlook.com
MAIL_PASSWORD=your-password
```

#### Custom SMTP (Example provided)
```bash
MAIL_SERVER=mail.vas-hosting.cz
MAIL_PORT=465
MAIL_USE_TLS=false
MAIL_USE_SSL=true
MAIL_USERNAME=no-reply@mitruk.eu
MAIL_SENDER=no-reply@mitruk.eu
MAIL_PASSWORD=4w9f8/!-jUP3?AwH
```

## 🐳 Docker Configuration

### Using Docker Compose

Update your `docker-compose.yml` to include email environment variables:

```yaml
services:
  jira-estimation-app:
    # ... existing configuration
    environment:
      - FLASK_ENV=production
      - FLASK_APP=main.py
      - MAIL_SERVER=mail.vas-hosting.cz
      - MAIL_PORT=465
      - MAIL_USE_TLS=false
      - MAIL_USE_SSL=true
      - MAIL_USERNAME=no-reply@mitruk.eu
      - MAIL_SENDER=no-reply@mitruk.eu
      - MAIL_PASSWORD=your_email_password
      - APP_BASE_URL=http://localhost:8080
    env_file:
      - .env
```

### Using Docker Run

```bash
docker run -d \
  --name jira-estimation-app \
  -p 8080:5000 \
  -v ./database:/app/database \
  -e MAIL_SERVER=mail.vas-hosting.cz \
  -e MAIL_PORT=465 \
  -e MAIL_USE_SSL=true \
  -e MAIL_USERNAME=no-reply@mitruk.eu \
  -e MAIL_PASSWORD=your_password \
  -e APP_BASE_URL=http://localhost:8080 \
  shock3udt/jira-estimation:latest
```

## 🎨 Email Templates

The email templates are designed to match the application's modern style:

- **Responsive design** that works on all devices
- **Modern gradient header** with application branding
- **Clean typography** using system fonts
- **Structured content** with clear sections and call-to-action buttons
- **Professional footer** with application links

### Email Template Features

- HTML and plain text versions for maximum compatibility
- Inline CSS for reliable rendering across email clients
- Professional color scheme matching the application theme
- Clear information hierarchy and readable typography
- Mobile-responsive design

## 🛠️ Testing Email Configuration

### Quick Email Test Script

Use the included test script to verify your email configuration:

```bash
# Test your email configuration
python test_email.py your-email@example.com
```

This script will:
- Validate your email configuration
- Send a test email to the specified address
- Provide troubleshooting tips if issues occur

### Application Testing

After configuring your email settings, you can test the functionality by:

1. **Registration Test**: Create a new user account to receive a welcome email
2. **Invitation Test**: Create a session and invite another user
3. **Voting Test**: Have someone cast their first vote in a session

## 🔍 Troubleshooting

### Common Issues

#### Emails Not Sending
- Check SMTP server settings and credentials
- Verify firewall/network access to SMTP server
- Check application logs for error messages
- Ensure email configuration is loaded properly

#### Sender Shows as Recipient in Email Headers
This issue occurs when the MAIL_DEFAULT_SENDER is not configured properly:

**Root Cause**: Missing or incorrect `MAIL_SENDER` environment variable

**Solution**:
1. Ensure `MAIL_SENDER` is set in your environment variables:
   ```bash
   MAIL_SENDER=no-reply@yourdomain.com
   ```
2. Check application logs for sender configuration messages
3. Verify the sender is different from recipient emails
4. Test with the included `test_email.py` script

**Validation**: The application now logs the configured sender on startup and validates sender ≠ recipient before sending emails

#### Authentication Errors
- Verify username and password are correct
- For Gmail, use an App Password instead of your regular password
- Check if two-factor authentication is enabled

#### SSL/TLS Issues
- Verify the correct port and encryption settings
- Port 587 typically uses TLS, port 465 uses SSL
- Some servers require specific encryption combinations

### Debug Mode

To debug email issues, check the Flask application logs:

```bash
# Docker logs
docker compose logs -f

# Direct Python logs
python main.py
```

### Email Client Testing

Test email delivery with different clients:
- Gmail, Outlook, Apple Mail
- Mobile email clients
- Web-based email clients

## 🔒 Security Considerations

- **Environment Variables**: Never commit email passwords to version control
- **Secure SMTP**: Use SSL/TLS encryption when possible
- **Dedicated Email Account**: Use a dedicated email account for the application
- **Rate Limiting**: Consider implementing rate limiting for email sending
- **Error Handling**: Email failures don't block application functionality

## 📋 Requirements

The email functionality requires Flask-Mail, which is automatically included in the `requirements.txt`:

```
Flask-Mail==0.9.1
```

## 🚀 Production Deployment

For production environments:

1. **Use environment variables** for all sensitive configuration
2. **Enable SSL/TLS** encryption for SMTP connections
3. **Monitor email delivery** and error rates
4. **Set up proper DNS records** (SPF, DKIM) for your sender domain
5. **Consider using a dedicated email service** (SendGrid, Mailgun, etc.)

## 📞 Support

If you encounter issues with email configuration:

1. Check the troubleshooting section above
2. Review application logs for error messages
3. Verify your SMTP provider's documentation
4. Test with a simple email client first
5. Contact your email provider for server-specific issues

---

**Note**: Email notifications are designed to be non-blocking. If email sending fails, it won't prevent users from registering, creating sessions, or voting. Errors are logged for debugging purposes.