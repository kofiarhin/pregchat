# PregChat

A comprehensive pregnancy wellness chatbot that provides personalized support, daily updates, and expert guidance throughout your pregnancy journey.

## 🌟 Live Demo

Experience PregChat live: [https://pregchat-7b9avnnvw-kofi-arhins-projects.vercel.app](https://pregchat-7b9avnnvw-kofi-arhins-projects.vercel.app)

## ✨ Features

- **Personalized Daily Updates**: Get tailored content based on your pregnancy stage
- **AI-Powered Chat**: Intelligent conversations with pregnancy experts
- **User Authentication**: Secure login and registration system
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Real-time Support**: Instant responses to your pregnancy questions
- **Progress Tracking**: Monitor your pregnancy journey day by day
- **Personal Journals**: Create, edit, and delete daily reflections that stay private to each user
- **Midwife Bookings**: Browse midwives, check availability, and book or cancel appointments in London time

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- MongoDB
- npm or yarn

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/kofiarhin/pregchat.git
   cd pregchat
   ```

2. **Install dependencies**

   ```bash
   # Install server dependencies
   npm install

   # Install client dependencies
   cd client
   npm install
   cd ..
   ```

3. **Environment Setup**

   ```bash
   # Copy environment file
   cp .env.example .env

   # Update the .env file with your configuration
   # Add your MongoDB URI, JWT secret, and other required variables
   ```

4. **Start the Application**

   ```bash
   # Start the server
   npm run dev

   # In another terminal, start the client
   cd client
   npm run dev
   ```

5. **Access the Application**
   - Open [http://localhost:3000](http://localhost:3000) in your browser

## 🛠️ Tech Stack

### Frontend

- **React** - UI framework
- **Redux Toolkit** - State management
- **React Router** - Client-side routing
- **SCSS** - Styling
- **Vite** - Build tool

### Backend

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcrypt** - Password hashing

### AI Integration

- **OpenAI API** - Chat functionality
- **Custom AI Models** - Pregnancy-specific responses

## 📁 Project Structure

```
pregchat/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── store/         # Redux store and slices
│   │   └── styles/        # Global styles
│   ├── public/            # Static assets
│   └── package.json
├── server/                 # Node.js backend
│   ├── config/            # Configuration files
│   ├── controllers/       # Route controllers
│   ├── middleware/        # Custom middleware
│   ├── models/           # MongoDB models
│   ├── routes/           # API routes
│   └── server.js         # Server entry point
├── .env.example          # Environment variables template
├── package.json          # Root package.json
└── README.md            # This file
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/pregchat

# JWT
JWT_SECRET=your_jwt_secret_here

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Server
PORT=5000
NODE_ENV=development

# Client
VITE_API_URL=http://localhost:5000/api
```

## 📱 Usage

1. **Register/Login**: Create an account or log in to access personalized features
2. **Daily Updates**: View pregnancy updates based on your current day
3. **Chat Support**: Ask questions and get AI-powered responses
4. **Track Progress**: Monitor your pregnancy journey

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Kofi Arhin** - _Initial work_ - [GitHub](https://github.com/kofiarhin) | [Twitter](https://x.com/kwofiArhin)
- **Socielas** - _Contributor_

## 🙏 Acknowledgments

- Pregnancy experts and medical professionals for content guidance
- OpenAI for AI capabilities
- The open-source community for amazing tools and libraries

## 📞 Support

If you have any questions or need help:

- Open an issue on GitHub
- Contact us through the live demo
- Check our documentation for more details

---

**Made with ❤️ for expecting parents everywhere**
