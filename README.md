# Harmony Hub: Personalized Audio for Hearing Accessibility

![Harmony Hub](/public/images/hearingheroes.png)

Harmony Hub is a specialized web application designed to enhance the music listening experience for individuals with hearing impairments, particularly those with tinnitus. By leveraging the Web Audio API and advanced audio processing techniques, the platform offers customizable equalization settings, personalized tinnitus relief, and an accessible audio player interface.

## 🎧 Features

### Interactive Equalizer with Real-time Visualization
- Dynamic frequency response curve that updates in real-time
- Drag-and-drop control points to adjust specific frequency bands
- Double-click points to adjust Q-value (width of frequency effect)
- Support for both visual and numerical feedback

### Tinnitus Calibration & Relief
- Step-by-step wizard based on clinical research
- Frequency matching to identify specific tinnitus frequencies
- Creates personalized "notch filter" presets for tinnitus relief
- Based on evidence-backed notched sound therapy techniques

### Split Ear Mode
- Configure different EQ settings for each ear
- Independent preset selection for left and right ears
- Separate frequency response visualization for each channel
- Balance control for asymmetric hearing needs

### Preset Management
- Built-in presets designed for common hearing profiles
- Save and manage custom user presets
- Specialized tinnitus presets created through calibration
- Cloud sync to access your settings on any device

### User Experience
- Responsive design that works on desktop and mobile
- Guide tooltips and onboarding for first-time users
- Accessibility-focused interface

## 🛠️ Architecture

### Frontend Architecture

The application follows a component-based architecture using React with Next.js and TypeScript. Key architectural elements include:

#### Core Audio Processing Engine

At the heart of Harmony Hub is the `AudioEngine` class, which encapsulates all interactions with the Web Audio API:

```typescript
// Simplified representation of the audio engine architecture
class AudioEngine {
  // Audio nodes for processing
  private nodes: AudioNodes = {
    context: null,        // AudioContext
    source: null,         // MediaElementSourceNode
    filters: [],          // Unified mode filter chain
    leftFilters: [],      // Left ear filter chain
    rightFilters: [],     // Right ear filter chain
    splitter: null,       // ChannelSplitterNode
    merger: null,         // ChannelMergerNode
    leftGain: null,       // Left channel gain control
    rightGain: null       // Right channel gain control
  };

  // Main methods
  public async initialize(): Promise<boolean>;
  public setEQEnabled(enabled: boolean): void;
  public setSplitEarMode(enabled: boolean): void;
  public applyUnifiedPreset(preset: Preset): void;
  public applyLeftEarPreset(preset: Preset): void;
  public applyRightEarPreset(preset: Preset): void;
  public getFrequencyResponse(): FrequencyResponseData;
}
```

The engine dynamically constructs different audio processing graphs depending on the selected mode:

1. **Unified Mode**: 
   ```
   AudioSource → EQ Filters → AudioDestination
   ```

2. **Split Ear Mode**:
   ```
   AudioSource → Splitter → [Left Filters → Left Gain] → Merger → AudioDestination
                          → [Right Filters → Right Gain] → 
   ```

#### State Management

The application uses React's Context API and custom hooks to manage state:

- **User Settings**: Managed through `useLocalStorage` hook with Firebase sync
- **Audio State**: Handled by `useAudioContext` custom hook
- **Presets Management**: Controlled via `useEQPresets` hook

#### Component Hierarchy

```
PlayerContainer
├── AudioEngine
├── EQVisualization
├── PlayerControls
├── EQControls
├── Presets / SplitEarControls
├── CalibrationWizard
└── CloudSyncDialog
```

### Backend Services

The application uses Firebase for authentication and data storage:

- **Authentication**: Firebase Auth with email and Google sign-in
- **Database**: Firestore collections for user presets and settings
- **Storage Rules**: Secure rules to ensure user data isolation

## 🧪 Research Foundation

The tinnitus relief features are based on peer-reviewed research in notched sound therapy:

1. **Notched Sound Therapy**: The calibration wizard creates customized audio filters that reduce energy at the specific frequency of a user's tinnitus. This approach is based on research by Okamoto et al. (2010) showing that "tailor-made notched music reduces tinnitus loudness."

2. **Individualized Approach**: The system creates personalized presets based on precise frequency matching, with control over notch depth and width, following principles established in research by Pantev et al. (2012).

3. **Neuroplasticity Targeting**: The underlying mechanism targets neuroplastic changes in the auditory cortex through consistent exposure to specially-modified audio, potentially providing long-term relief rather than just masking.

## 🚀 Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or yarn
- Firebase project (for authentication and database features)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/username/harmony-hub.git
   cd harmony-hub
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a `.env.local` file with your Firebase configuration:
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

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build
npm run start
# or
yarn build
yarn start
```

## 💡 Technical Implementation Details

### Interactive EQ Visualization

The EQ visualization component is built on the HTML Canvas API with optimizations for performance:

- **Multi-layered Canvas**: Uses separate canvas layers for background grid, curve rendering, and interactive points to minimize redraws
- **Frequency Scaling**: Custom logarithmic scaling to better represent audio frequencies as perceived by humans
- **Optimized Rendering**: Throttling and debouncing techniques to maintain smooth performance during interactions
- **High-DPI Support**: Pixel ratio adjustments for crisp rendering on high-resolution displays

### Web Audio API Integration

The audio processing is built entirely on the Web Audio API with several advanced techniques:

- **Dynamic Audio Routing**: Reconfigurable audio graphs to support different modes
- **Parametric EQ Filters**: BiquadFilter nodes with adjustable frequency, gain, and Q-factor
- **Real-time Analysis**: Frequency response calculation and visualization
- **Smooth Transitions**: Parameter automation for click-free changes to audio settings

### Tinnitus Calibration Logic

The calibration process employs a systematic approach:

1. **Frequency Matching**: Interactive tone generator to identify tinnitus frequency
2. **Fine-tuning**: Precise adjustments with visual feedback
3. **Filter Creation**: Automated generation of appropriate notch filters
4. **Preset Generation**: Storing calibrated settings for future use

### Performance Optimizations

- **Memoized Components**: React.memo and useMemo for expensive calculations
- **Lazy Loading**: Dynamic imports for non-critical components
- **Throttled Updates**: Preventing excessive renders during user interactions
- **Audio Context Management**: Careful handling of AudioContext creation and disposal

## 🌐 Project Structure

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
```

## 💭 Development Backstory

Harmony Hub was developed for our UW Informatics 2025 Capstone Project in response to the growing need for accessible audio solutions, particularly for the millions of people worldwide who experience tinnitus (estimated at 10-15% of adults).

### Problem Identification

The project began with research into the challenges faced by individuals with hearing impairments when enjoying music:

1. **Standard EQs are inadequate**: Most music apps offer basic EQ presets that don't address specific hearing needs
2. **Tinnitus interference**: Constant ringing or buzzing sounds can significantly detract from music enjoyment
3. **Asymmetric hearing needs**: Many people experience different hearing levels or tinnitus in each ear

### Design Principles

Several core principles guided the development process:

1. **Evidence-based approach**: Features grounded in peer-reviewed research
2. **User control**: Providing intuitive tools for personalization rather than black-box solutions
3. **Progressive enhancement**: Core functionality works without accounts, cloud features enhance experience
4. **Performance first**: Optimized for real-time audio processing with minimal latency
5. **Mobile accessibility**: Responsive design that works across devices

### Technical Challenges

Several significant challenges were overcome during development:

1. **Audio API Limitations**: Handling browser-specific differences in Web Audio API implementation
2. **Split-channel Processing**: Creating an efficient architecture for independent ear processing
3. **Calibration Accuracy**: Building a user-friendly but precise frequency matching system
4. **State Synchronization**: Maintaining consistency between audio state and UI components

## 👥 Team

This project was developed by the Hearing Heroes team for INFO Capstone 2024-2025 at the University of Washington:

- Lewis Going - [@lewisgoing](https://github.com/lewisgoing)
- Bella Gatz - [@bella-gatz](https://github.com/bella-gatz)
- Paul Garces - [@paulgarces](https://github.com/paulgarces)
- Nathaniel Sayasack - [LinkedIn](https://www.linkedin.com/in/nathaniel-sayasack-86488821a/)
- Brooke Pedersen - [LinkedIn](https://www.linkedin.com/in/brooke-pedersen-66a9a8227/)

## 📝 License

This project is proprietary software. See the [LICENSE](LICENSE) file for details.

## 🔮 Future Development

We're actively working on several future enhancements:

- **Advanced Calibration Algorithm**: More sophisticated tinnitus frequency detection
- **Machine Learning Integration**: Personalized preset suggestions based on user preferences
- **External Service Integration**: Support for third party streaming platforms
- **Community Features**: Sharing and discovering presets created by other users

## 🙏 Acknowledgements

- Research foundation: Prof. Christo Pantev and his team's work on notched sound therapy
- University of Washington Information School for supporting the Capstone program
- The shadcn/ui team for the component library

---

For any questions or suggestions, please open an issue or contact us at lgoing7@uw.edu.