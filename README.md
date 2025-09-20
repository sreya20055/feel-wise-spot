# BlindSpot

**Your accessible wellbeing & learning companion** 🌟

BlindSpot is an innovative mental health and wellbeing platform that combines mood tracking, AI-powered support, micro-learning courses, and accessibility-first design. Built with React, TypeScript, and modern AI services, it provides a comprehensive digital companion for mental health support.

![BlindSpot Banner](https://img.shields.io/badge/Mental%20Health-Accessibility%20First-blue?style=for-the-badge)

## ✨ Key Features

### 🧠 AI-Powered Companion "Sage"
- **Intelligent Conversations**: Powered by Google Gemini AI for contextual, empathetic responses
- **Video Avatar**: Tavus AI integration for face-to-face conversations with an AI companion
- **Voice Interaction**: Full speech-to-text and text-to-speech capabilities
- **Crisis Detection**: Automatic detection of mental health emergencies with immediate resource provision
- **Personalized Support**: Adapts responses based on mood history and learning progress

### 📊 Comprehensive Mood Tracking
- Daily mood check-ins with 1-10 scale
- Mood history visualization with charts and analytics
- AI-generated insights and coping suggestions
- Progress tracking over time
- Export capabilities for healthcare providers

### 📚 Micro-Learning Courses
- Bite-sized mental health and wellbeing courses (2-3 minutes each)
- Adaptive learning paths based on mood and progress
- Interactive content with progress tracking
- Evidence-based therapeutic techniques
- Achievement system and progress badges

### ♿ Accessibility-First Design
- **Dyslexia Support**: OpenDyslexic font option
- **Visual Accessibility**: High contrast mode, adjustable text sizes
- **Motor Accessibility**: Large touch targets, keyboard navigation
- **Cognitive Accessibility**: Simple language, clear instructions
- **Screen Reader Compatible**: ARIA labels and semantic HTML

### 👥 Community Features
- Safe, moderated peer support spaces
- Anonymous sharing options
- Resource sharing and recommendations
- Crisis support network

### 📈 Analytics & Insights
- Personal wellbeing dashboard
- Mood trend analysis
- Learning progress tracking
- Personalized recommendations
- Data export for healthcare integration

## 🚀 Technology Stack

### Frontend Framework
- **React 18** - Modern React with hooks and concurrent features
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and development server
- **React Router** - Client-side routing

### UI & Design
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality, accessible React components
- **Radix UI** - Unstyled, accessible UI primitives
- **Framer Motion** - Smooth animations and transitions
- **Lucide React** - Beautiful, customizable icons

### AI & Machine Learning
- **Google Gemini Pro** - Advanced language model for conversations
- **Tavus AI** - Video avatar generation and management
- **ElevenLabs** - Natural voice synthesis
- **Browser Speech API** - Voice recognition capabilities

### Data & Backend
- **Supabase** - PostgreSQL database with real-time subscriptions
- **Supabase Auth** - User authentication and authorization
- **TanStack Query** - Efficient data fetching and caching

### Charts & Analytics
- **Recharts** - Composable charting library
- **Chart.js** - Flexible charting for complex visualizations
- **Date-fns** - Date manipulation and formatting

### Development Tools
- **ESLint** - Code linting and style enforcement
- **PostCSS** - CSS processing and optimization
- **Autoprefixer** - Automatic CSS vendor prefixing

## 🛠️ Installation & Setup

### Prerequisites
- **Node.js** (version 16 or higher)
- **npm** or **yarn** package manager
- **Git** for version control

### Quick Start

```bash
# Clone the repository
git clone https://github.com/your-username/blindspot.git

# Navigate to the project directory
cd blindspot

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start the development server
npm run dev
```

### Environment Configuration

Create a `.env` file in the root directory with the following variables:

```bash
# Tavus AI Video Avatar
VITE_TAVUS_API_KEY=your_tavus_api_key_here

# ElevenLabs Voice Generation
VITE_ELEVENLABS_API_KEY=your_elevenlabs_api_key_here

# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Application Configuration
VITE_APP_NAME=BlindSpot
VITE_APP_VERSION=1.0.0
```

### Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run build:dev    # Build for development
npm run preview      # Preview production build

# Code Quality
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript type checking
```

## 🏗️ Project Structure

```
blindspot/
├── public/                 # Static assets
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── ui/           # shadcn/ui components
│   │   └── ...           # Custom components
│   ├── contexts/         # React contexts (Auth, Accessibility)
│   ├── hooks/            # Custom React hooks
│   ├── integrations/     # Third-party service integrations
│   ├── pages/            # Route components
│   ├── services/         # Business logic and API calls
│   ├── utils/            # Utility functions
│   └── types/            # TypeScript type definitions
├── supabase/             # Database migrations and config
└── docs/                 # Documentation files
```

## 🔧 Configuration

### Database Setup (Supabase)

1. Create a new Supabase project
2. Run the provided SQL migrations in `/supabase`
3. Configure Row Level Security (RLS) policies
4. Add your Supabase URL and anon key to `.env`

### AI Service Setup

#### Google Gemini (Built-in)
- The Gemini API key is pre-configured for development
- For production, obtain your own API key from Google AI Studio

#### Tavus AI Video Avatar
1. Sign up at [Tavus.io](https://www.tavus.io)
2. Create a replica (AI avatar)
3. Note your replica ID and persona ID
4. Add your API key to `.env`

#### ElevenLabs Voice
1. Create an account at [ElevenLabs](https://elevenlabs.io)
2. Generate an API key
3. Add the key to your `.env` file

## 🚦 Usage

### For Users
1. **Sign Up/Login** - Create an account or sign in
2. **Complete Onboarding** - Set accessibility preferences
3. **Daily Mood Check-in** - Track your emotional wellbeing
4. **Explore Courses** - Learn new coping strategies
5. **Chat with Sage** - Get AI-powered support anytime
6. **View Progress** - Monitor your wellbeing journey

### For Developers
1. **Component Development** - Use shadcn/ui components
2. **Service Integration** - Follow established patterns in `/services`
3. **Database Changes** - Update Supabase migrations
4. **AI Features** - Extend aiCompanionService.ts
5. **Accessibility** - Test with screen readers and accessibility tools

## 🛡️ Privacy & Security

- **End-to-End Encryption** for sensitive data
- **HIPAA-Compliant** data handling practices
- **Anonymous Usage** options available
- **Local Data Storage** for offline functionality
- **Secure API** endpoints with proper authentication

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Ensure accessibility compliance
6. Submit a pull request

### Code Standards
- Follow TypeScript best practices
- Use semantic HTML and ARIA attributes
- Test with screen readers
- Maintain high contrast ratios
- Document new features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Mental Health Professionals** who provided guidance on therapeutic approaches
- **Accessibility Advocates** who helped ensure inclusive design
- **Beta Testers** who provided valuable feedback
- **Open Source Community** for the amazing tools and libraries

## 📞 Support

### For Users
- **In-App Help** - Available in the accessibility menu
- **Crisis Resources** - Automatically provided when needed
- **Community Support** - Peer support in community spaces

### For Developers
- **Documentation** - Comprehensive guides in `/docs`
- **Issues** - Report bugs or request features on GitHub
- **Discussions** - Join community discussions

## 🔮 Roadmap

- [ ] **Mobile Apps** - Native iOS and Android applications
- [ ] **Healthcare Integration** - FHIR compatibility for provider systems
- [ ] **Advanced Analytics** - ML-powered insights and predictions
- [ ] **Multi-language Support** - Internationalization for global users
- [ ] **Therapist Portal** - Tools for mental health professionals
- [ ] **Family/Caregiver Dashboard** - Support for care networks

---

**Built with ❤️ and accessibility in mind**

*BlindSpot - Making mental health support accessible to everyone*
