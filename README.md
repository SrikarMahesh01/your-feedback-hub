# yoUR Feedback Hub

Online Feedback and Grievance Management System for Usha Rama College of Engineering and Technology

## 🎯 Overview

yoUR Feedback Hub is a comprehensive role-based platform that streamlines the process of submitting, managing, and reviewing student complaints, feedback, and suggestions. The system enhances transparency, accountability, and responsiveness across all academic departments.

## 🚀 Features

### Student Portal
- Submit grievances and feedback
- Track complaint status in real-time
- Fill targeted feedback forms
- Access anonymous feedback forms
- View submission history

### Admin Portal (HOD)
- Manage department-specific grievances
- Create targeted feedback forms
- View and respond to student submissions
- Monitor department metrics
- Create anonymous feedback forms

### Super Admin Portal
- System-wide oversight and control
- Manage all users and departments
- View comprehensive analytics
- Create and manage admin accounts
- Monitor system performance

## 🛠 Tech Stack

- **Frontend**: React + TypeScript
- **UI Framework**: Ant Design (Light Theme)
- **Backend**: Firebase (Authentication + Firestore)
- **Automation**: n8n Webhooks
- **Hosting**: Firebase Hosting / Vercel

## 📦 Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd your-feedback-hub
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```
Fill in your Firebase configuration and n8n webhook URL.

4. Start the development server:
```bash
npm run dev
```

## 🔧 Firebase Setup

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com)

2. Enable Authentication:
   - Go to Authentication > Sign-in method
   - Enable Email/Password authentication

3. Create Firestore Database:
   - Go to Firestore Database
   - Create database in production mode
   - Set up security rules (see `firestore.rules`)

4. Get your Firebase configuration:
   - Go to Project Settings > General
   - Add a web app and copy the configuration
   - Update `src/config/firebase.ts` with your config

## 📊 Database Structure

### Collections

- **users**: User profiles with role-based access
- **grievances**: Student complaints and feedback
- **feedback_forms**: Forms created by admins
- **feedback_responses**: Student responses to forms
- **anonymous_forms**: Public anonymous feedback forms
- **anonymous_responses**: Anonymous form submissions

## 🔐 User Roles

### Student
- Self-registration with college details
- Submit and track grievances
- Fill feedback forms
- Access anonymous forms

### Admin (HOD)
- Department-specific access
- Manage grievances and forms
- Create targeted feedback forms
- View department analytics

### Super Admin
- Full system control
- Manage all users and departments
- System-wide analytics
- Create admin accounts

## 🌐 Deployment

### Firebase Hosting

1. Install Firebase CLI:
```bash
npm install -g firebase-tools
```

2. Login and initialize:
```bash
firebase login
firebase init hosting
```

3. Build and deploy:
```bash
npm run build
firebase deploy
```

### Vercel

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy:
```bash
vercel --prod
```

## 🔗 n8n Integration

The system sends webhook notifications to n8n for:
- New grievance submissions
- Status updates
- Form responses
- System alerts

Configure your n8n webhook URL in the environment variables.

## 🎨 Customization

### Theming
- Primary color: `#1677ff` (Ant Design Blue)
- Modify `src/index.css` for custom styles
- Update Ant Design theme in `src/App.tsx`

### Departments
- Update `src/types/index.ts` to modify department list
- Ensure consistency across all components

## 📝 Demo Accounts

For testing purposes, create these accounts in Firebase:

- **Student**: student@urcet.edu
- **HOD (CSE)**: hod.cse@urcet.edu  
- **Super Admin**: admin@urcet.edu

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

---

Built with ❤️ for Usha Rama College of Engineering and Technology