#!/usr/bin/env python3
"""
Email Configuration Test Script

This script tests the email configuration for the Jira Estimation Tool.
Run this script to verify that your email settings are working correctly.

Usage:
    python test_email.py recipient@example.com
"""

import os
import sys
from flask import Flask
from flask_mail import Mail, Message

def create_test_app():
    """Create a minimal Flask app for testing email"""
    app = Flask(__name__)

    # Email configuration from environment variables
    app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER', 'localhost')
    app.config['MAIL_PORT'] = int(os.getenv('MAIL_PORT', 587))
    app.config['MAIL_USE_TLS'] = os.getenv('MAIL_USE_TLS', 'true').lower() == 'true'
    app.config['MAIL_USE_SSL'] = os.getenv('MAIL_USE_SSL', 'false').lower() == 'true'
    app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
    app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
    app.config['MAIL_DEFAULT_SENDER'] = os.getenv('MAIL_SENDER', os.getenv('MAIL_USERNAME'))

    return app

def test_email_config(recipient_email):
    """Test email configuration by sending a test email"""

    print("🧪 Testing Email Configuration...")
    print("=" * 50)

    # Create Flask app and Mail instance
    app = create_test_app()
    mail = Mail(app)

    # Print configuration
    print(f"📧 MAIL_SERVER: {app.config['MAIL_SERVER']}")
    print(f"🔌 MAIL_PORT: {app.config['MAIL_PORT']}")
    print(f"🔒 MAIL_USE_TLS: {app.config['MAIL_USE_TLS']}")
    print(f"🔐 MAIL_USE_SSL: {app.config['MAIL_USE_SSL']}")
    print(f"👤 MAIL_USERNAME: {app.config['MAIL_USERNAME']}")
    print(f"📮 MAIL_SENDER: {app.config['MAIL_DEFAULT_SENDER']}")
    print(f"📬 Recipient: {recipient_email}")
    print("-" * 50)

        # Validate configuration
    if not app.config['MAIL_SERVER'] or app.config['MAIL_SERVER'] == 'localhost':
        print("❌ ERROR: MAIL_SERVER not configured")
        return False

    if not app.config['MAIL_USERNAME']:
        print("❌ ERROR: MAIL_USERNAME not configured")
        return False

    if not app.config['MAIL_PASSWORD']:
        print("❌ ERROR: MAIL_PASSWORD not configured")
        return False

    # Validate sender configuration
    if not app.config['MAIL_DEFAULT_SENDER']:
        print("❌ ERROR: MAIL_DEFAULT_SENDER not configured")
        return False

    # Check that sender is not same as recipient
    if app.config['MAIL_DEFAULT_SENDER'] == recipient_email:
        print(f"❌ ERROR: Sender and recipient are the same: {app.config['MAIL_DEFAULT_SENDER']}")
        return False

    try:
        with app.app_context():
            # Create test message
            msg = Message(
                subject="🧪 Jira Estimation Tool - Email Test",
                sender=app.config['MAIL_DEFAULT_SENDER'],
                recipients=[recipient_email]
            )

            msg.body = """
            Email Configuration Test

            This is a test email from the Jira Estimation Tool.

            If you receive this email, your email configuration is working correctly!

            Configuration Details:
            - Server: {}
            - Port: {}
            - TLS: {}
            - SSL: {}
            - Username: {}

            Time: {}
            """.format(
                app.config['MAIL_SERVER'],
                app.config['MAIL_PORT'],
                app.config['MAIL_USE_TLS'],
                app.config['MAIL_USE_SSL'],
                app.config['MAIL_USERNAME'],
                "Test Time"
            )

            msg.html = """
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 20px;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; text-align: center;">
                        <h1 style="margin: 0;">🧪 Email Configuration Test</h1>
                        <p style="margin: 5px 0 0 0;">Jira Estimation Tool</p>
                    </div>
                    <div style="background: white; padding: 20px; border-radius: 8px; margin-top: 20px;">
                        <h2 style="color: #1f2937;">✅ Test Successful!</h2>
                        <p>If you receive this email, your email configuration is working correctly!</p>

                        <div style="background: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
                            <h3 style="margin: 0 0 10px 0; color: #1f2937;">Configuration Details:</h3>
                            <ul style="margin: 0; padding-left: 20px;">
                                <li><strong>Server:</strong> {}</li>
                                <li><strong>Port:</strong> {}</li>
                                <li><strong>TLS:</strong> {}</li>
                                <li><strong>SSL:</strong> {}</li>
                                <li><strong>Username:</strong> {}</li>
                            </ul>
                        </div>

                        <p style="color: #6b7280; font-size: 14px;">
                            This test email was sent automatically by the Jira Estimation Tool email configuration test.
                        </p>
                    </div>
                </div>
            </body>
            </html>
            """.format(
                app.config['MAIL_SERVER'],
                app.config['MAIL_PORT'],
                app.config['MAIL_USE_TLS'],
                app.config['MAIL_USE_SSL'],
                app.config['MAIL_USERNAME']
            )

            # Send the email
            print("📤 Sending test email...")
            mail.send(msg)
            print("✅ SUCCESS: Test email sent successfully!")
            print(f"📬 Check {recipient_email} for the test email.")
            return True

    except Exception as e:
        print(f"❌ ERROR: Failed to send test email: {str(e)}")
        print("\n🔍 Troubleshooting Tips:")
        print("1. Verify your SMTP server settings")
        print("2. Check your username and password")
        print("3. Ensure the SMTP server allows connections from your IP")
        print("4. For Gmail, use an App Password instead of your regular password")
        print("5. Check if your firewall is blocking the SMTP port")
        return False

def main():
    """Main function"""
    if len(sys.argv) != 2:
        print("Usage: python test_email.py recipient@example.com")
        sys.exit(1)

    recipient = sys.argv[1]

    # Validate email format
    if '@' not in recipient or '.' not in recipient:
        print("❌ ERROR: Invalid email address format")
        sys.exit(1)

    # Check for .env file
    if os.path.exists('.env'):
        print("📄 Loading configuration from .env file...")
        from dotenv import load_dotenv
        load_dotenv()
    else:
        print("⚠️  No .env file found. Using environment variables...")

    # Test email configuration
    success = test_email_config(recipient)

    if success:
        print("\n🎉 Email configuration test completed successfully!")
        print("You can now use email notifications in the Jira Estimation Tool.")
    else:
        print("\n❌ Email configuration test failed.")
        print("Please check your configuration and try again.")
        sys.exit(1)

if __name__ == "__main__":
    main()