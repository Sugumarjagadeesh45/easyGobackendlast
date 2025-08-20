/**
 * Taxi Booking App
 */
import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar, View, ActivityIndicator } from 'react-native';

// Import your screen components
import WelcomeScreen1 from './src/WelcomeScreen1';
import WelcomeScreen2 from './src/WelcomeScreen2';
import WelcomeScreen3 from './src/WelcomeScreen3';
import WelcomeScreen5 from './src/WelcomeScreen5';
import WelcomeScreen13 from './src/WelcomeScreen13';
import Screen1 from './src/Screen1';

// Define your navigation parameter list
export type RootStackParamList = {
  WelcomeScreen1: undefined;
  WelcomeScreen2: undefined;
  WelcomeScreen3: undefined;
  WelcomeScreen5: undefined;
  WelcomeScreen13: undefined;
  Screen1: { isNewUser?: boolean; phone?: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const App = () => {
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList | null>(null);

  useEffect(() => {
    const checkRegistration = async () => {
      try {
        const isRegistered = await AsyncStorage.getItem('isRegistered');
        // If user is registered (logged in), go to Screen1
        // If not registered or logged out, go to WelcomeScreen3
        setInitialRoute(isRegistered === 'true' ? 'Screen1' : 'WelcomeScreen3');
      } catch (error) {
        console.error('Error reading registration status:', error);
        // Default to WelcomeScreen3 on error
        setInitialRoute('WelcomeScreen3');
      }
    };
    checkRegistration();
  }, []);

  if (!initialRoute) {
    // Show a basic loading indicator while determining the initial route
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
        <StatusBar barStyle="dark-content" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar barStyle="dark-content" />
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{ headerShown: false }}
      >
        {/* Welcome / Onboarding Screens */}
        <Stack.Screen name="WelcomeScreen1" component={WelcomeScreen1} />
        <Stack.Screen name="WelcomeScreen2" component={WelcomeScreen2} />
        <Stack.Screen name="WelcomeScreen3" component={WelcomeScreen3} />
        <Stack.Screen name="WelcomeScreen5" component={WelcomeScreen5} />
        <Stack.Screen name="WelcomeScreen13" component={WelcomeScreen13} />

        {/* Main App Screen */}
        <Stack.Screen name="Screen1" component={Screen1} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;

// /**
//  * Taxi Booking App
//  */
// import 'react-native-gesture-handler';
// import React, { useEffect, useState } from 'react';
// import { NavigationContainer } from '@react-navigation/native';
// import { createNativeStackNavigator } from '@react-navigation/native-stack';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { StatusBar, View, ActivityIndicator } from 'react-native';

// // Import your screen components
// import WelcomeScreen1 from './src/WelcomeScreen1';
// import WelcomeScreen2 from './src/WelcomeScreen2';
// import WelcomeScreen3 from './src/WelcomeScreen3';
// import WelcomeScreen5 from './src/WelcomeScreen5';
// import WelcomeScreen13 from './src/WelcomeScreen13';
// import Screen1 from './src/Screen1';

// // Define your navigation parameter list
// export type RootStackParamList = {
//   WelcomeScreen1: undefined;
//   WelcomeScreen2: undefined;
//   WelcomeScreen3: { phoneNumber: string };
//   WelcomeScreen5: undefined;
//   WelcomeScreen13: undefined;
//   Screen1: undefined;
// };

// const Stack = createNativeStackNavigator<RootStackParamList>();

// const App = () => {
//   const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList | null>(null);

//   useEffect(() => {
//     const checkRegistration = async () => {
//       try {
//         const isRegistered = await AsyncStorage.getItem('isRegistered');
//         setInitialRoute(isRegistered === 'true' ? 'Screen1' : 'WelcomeScreen1');
//       } catch (error) {
//         console.error('Error reading registration status:', error);
//         setInitialRoute('WelcomeScreen1');
//       }
//     };
//     checkRegistration();
//   }, []);

//   if (!initialRoute) {
//     // Show a basic loading indicator while determining the initial route
//     return (
//       <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
//         <ActivityIndicator size="large" />
//         <StatusBar barStyle="dark-content" />
//       </View>
//     );
//   }

//   return (
//     <NavigationContainer>
//       <StatusBar barStyle="dark-content" />
//       <Stack.Navigator
//         initialRouteName={initialRoute}
//         screenOptions={{ headerShown: false }}
//       >
//         {/* Welcome / Onboarding Screens */}
//         <Stack.Screen name="WelcomeScreen1" component={WelcomeScreen1} />
//         <Stack.Screen name="WelcomeScreen2" component={WelcomeScreen2} />
//         <Stack.Screen name="WelcomeScreen3" component={WelcomeScreen3} />
//         <Stack.Screen name="WelcomeScreen5" component={WelcomeScreen5} />
//         <Stack.Screen name="WelcomeScreen13" component={WelcomeScreen13} />

//         {/* Main App Screen */}
//         <Stack.Screen name="Screen1" component={Screen1} />
//       </Stack.Navigator>
//     </NavigationContainer>
//   );
// };

// export default App;