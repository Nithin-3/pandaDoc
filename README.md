# PandaDoc

[![Watch the screen recording](https://img.youtube.com/vi/VIDEO_ID/default.jpg)](https://nithin-3.github.io/portfo/galven/pandaDoc.mp4)

## Description

PandaDoc is a privacy-first, anonymous chat application built with Expo (React Native) for Android. The app is cleverly disguised as a document reader and lists documents (PDF, TXT, XML, CSV, JSON, HTML, MD, LOG) available on your device. 

You access a hidden chat interface, allowing you to communicate anonymously with other users. Each user is assigned a unique ID (UID); no personal data is collected or stored.

## Features

- **Anonymous Chat**: Hidden chat interface accessible via document long-press. Chat without revealing your identity—each user has a unique, anonymous UID.
- **Document Reader**: Browse, open, and read various document types (PDF, TXT, XML, CSV, JSON, HTML, MD, LOG) stored on your device. 
- **P2P File Sharing & Streaming**: Share files and stream data directly with peers using secure P2P connections.
- **Socket-based Handshake**: Fast, secure connection establishment for chats and file transfers.
- **Zero Data Collection**: No user data is collected, stored, or tracked—your privacy is guaranteed.
- **User-Friendly, Disguised Interface**: The app appears as a simple document reader, keeping chat features hidden unless intentionally accessed.
- **Copy & Share UID**: Long-press your UID to copy and share it with other users to start a chat.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- Android device or emulator

### Installation

1. Clone this repository:
    ```bash
    git clone https://github.com/Nithin-3/pandaDoc.git
    cd pandaDoc
    ```
2. Install dependencies:
    ```bash
    npm install
    ```
3. Start the Expo server:
    ```bash
    npx expo start
    ```
4. Open the app on your Android device using the Expo Go app, or run it on an emulator.

## Usage

1. Open PandaDoc; your documents are listed by default.
2. Tap to open and read any document.
3. Long-press any document then click any document to access the hidden chat contact list.
4. Long-press your UID to copy it for sharing with others.
5. Add new contacts using other users' UIDs to initiate anonymous chats and file sharing.

## How It Works

- **UID Generation**: Each user is assigned a unique, random UID on first launch. This UID is used for all communication and cannot be linked back to any personal information.
- **No Data Collection**: All messages and file transfers are handled peer-to-peer. No data is stored on external servers.
- **Hidden Features**: The chat interface is only accessible via specific document interactions for added privacy.

## Contributors

- [Nithin-3](https://github.com/Nithin-3)
- [SANTHOSHSIVAM10](https://github.com/SANTHOSHSIVAM10)

## Download

Coming soon: [Download PandaDoc_NOT_READY](your-download-link-here)

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

This project is licensed under the MIT License.
