# Invoicing Genius

A comprehensive invoicing application designed for small businesses. Create, manage, and track invoices and estimates with ease.

## Features

- **Invoice Management**: Create, edit, and manage professional invoices
- **Estimate Creation**: Generate estimates for clients
- **Client Management**: Maintain a database of clients
- **Payment Tracking**: Track payments and outstanding balances
- **Reports and Analytics**: Generate financial reports and insights
- **Multi-Currency Support**: Work with different currencies
- **Multi-Language Support**: Available in English, Spanish, and French
- **Offline Support**: Work without an internet connection
- **Cross-Device Sync**: Use on desktop and mobile devices

## Desktop Application

Invoicing Genius is available as a desktop application for Windows, macOS, and Linux.

### Installation

1. Download the latest release from the [releases page](https://github.com/yourusername/invoicing-genius/releases)
2. Run the installer for your platform:
   - Windows: `InvoicingGenius-Setup-x.x.x.exe`
   - macOS: `InvoicingGenius-x.x.x.dmg`
   - Linux: `InvoicingGenius-x.x.x.AppImage`

### Building from Source

To build the desktop application from source:

```sh
# Install dependencies
npm install

# Build the React application
npm run build

# Build the Electron application
npm run electron:build
```

The built application will be available in the `dist` directory.

## Mobile Application

Invoicing Genius is also available as a mobile application for Android and iOS.

### Installation

- Android: Download from [Google Play Store](https://play.google.com/store)
- iOS: Download from [Apple App Store](https://apps.apple.com)

### Building from Source

To build the mobile application from source:

```sh
# Install dependencies
npm install

# Build the React application
npm run build

# Sync with Capacitor
npm run capacitor:sync

# Build for Android
npm run capacitor:build:android

# Build for iOS
npm run capacitor:build:ios
```

## Development

### Prerequisites

- Node.js (v16 or later)
- npm (v7 or later)

### Setup

```sh
# Clone the repository
git clone https://github.com/yourusername/invoicing-genius.git

# Navigate to the project directory
cd invoicing-genius

# Install dependencies
npm install

# Start the development server
npm run dev
```

### Desktop Development

```sh
# Start the development server with Electron
npm run electron:dev
```

### Mobile Development

```sh
# Start the development server
npm run dev

# Run on Android
npm run capacitor:run:android

# Run on iOS
npm run capacitor:run:ios
```

## Technologies Used

- **Frontend**: React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (Authentication, Database, Storage)
- **Desktop**: Electron
- **Mobile**: Capacitor
- **Payment Processing**: Stripe
- **Offline Support**: IndexedDB, Service Workers
- **Internationalization**: i18next

## License

This project is licensed under the MIT License - see the LICENSE file for details.
