import { Redirect } from 'expo-router';

export default function Index() {
  // Redirect to login by default
  return <Redirect href="/(auth)/login" />;
}
