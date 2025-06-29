# KYC Mobile App

A cross-platform Know Your Customer (KYC) application built with Angular, Ionic, and Capacitor. Supports web and mobile (Android/iOS) deployment.

## Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 recommended)
- [Ionic CLI](https://ionicframework.com/docs/cli) (optional, for mobile/dev tools)

### Install dependencies
```bash
npm install
```

### Run in development (web)
```bash
npm start
# or
ng serve
```
Visit [http://localhost:4200](http://localhost:4200) in your browser.

### Build for production
```bash
ng build
```

### Run on Android/iOS (Capacitor)
```bash
npx cap sync
npx cap open android   # or ios
```

### Docker (production web)
Build and run the app in a container:
```bash
docker build -t kyc-app .
docker run -p 80:80 kyc-app
```

---

For more, see the [Angular CLI docs](https://angular.dev/tools/cli) and [Ionic docs](https://ionicframework.com/docs).
