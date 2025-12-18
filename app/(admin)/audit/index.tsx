import { Redirect } from 'expo-router';

export default function AuditIndex() {
  return <Redirect href="/(admin)/audit/logs" />;
}
