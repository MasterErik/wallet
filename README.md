# 🚀 TON DApp Vue Template

## Wallet
- **mnemonic**: try uphold target ginger evolve attitude rather renew journey cradle door degree pioneer
  fade way open young post parent tissue normal drink error language
- **address**: kQAKJc4h-Xpnj7p2R-SPZsCKWsCMqFV2BHPmXVrE2eqtfBcu

## Test Wallet
- **mnemonic*: mix pull wagon pave believe venture mirror baby mom brave fuel wool upgrade spirit give syrup swallow
  feed swap suspect hidden social resist easy
- **address**: kQATCjGpJRgV5om4c_p-xIeLo5zSupGwiTqAZU64NjgNL3eU
               
![Vue.js](https://img.shields.io/badge/Vue.js-35495E?style=for-the-badge&logo=vue.js&logoColor=4FC08D)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![TON](https://img.shields.io/badge/TON-0078FF?style=for-the-badge&logo=ton&logoColor=white)
![GitHub_Pages](https://img.shields.io/badge/GitHub_Pages-222222?style=for-the-badge&logo=github&logoColor=white)

## 🌟 Features

- **Vue.js**: Build reactive and powerful UIs with the Vue.js framework.
- **TON Integration**: Easily connect and interact with the TON blockchain.
- **Tailwind CSS**: Utility-first CSS framework for rapidly building custom designs.
- **GitHub Pages Deployment**: Automatically deploy your app with GitHub Actions.

Explore these resources to extend and deepen your integration with TON and Telegram.

## 🛠️ Getting Started

### Prerequisites

- **Node.js**: Ensure you have Node.js version 20 or higher installed. 
- **NVM (Node Version Manager) (optional)**: Recommended for managing Node.js versions. If you don't use NVM, ensure you manually switch to Node.js version 20 or higher.

### Installation

1. **Clone the repository**:
    ```bash
    git clone https://github.com/MasterErik/wallet.git
    cd wallet
    ```

2. **Set the Node.js version** (if using NVM):
    ```bash
    nvm use
    ```

3. **Install dependencies**:
    ```bash
    npm install
    ```

4. **Set up environment variables**:
    ```bash
    cp .env.example .env
    ```

5. **Edit the `.env` file**:
    - Open the `.env` file and replace the placeholder values with your actual environment variables.

6. **Run the development server**:
    ```bash
    npm run dev
    ```

### 🧪 Running Tests

This project includes unit/component tests (Vitest) and end-to-end (E2E) tests (Playwright).

*   **Unit and Component Tests (Vitest)**:
    ```bash
    npm run test
    # Or, for watch mode during development:
    # npx vitest
    # Or, with UI:
    # npx vitest --ui
    ```

*   **End-to-End Tests (Playwright)**:
    ```bash
    npx playwright test
    # Or, with UI for debugging:
    # npx playwright test --ui
    # Or, with visible browser window:
    # npx playwright test --headed
    ```
    *Note: If running Playwright for the first time, you might need to install browser binaries: `npx playwright install`*

### 🌍 Deployment

This project includes a GitHub Actions workflow that automates deployment to GitHub Pages. To deploy your project:

1. **Activate GitHub Pages**:
   - Go to your GitHub repository settings.
   - Under the **Pages** section, select the `GitHub Actions` branch as the source for build and deployment and save the settings.

2. **Configure production environment variables**:
   - Edit the `.env.production` file with the necessary environment variables for your production setup.

3. **Push to the `main` branch**:
   - The GitHub Actions workflow triggers on every push to `main` and will deploy the app to GitHub Pages automatically.

## 📚 Documentation & References

This project leverages several powerful libraries and SDKs:

- **TON SDK**: [@ton/ton](https://github.com/ton-blockchain/ton)
- **TON Core**: [@ton/core](https://github.com/ton-core/ton-core)
- **TON Crypto**: [@ton/crypto](https://github.com/ton-core/ton-crypto)

## 🤝 Contributing

Contributions are welcome! Feel free to fork the project, submit a pull request, or open an issue for any changes or improvements.

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more information.
