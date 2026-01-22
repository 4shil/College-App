// Environment variables configuration
// Create a .env file with these variables for local development
// For production, set these in your EAS build configuration

module.exports = {
  expo: {
    name: "JPM College",
    slug: "jpm-college-app",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    scheme: "jpmcollege",
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#FFFFFF",
      dark: {
        image: "./assets/splash-icon-dark.png",
        resizeMode: "contain",
        backgroundColor: "#0F0F1A"
      }
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.jpmcollege.app"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        monochromeImage: "./assets/adaptive-icon-mono.png",
        backgroundColor: "#0F0F1A"
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: "com.jpmcollege.app"
    },
    web: {
      favicon: "./assets/favicon.png",
      bundler: "metro"
    },
    plugins: [
      "expo-router",
      "expo-font"
    ],
    extra: {
      router: {},
      eas: {
        projectId: "28170231-fe6a-494b-8fc3-49ce78ced287"
      },
      // Supabase configuration - use environment variables in production
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || "https://celwfcflcofejjpkpgcq.supabase.co",
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNlbHdmY2ZsY29mZWpqcGtwZ2NxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyNjEzNTQsImV4cCI6MjA3OTgzNzM1NH0.hDdQIjIy5fkmdXV2GjWlATujnXgVcXZD932_k1KvLwA"
    },
    owner: "jpm-college-app"
  }
};
