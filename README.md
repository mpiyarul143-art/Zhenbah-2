<div align="center">
  <img src="./public/osfiesta.png" alt="Open Fiesta Banner" width="800"/>
</div>

<h1 align="center">Open Fiesta</h1>

<p align="center">
  The ultimate open-source playground for comparing multiple AI models side-by-side
</p>

<p align="center">
  <a href="https://github.com/Xenonesis/Open-Fiesta-Clone/stargazers">
    <img src="https://img.shields.io/github/stars/Xenonesis/Open-Fiesta-Clone" alt="GitHub Stars">
  </a>
  <a href="https://github.com/Xenonesis/Open-Fiesta-Clone/issues">
    <img src="https://img.shields.io/github/issues/Xenonesis/Open-Fiesta-Clone" alt="GitHub Issues">
  </a>
  <a href="https://github.com/Xenonesis/Open-Fiesta-Clone/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/Xenonesis/Open-Fiesta-Clone" alt="License">
  </a>
  <a href="https://github.com/Xenonesis/Open-Fiesta-Clone/pulls">
    <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs Welcome">
  </a>
</p>

<div align="center">
  <video controls poster="./public/osfiesta.png" width="800">
    <source src="./public/OSFiesta.mp4" type="video/mp4" />
    <a href="./public/OSFiesta.mp4">
      <img src="./public/osfiesta.png" alt="Open-Fiesta preview" />
    </a>
    Your browser does not support the video tag.
  </video>
</div>

## 🎯 What is Open Fiesta?

Open Fiesta is a cutting-edge, open-source AI playground that allows you to experiment with and compare multiple AI models side-by-side. Unlike traditional chat interfaces, Open Fiesta enables you to run up to 5 different AI models simultaneously, compare their outputs, and find the best response for your specific needs.

Built with Next.js 15, TypeScript, and Tailwind CSS, Open Fiesta provides a modern, responsive interface with real-time streaming capabilities and a clean, intuitive UI.

## ✨ Key Features

### Multi-Model Comparison
- Compare outputs from up to 5 different AI models simultaneously
- Supports a wide range of providers including Gemini, OpenRouter, and more
- Easily identify the best response for your specific use case

### Extensive Model Support
- **Gemini Models**: Gemini 2.5 Pro, Gemini 2.5 Flash
- **OpenRouter Models**: 
  - DeepSeek R1 (free)
  - Llama 3.3 70B Instruct (free)
  - Qwen 2.5 72B Instruct (free)
  - Mistral Small 24B Instruct 2501 (free)
  - Moonshot Kimi K2 (free)
  - Reka Flash 3 (free)
  - GLM 4.5 Air (free/paid)
  - And many more...

### Advanced Capabilities
- **Web Search Integration**: Toggle web search per message for real-time information
- **Image Attachment Support**: Upload and analyze images with compatible models
- **Real-time Streaming**: Experience blazing-fast responses with normalized APIs
- **Project Organization**: Organize conversations into projects with custom system prompts
- **Clean UI**: Keyboard shortcuts, responsive design, and intuitive interface

### Developer-Friendly
- **Self-Hostable**: Fully open-source and customizable
- **Docker Support**: Comprehensive containerization for easy deployment
- **API Normalization**: Consistent responses across different providers
- **Post-Processing**: Automatic cleanup of model-specific formatting

## 🚀 Quick Start

### Option 1: Traditional Development

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
Create a `.env.local` file with your API keys:
```bash
# OpenRouter (recommended for most free models)
OPENROUTER_API_KEY=your_openrouter_api_key

# Gemini (for Gemini models and image input)
GOOGLE_GENERATIVE_AI_API_KEY=your_google_api_key
```

3. Run the development server:
```bash
npm run dev
# Open http://localhost:3000 in your browser
```

### Option 2: Docker Development

1. Development with Docker Compose (recommended):
```bash
npm run docker:dev
# or
docker-compose up ai_fiesta_dev
```

2. Production build with Docker:
```bash
npm run docker:build
npm run docker:run
# or
docker-compose up ai_fiesta
```

### Option 3: Manual Docker Commands

```bash
# Build the image
docker build -t ai_fiesta .

# Run the container
docker run -p 3000:3000 -e OPENROUTER_API_KEY=your_key_here ai_fiesta

# Run with environment file
docker run -p 3000:3000 --env-file .env.local ai_fiesta
```

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui, Lucide React Icons
- **Backend**: Next.js API Routes
- **State Management**: React Context API
- **Styling**: Tailwind CSS with custom themes
- **Deployment**: Docker, Vercel-ready
- **Additional Libraries**: Framer Motion, React Toastify

## 🏗️ Project Structure

```
app/
├── api/                 # API routes for different providers
│   ├── gemini/          # Gemini provider integration
│   └── openrouter/      # OpenRouter provider integration
├── chat/                # Chat interface
└── ...                  # Other Next.js app routes

components/
├── app/                 # Main application components
├── chat/                # Chat-specific components
├── ui/                  # Reusable UI components (shadcn/ui)
└── ...                  # Other component categories

lib/
├── models.ts            # Model catalog and configuration
├── themeContext.ts      # Theme management
└── ...                  # Utility functions and helpers

public/                  # Static assets
```

## 🌐 Supported Providers

| Provider | Models | Features |
|---------|--------|----------|
| **Google Gemini** | Gemini 2.5 Pro, Flash | Image input, fast responses |
| **OpenRouter** | 20+ models including: | Free tiers, wide selection |
| | - DeepSeek R1 | Reasoning capabilities |
| | - Llama 3.3 70B | High-quality responses |
| | - Qwen 2.5 72B | Multilingual support |
| | - Mistral Small | Efficient performance |
| | - And many more... | |

## 🔧 Environment Variables

| Variable | Description | Required |
|---------|-------------|----------|
| `OPENROUTER_API_KEY` | API key from [OpenRouter](https://openrouter.ai) | For OpenRouter models |
| `GOOGLE_GENERATIVE_AI_API_KEY` | API key from [Google AI Studio](https://aistudio.google.com) | For Gemini models |

You can also provide API keys at runtime through the UI's Settings panel.

## 🐳 Docker Support

Open Fiesta includes comprehensive Docker support for both development and production:

### Development
- Hot reload enabled for instant code changes
- Volume mounting for live code updates
- Includes all development dependencies

### Production
- Multi-stage build for optimized image size (~100MB)
- Security best practices with non-root user
- Environment variable configuration support

### Available Docker Commands
```bash
npm run docker:build    # Build production Docker image
npm run docker:run      # Run production container
npm run docker:dev      # Start development environment with Docker Compose
npm run docker:prod     # Start production environment with Docker Compose
```

## 🤝 Contributing

We welcome contributions of all kinds! Here's how you can help:

1. **Fork** the repository
2. Create a **feature branch** (`git checkout -b feat/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feat/amazing-feature`)
5. Open a **Pull Request**

### Development Guidelines
- Follow TypeScript best practices
- Maintain consistent code style with ESLint
- Write clear, descriptive commit messages
- Test your changes thoroughly
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgements

- Model access via [OpenRouter](https://openrouter.ai) and [Google AI](https://ai.google.com)
- UI components from [shadcn/ui](https://ui.shadcn.com)
- Icons from [Lucide](https://lucide.dev)
- Inspired by the need for better AI model comparison tools

## 📬 Support

If you encounter any issues or have questions:
- Check [existing issues](https://github.com/Xenonesis/Open-Fiesta-Clone/issues) 
- [Open a new issue](https://github.com/Xenonesis/Open-Fiesta-Clone/issues/new) for bug reports or feature requests
- Feel free to reach out to the maintainer at [Xenonesis](https://github.com/Xenonesis)

---

<div align="center">
  Made with ❤️ by <a href="https://github.com/Xenonesis">Xenonesis</a>
</div>