# BrowserOS Error Reporting Setup

## Overview
BrowserOS includes a comprehensive error reporting system that automatically captures system errors and provides users with an easy way to report problems via email.

## Features
- 🛡️ **Automatic Error Detection**: Captures JavaScript errors and promise rejections
- 💥 **User-Friendly Error Dialogs**: Professional error display with action buttons
- 📧 **Email Reporting**: Multiple methods to send error reports to developers
- 📊 **System Information**: Automatically collects relevant system data
- 🔄 **Fallback Options**: Multiple backup methods if primary email service fails

## Email Configuration

### Step 1: Update .env File
Edit the `.env` file in the project root and replace the placeholder values:

```env
# BrowserOS Configuration
DEVELOPMENT_EMAIL=your-actual-email@gmail.com

# Optional: EmailJS Configuration (for advanced users)
EMAILJS_SERVICE_ID=your_service_id
EMAILJS_TEMPLATE_ID=your_template_id  
EMAILJS_PUBLIC_KEY=your_public_key

# System Configuration
ENABLE_ERROR_REPORTING=true
DEBUG_MODE=true
```

### Step 2: Choose Email Service Method

#### Option A: FormSubmit (Recommended - No Setup Required)
FormSubmit is a free service that works out of the box:
- ✅ No registration required
- ✅ Works immediately with any email address
- ✅ Automatically configured in BrowserOS

Simply update your email in the `.env` file and it will work!

#### Option B: EmailJS (Advanced - Requires Setup)
For more control, you can use EmailJS:

1. Sign up at [EmailJS.com](https://www.emailjs.com/)
2. Create an email service (Gmail, Outlook, etc.)
3. Create an email template for error reports
4. Get your Service ID, Template ID, and Public Key
5. Update the `.env` file with your EmailJS credentials

#### Option C: Manual Download (Always Available)
If email services fail, users can download error reports as text files and send them manually.

## Error Report Contents

When a user clicks "Report Problem", the system automatically includes:

### System Information
- Browser details (UserAgent, platform, language)
- Screen resolution and window size
- Local storage availability and usage
- Current URL and referrer
- Online/offline status

### Error Details
- Error message and type
- File location and line numbers
- Complete stack trace
- Timestamp of occurrence
- BrowserOS version information

### User Context
- What the user was trying to do
- Which component failed
- Application state information

## Testing Error Reporting

### Method 1: Force a JavaScript Error
Open the browser console and run:
```javascript
// This will trigger the error reporter
throw new Error("Test error for reporting system");
```

### Method 2: Trigger a System Error
You can manually trigger the error reporter:
```javascript
// This will show the error dialog
window.errorReporter.reportManualError(new Error("Manual test error"), {
    component: "Test",
    action: "Testing error reporting"
});
```

### Method 3: Break a Component
Temporarily rename a required script file to cause an initialization error.

## Customization

### Custom Error Messages
You can customize error messages by modifying the `ErrorReporter.js` file:

```javascript
// In src/utilities/ErrorReporter.js
showErrorDialog(errorData) {
    // Customize the dialog content here
}
```

### Additional System Information
Add custom system data collection:

```javascript
// In collectSystemInfo() method
collectSystemInfo() {
    return {
        // ... existing data ...
        customData: {
            userPreferences: this.getUserPreferences(),
            installedApps: this.getInstalledApps()
        }
    };
}
```

### Email Template Customization
For EmailJS users, customize your email template with these variables:
- `{{error_message}}` - The error message
- `{{system_info}}` - System information JSON
- `{{timestamp}}` - When the error occurred
- `{{user_message}}` - Any additional user feedback

## Troubleshooting

### "Failed to send report" Error
1. Check your internet connection
2. Verify the email address in `.env` is correct
3. Check browser console for specific error details
4. Try the manual download option

### Email Not Received
1. Check spam/junk folder
2. Verify the destination email address
3. FormSubmit may have daily limits (try EmailJS)
4. Check that the service isn't blocked by corporate firewall

### System Not Detecting Errors
1. Check that `ErrorReporter.js` is loaded in `index.html`
2. Verify browser console for initialization messages
3. Look for the "🛡️ ErrorReporter initialized" message

## Support

If you encounter issues with the error reporting system:

1. **Check browser console** for error messages
2. **Enable debug mode** in `.env` for verbose logging
3. **Try manual error reporting** using the download option
4. **Contact support** with your system configuration

## Security Notes

- Error reports may contain sensitive information
- Only send reports to trusted email addresses  
- Consider sanitizing error messages in production
- Regular error reports can indicate system issues that need attention

## Development

### Adding Error Reporting to Custom Components

```javascript
// In your custom component
try {
    // Your code here
    riskyOperation();
} catch (error) {
    // Report the error with context
    if (window.errorReporter) {
        window.errorReporter.reportManualError(error, {
            component: 'MyComponent',
            action: 'riskyOperation',
            userData: someRelevantData
        });
    }
}
```

### Testing in Development

Enable debug mode to see detailed error information:
```javascript
// In browser console
window.errorReporter.config.DEBUG_MODE = true;
```

---

## Quick Start Checklist

- [ ] Update `DEVELOPMENT_EMAIL` in `.env` file
- [ ] Test error reporting with console command
- [ ] Verify email reception (check spam folder)
- [ ] Enable debug mode for development
- [ ] Customize error messages if needed

Your BrowserOS error reporting system is now ready! 🎉
