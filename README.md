# Harmony Hub

![Harmony Hub Logo](https://github.com/lewisgoing/INFO-capstone-hearingheroes/raw/main/public/logo.png)

Harmony Hub is an innovative web application designed to enhance the music listening experience for adults with hearing impairments. By leveraging advanced audio processing technology, it provides personalized sound adjustments and tinnitus relief through customizable equalization settings.

## Table of Contents

- [Harmony Hub](#harmony-hub)
  - [Table of Contents](#table-of-contents)
  - [Overview](#overview)
  - [Features](#features)
    - [🎚️ Personalized Equalizer](#️-personalized-equalizer)
    - [🔊 Tinnitus Calibration](#-tinnitus-calibration)
    - [👂 Split Ear Mode](#-split-ear-mode)
    - [💾 Presets Management](#-presets-management)
    - [☁️ Cloud Sync](#️-cloud-sync)
    - [🎧 Music Player](#-music-player)
  - [Live Demo](#live-demo)
  - [Technology Stack](#technology-stack)
  - [Installation](#installation)
    - [Prerequisites](#prerequisites)
    - [Setup Steps](#setup-steps)
  - [Usage Guide](#usage-guide)
    - [Getting Started](#getting-started)
    - [Tinnitus Calibration](#tinnitus-calibration)
    - [Split Ear Mode](#split-ear-mode)
  - [Project Structure](#project-structure)
  - [Research Background](#research-background)
  - [Team](#team)
  - [License](#license)
  - [Future Development](#future-development)

## Overview

Harmony Hub aims to bridge the gap between music enjoyment and hearing impairments by providing tools that allow users to personalize their listening experience. Our application particularly focuses on supporting individuals with tinnitus through evidence-based sound therapy approaches integrated into a music player.

The application leverages haptic feedback technology to translate musical elements into vibrations, enabling users to perceive rhythm, bass, melody, and other sound patterns beyond traditional auditory means.

## Features

### 🎚️ Personalized Equalizer
- Interactive EQ with frequency band adjustments
- Double-click points to adjust Q-value (width of frequency adjustments)
- Visual feedback with real-time frequency response curve

### 🔊 Tinnitus Calibration
- Step-by-step wizard to identify your exact tinnitus frequency
- Creates personalized "notch filter" presets based on clinical research
- Evidence-based approach using notched sound therapy techniques

### 👂 Split Ear Mode
- Configure different EQ settings for each ear
- Independent preset selection for left and right ears
- Balance control between channels

### 💾 Presets Management
- Built-in presets designed for common hearing needs
- Custom user presets for personal configurations
- Specialized tinnitus presets created through calibration

### ☁️ Cloud Sync
- Save your settings across devices with cloud sync
- Automatic synchronization when signed in
- Offline functionality with local storage

### 🎧 Music Player
- Play music with your custom EQ settings
- Support for direct audio file URLs
- Seamless integration with EQ adjustments

## Live Demo

Visit our live demo at: [https://hearingheroes.vercel.app/](https://hearingheroes.vercel.app/)

## Technology Stack

- **Frontend:**
  - Next.js 14
  - TypeScript
  - Tailwind CSS
  - Framer Motion for animations
  - Web Audio API for audio processing
  - Shadcn UI components

- **Backend:**
  - Firebase Authentication
  - Firestore for cloud storage
  - Cloud Functions for backend processing

- **CI/CD:**
  - Vercel deployment
  - GitHub Actions

## Installation

### Prerequisites
- Node.js 18.x or higher
- npm or yarn
- Firebase project (for authentication and database features)

### Setup Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/lewisgoing/INFO-capstone-hearingheroes.git
   cd INFO-capstone-hearingheroes
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a `.env.local` file in the root directory with your Firebase configuration:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
   NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id
   ```

4. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Usage Guide

### Getting Started

1. **Explore EQ Settings**: Start by adjusting the equalizer points to match your hearing preferences.
2. **Try Presets**: Test different built-in presets to find a good starting point.
3. **Calibrate for Tinnitus**: Use the calibration wizard to create a personalized tinnitus relief preset.
4. **Save Your Settings**: Create an account to save your custom settings to the cloud.

### Tinnitus Calibration

Our calibration process follows these steps:

1. Identify your tinnitus frequency using test tones
2. Fine-tune to match your exact frequency
3. Adjust the notch depth and width
4. Save your personalized preset

This approach is based on clinically-validated notched sound therapy research, which has shown promising results for tinnitus management.

### Split Ear Mode

If you experience different levels of hearing or tinnitus in each ear:

1. Toggle "Split Ear Mode" in the EQ controls
2. Adjust settings for left and right ears independently
3. Use the balance slider to emphasize one ear if needed

## Project Structure

```
/
├── app/                  # Next.js app router
├── components/           # React components
│   ├── auth/             # Authentication components
│   ├── music-player/     # Music player components
│   ├── ui/               # UI component library (shadcn)
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions and services
│   ├── firebase.ts       # Firebase configuration
│   ├── firestore.ts      # Firestore database functions
├── contexts/             # React context providers
├── public/               # Static assets
├── styles/               # Global styles
```

## Research Background

Harmony Hub's tinnitus relief features are based on peer-reviewed research on notched sound therapy:

- Okamoto et al. (2010) - "Listening to tailor-made notched music reduces tinnitus loudness"
- Pantev et al. (2012) - "Transient auditory plasticity in human auditory cortex induced by tailor-made notched music training"

Our calibration approach combines individualized notched sound therapy with user-adjustable parameters, allowing for personalized settings based on the specific characteristics of each person's tinnitus.

## Team

This project was developed by the Hearing Heroes team for the INFO Capstone 2024-2025 at the University of Washington:

- Lewis Going - [@lewisgoing](https://github.com/lewisgoing)
- [Bella Gatz] - [@bella-gatz](https://github.com/bella-gatz)
- [Paul Garces] - [@paulgarces](https://github.com/paulgarces)
- [Nathaniel Sayasack] - [Nathaniel Sayasack](https://www.linkedin.com/in/nathaniel-sayasack-86488821a/)
- [Brooke Pedersen] - [Brooke Pedersen](https://www.linkedin.com/in/brooke-pedersen-66a9a8227/)

## License

This project is licensed under a proprietary License. See the [LICENSE](LICENSE) file for details.

## Future Development

We're planning several enhancements for future releases:

- **Mobile App**: Native iOS and Android applications
- **YouTube and SoundCloud Integration**: Support for streaming services
- **Advanced Calibration Features**: Further refinement of tinnitus matching
- **Haptic Feedback**: Integration with haptic devices for enhanced sensory experience
- **Personalized Recommendations**: AI-driven suggestions based on user preferences
- **Community Features**: Sharing and discovering presets created by other users

---

Last Updated: March 17, 2025

*Harmony Hub is a project created by Hearing Heroes for the INFO Capstone 2024-2025 at the University of Washington.*