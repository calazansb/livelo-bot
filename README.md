# Livelo Promotion Tracker

Automated system to track Livelo mileage transfer promotions to Brazilian airlines with daily WhatsApp notifications at noon.

## 🎯 Features

- 🔍 **Automated Web Scraping**: Monitors Livelo website for transfer promotions
- ✈️ **Multi-Airline Support**: Tracks LATAM, Azul, Smiles/GOL, and Flying Blue promotions
- 📱 **WhatsApp Notifications**: Daily updates at noon (Brazil time)
- 🆕 **Change Detection**: Alerts for new promotions immediately
- ⚠️ **Expiry Warnings**: Highlights promotions expiring within 7 days
- 📊 **Promotion History**: Tracks all promotions over time
- 🇧🇷 **Brazilian Portuguese**: All messages in Portuguese

## 📋 Prerequisites

- Node.js 18+ installed
- WhatsApp account for receiving notifications
- Smartphone to scan QR code for authentication

## 🚀 Installation

1. **Install dependencies**:
```bash
npm install
```

2. **Configure recipients**:
Edit `config.json` and update the phone number(s):
```json
{
  "whatsapp": {
    "recipients": ["+5511999999999"]
  }
}
```

Replace `+5511999999999` with your actual phone number(s) in international format.

## 📱 WhatsApp Authentication

The first time you run the application, you'll need to authenticate with WhatsApp:

1. Start the application (see Usage below)
2. A QR code will appear in your terminal
3. Open WhatsApp on your phone
4. Go to **Settings** → **Linked Devices** → **Link a Device**
5. Scan the QR code displayed in the terminal
6. Once authenticated, the session is saved and you won't need to scan again

## 🎮 Usage

### Start the Application

```bash
npm start
```

This will:
- Initialize WhatsApp connection (QR code authentication on first run)
- Send a test message to confirm everything works
- Schedule daily notifications at 12:00 PM (Brazil time)
- Keep running in the background

### Run Immediate Check

To run an immediate promotion check without waiting for the scheduled time:

```bash
npm start -- --run-now
```

### Test Scraper Only

To test the web scraper without sending WhatsApp messages:

```bash
npm run scrape
```

## ⚙️ Configuration

Edit `config.json` to customize:

```json
{
  "whatsapp": {
    "recipients": ["+5511999999999"]  // Your phone number(s)
  },
  "schedule": {
    "timezone": "America/Sao_Paulo",   // Brazil timezone
    "notificationTime": "12:00",       // Notification time
    "cronExpression": "0 12 * * *"     // Cron format (noon daily)
  },
  "airlines": ["LATAM", "Azul", "Smiles", "Flying Blue"],
  "scraping": {
    "headless": true,                  // Run browser in background
    "timeout": 30000                   // 30 seconds timeout
  }
}
```

### Cron Expression Examples

- `0 12 * * *` - Every day at noon
- `0 9,12,18 * * *` - Three times daily (9 AM, noon, 6 PM)
- `0 */6 * * *` - Every 6 hours

## 📁 Project Structure

```
livelo-promotion-tracker/
├── src/
│   ├── index.js                    # Main application entry
│   ├── scraper/
│   │   ├── liveloScraper.js       # Web scraper (Puppeteer)
│   │   └── promotionParser.js     # Data extraction & parsing
│   ├── storage/
│   │   └── promotionStore.js      # JSON-based storage
│   ├── notifications/
│   │   ├── whatsappService.js     # WhatsApp integration
│   │   └── messageFormatter.js    # Message formatting
│   ├── scheduler/
│   │   └── cronJobs.js            # Cron scheduling
│   └── utils/
│       └── logger.js              # Winston logger
├── data/                           # Promotion data (auto-created)
├── logs/                           # Application logs (auto-created)
├── config.json                     # Configuration
└── package.json
```

## 📊 Data Storage

The application stores data in the `data/` directory:

- `current_promotions.json` - Currently active promotions
- `promotion_history.json` - Historical record of all promotions

## 📝 Logs

Logs are stored in the `logs/` directory:

- `app.log` - All application logs
- `error.log` - Error logs only

## 🔧 Troubleshooting

### QR Code Not Appearing

If the QR code doesn't appear:
1. Make sure your terminal supports UTF-8
2. Try running in a different terminal
3. Check `logs/error.log` for errors

### WhatsApp Connection Issues

If WhatsApp keeps disconnecting:
1. Delete the `.wwebjs_auth` folder
2. Restart the application
3. Scan the QR code again

### No Promotions Found

The scraper uses multiple strategies to find promotions:
1. Search functionality
2. Menu navigation
3. Banner detection

If no promotions are found, it may mean:
- Livelo website structure changed (check logs)
- No active promotions at the moment
- Website is blocking automated access

### Message Not Delivered

Ensure:
- Phone number is in international format: `+55 11 99999-9999`
- WhatsApp is connected (check logs)
- Recipient has WhatsApp installed

## 🛑 Stopping the Application

Press `Ctrl+C` in the terminal where the application is running. The application will gracefully disconnect from WhatsApp and save all data.

## 🔒 Security Notes

- The `.wwebjs_auth` folder contains your WhatsApp session. Keep it secure.
- Add `.wwebjs_auth` to `.gitignore` if using version control
- Never share your authentication data

## 📄 License

MIT

## 🤝 Contributing

This is a personal automation tool. Feel free to fork and customize for your needs!

## ⚠️ Disclaimer

This tool is for personal use only. Web scraping should be done responsibly:
- Respect Livelo's terms of service
- Don't overload their servers with requests
- Use reasonable scraping intervals
- This tool is not affiliated with Livelo

## 💡 Tips

1. **Multiple Recipients**: Add multiple phone numbers to the `recipients` array
2. **Custom Schedule**: Modify the cron expression for different notification times
3. **Monitoring**: Check `logs/app.log` regularly to ensure everything is working
4. **Updates**: Run `npm update` periodically to get dependency updates

## 🆘 Support

If you encounter issues:
1. Check the logs in `logs/error.log`
2. Ensure all dependencies are installed: `npm install`
3. Verify your Node.js version: `node --version` (should be 18+)
4. Make sure WhatsApp Web works in your browser

---

**Enjoy automated Livelo promotion tracking! ✈️🎉**
