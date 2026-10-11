import { NavigationContainer } from '@react-navigation/native';
import Routes from './src/routes/Routes';
import { AuthProvider } from './src/contexts/AuthContext';
import SessionLock from './src/components/SessionLock';

export default function App() {
  return (
    <AuthProvider>
      <>
        <NavigationContainer>
          <Routes />
        </NavigationContainer>
        <SessionLock />
      </>
    </AuthProvider>
  );
}

