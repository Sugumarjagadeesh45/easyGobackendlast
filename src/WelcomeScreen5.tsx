import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SERVER_URL = 'https://easygobackend-1.onrender.com';
const LOCAL_URL = 'http://192.168.1.107:5000/api/auth';

const callBackend = async (endpoint: string, data: any, timeout = 5000) => {
  try {
    // Try the live server first
    return await axios.post(`${SERVER_URL}/api/auth${endpoint}`, data, { timeout });
  } catch (err) {
    console.warn(`Live server failed for ${endpoint}, falling back to localhost.`);
    // Fallback to localhost
    return await axios.post(`${LOCAL_URL}${endpoint}`, data, { timeout });
  }
};

const WelcomeScreen = () => {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [signInNumber, setSignInNumber] = useState('');
  const [code, setCode] = useState('');
  const [confirm, setConfirm] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  const isValidPhoneNumber = useCallback((phone: string) => {
    return /^[6-9]\d{9}$/.test(phone);
  }, []);

  const handleBackendVerification = useCallback(
    async (phone: string, isNewUser = false) => {
      try {
        setLoading(true);
        const endpoint = isNewUser ? '/register' : '/verify-phone';
        const response = await callBackend(endpoint, {
          phoneNumber: phone,
          name: isNewUser ? name : undefined,
        });

        if (response.data.success && response.data.token) {
          await AsyncStorage.setItem('authToken', response.data.token);
          navigation.navigate('Screen1', { phone, isNewUser });
        } else if (response.data.error?.includes('already registered')) {
          Alert.alert('Already Registered', 'This mobile number is already registered. Please sign in instead.');
          setActiveTab('signin');
          setSignInNumber(phone);
        }
      } catch (error: any) {
        const errorMessage = error.response?.data?.error || 'Something went wrong';
        if (errorMessage.includes('already registered')) {
          Alert.alert('Already Registered', 'This mobile number is already registered. Please sign in instead.');
          setActiveTab('signin');
          setSignInNumber(phone);
        } else {
          Alert.alert('Error', errorMessage);
        }
      } finally {
        setLoading(false);
      }
    },
    [name, navigation]
  );

  const signInWithPhoneNumber = useCallback(async () => {
    if (!signInNumber) {
      Alert.alert('Error', 'Please enter your mobile number.');
      return;
    }
    if (!isValidPhoneNumber(signInNumber)) {
      Alert.alert('Error', 'Please enter a valid 10-digit Indian mobile number.');
      return;
    }
    try {
      setLoading(true);
      const confirmation = await auth().signInWithPhoneNumber(`+91${signInNumber}`);
      setConfirm(confirmation);
      Alert.alert('OTP Sent', 'Please check your phone for the OTP.');
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.code === 'auth/invalid-phone-number'
          ? 'The mobile number is invalid. Please check and try again.'
          : error.message || 'Something went wrong. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }, [signInNumber, isValidPhoneNumber]);

  const confirmCode = useCallback(async () => {
    if (!code) {
      Alert.alert('Error', 'Please enter the OTP.');
      return;
    }
    try {
      setLoading(true);
      const userCredential = await confirm.confirm(code);

      if (userCredential?.user) {
        const isNewUser = activeTab === 'signup';
        await handleBackendVerification(isNewUser ? mobileNumber : signInNumber, isNewUser);
      } else {
        throw new Error('Failed to verify OTP');
      }
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.code === 'auth/invalid-verification-code'
          ? 'The OTP you entered is incorrect. Please try again.'
          : error.message || 'Failed to verify OTP.'
      );
    } finally {
      setLoading(false);
    }
  }, [code, confirm, activeTab, mobileNumber, signInNumber, handleBackendVerification]);

  const handleSignUp = useCallback(async () => {
    if (!name || !mobileNumber) {
      Alert.alert('Error', 'Please enter both name and mobile number.');
      return;
    }
    if (!isValidPhoneNumber(mobileNumber)) {
      Alert.alert('Error', 'Please enter a valid 10-digit Indian mobile number.');
      return;
    }
    try {
      setLoading(true);
      const { data } = await callBackend('/verify-phone', { phoneNumber: mobileNumber });

      if (data.success && !data.newUser) {
        Alert.alert('Already Registered', 'This mobile number is already registered. Please sign in instead.');
        setActiveTab('signin');
        setSignInNumber(mobileNumber);
        return;
      }

      const confirmation = await auth().signInWithPhoneNumber(`+91${mobileNumber}`);
      setConfirm(confirmation);
      Alert.alert('OTP Sent', 'Please check your phone for the OTP.');
    } catch (error: any) {
      if (error.response?.data?.error?.includes('already registered')) {
        Alert.alert('Already Registered', 'This mobile number is already registered. Please sign in instead.');
        setActiveTab('signin');
        setSignInNumber(mobileNumber);
      } else {
        Alert.alert('Error', error.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [name, mobileNumber, isValidPhoneNumber]);

  const switchTab = useCallback((tab: 'signin' | 'signup') => {
    setActiveTab(tab);
    setConfirm(null);
    setCode('');
  }, []);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
    >
      <View style={styles.header}>
        <Image
          source={require('../assets/11111.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <View style={styles.card}>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            onPress={() => switchTab('signin')}
            style={[styles.tab, activeTab === 'signin' && styles.activeTab]}
          >
            <Text style={[styles.tabText, activeTab === 'signin' && styles.activeTabText]}>Sign In</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => switchTab('signup')}
            style={[styles.tab, activeTab === 'signup' && styles.activeTab]}
          >
            <Text style={[styles.tabText, activeTab === 'signup' && styles.activeTabText]}>Sign Up</Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'signin' ? (
          <>
            <Text style={styles.loginText}>Login with your phone number</Text>
            <TextInput
              style={styles.input}
              placeholder="+91 Mobile Number"
              value={signInNumber}
              onChangeText={(text) => setSignInNumber(text.replace(/[^0-9]/g, ''))}
              keyboardType="phone-pad"
              maxLength={10}
            />
            {confirm ? (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Enter OTP"
                  value={code}
                  onChangeText={setCode}
                  keyboardType="number-pad"
                  maxLength={6}
                />
                <TouchableOpacity style={styles.button} onPress={confirmCode} disabled={loading}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Verify OTP</Text>}
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity style={styles.button} onPress={signInWithPhoneNumber} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Send OTP</Text>}
              </TouchableOpacity>
            )}
          </>
        ) : (
          <>
            <TextInput
              style={styles.input}
              placeholder="Name"
              value={name}
              onChangeText={setName}
            />
            <TextInput
              style={styles.input}
              placeholder="+91 Mobile Number"
              value={mobileNumber}
              onChangeText={(text) => setMobileNumber(text.replace(/[^0-9]/g, ''))}
              keyboardType="phone-pad"
              maxLength={10}
            />
            {confirm ? (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Enter OTP"
                  value={code}
                  onChangeText={setCode}
                  keyboardType="number-pad"
                  maxLength={6}
                />
                <TouchableOpacity style={styles.button} onPress={confirmCode} disabled={loading}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Verify OTP</Text>}
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity style={styles.button} onPress={handleSignUp} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign Up</Text>}
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#00cc00',
  },
  header: {
    flex: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: '60%',
    height: '60%',
  },
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 20,
    marginTop: -150,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 15,
  },
  tab: {
    marginHorizontal: 20,
    paddingBottom: 5,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#00cc00',
  },
  tabText: {
    fontSize: 16,
    color: '#888',
  },
  activeTabText: {
    color: '#00cc00',
    fontWeight: '600',
  },
  input: {
    width: '100%',
    backgroundColor: '#f5f5f5',
    height: 45,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 15,
    marginBottom: 12,
  },
  loginText: {
    fontSize: 15,
    color: '#444',
    marginBottom: 10,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#00cc00',
    borderRadius: 8,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default WelcomeScreen;
// import React, { useState, useCallback } from 'react';
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   StyleSheet,
//   KeyboardAvoidingView,
//   Platform,
//   Image,
//   Alert,
//   ActivityIndicator,
// } from 'react-native';
// import auth from '@react-native-firebase/auth';
// import { useNavigation } from '@react-navigation/native';
// import axios from 'axios';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// const API_BASE_URL = 'http://192.168.1.107:5000/api/auth';

// const WelcomeScreen = () => {
//   const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
//   const [name, setName] = useState('');
//   const [mobileNumber, setMobileNumber] = useState('');
//   const [signInNumber, setSignInNumber] = useState('');
//   const [code, setCode] = useState('');
//   const [confirm, setConfirm] = useState<any>(null);
//   const [loading, setLoading] = useState(false);
//   const navigation = useNavigation();

//   const isValidPhoneNumber = useCallback((phone: string) => {
//     return /^[6-9]\d{9}$/.test(phone);
//   }, []);

//   const handleBackendVerification = useCallback(async (phone: string, isNewUser = false) => {
//     try {
//       setLoading(true);
//       const endpoint = isNewUser ? '/register' : '/verify-phone';
//       const response = await axios.post(`${API_BASE_URL}${endpoint}`, {
//         phoneNumber: phone,
//         name: isNewUser ? name : undefined,
//       });

//       if (response.data.success && response.data.token) {
//         await AsyncStorage.setItem('authToken', response.data.token);
//         navigation.navigate('Screen1');
//       } else if (response.data.error?.includes('already registered')) {
//         Alert.alert('Already Registered', 'This mobile number is already registered. Please sign in instead.');
//         setActiveTab('signin');
//         setSignInNumber(phone);
//       }
//     } catch (error: any) {
//       const errorMessage = error.response?.data?.error || 'Something went wrong';
//       if (errorMessage.includes('already registered')) {
//         Alert.alert('Already Registered', 'This mobile number is already registered. Please sign in instead.');
//         setActiveTab('signin');
//         setSignInNumber(phone);
//       } else {
//         Alert.alert('Error', errorMessage);
//       }
//     } finally {
//       setLoading(false);
//     }
//   }, [name, navigation]);

//   const signInWithPhoneNumber = useCallback(async () => {
//     if (!signInNumber) {
//       Alert.alert('Error', 'Please enter your mobile number.');
//       return;
//     }
//     if (!isValidPhoneNumber(signInNumber)) {
//       Alert.alert('Error', 'Please enter a valid 10-digit Indian mobile number.');
//       return;
//     }
//     try {
//       setLoading(true);
//       const confirmation = await auth().signInWithPhoneNumber(`+91${signInNumber}`);
//       setConfirm(confirmation);
//       Alert.alert('OTP Sent', 'Please check your phone for the OTP.');
//     } catch (error: any) {
//       Alert.alert('Error', 
//         error.code === 'auth/invalid-phone-number' 
//           ? 'The mobile number is invalid. Please check and try again.'
//           : error.message || 'Something went wrong. Please try again.'
//       );
//     } finally {
//       setLoading(false);
//     }
//   }, [signInNumber, isValidPhoneNumber]);

//   const confirmCode = useCallback(async () => {
//     if (!code) {
//       Alert.alert('Error', 'Please enter the OTP.');
//       return;
//     }
//     try {
//       setLoading(true);
//       const userCredential = await confirm.confirm(code);
      
//       if (userCredential?.user) {
//         const isNewUser = activeTab === 'signup';
//         await handleBackendVerification(isNewUser ? mobileNumber : signInNumber, isNewUser);
//       } else {
//         throw new Error('Failed to verify OTP');
//       }
//     } catch (error: any) {
//       Alert.alert('Error', 
//         error.code === 'auth/invalid-verification-code'
//           ? 'The OTP you entered is incorrect. Please try again.'
//           : error.message || 'Failed to verify OTP.'
//       );
//     } finally {
//       setLoading(false);
//     }
//   }, [code, confirm, activeTab, mobileNumber, signInNumber, handleBackendVerification]);

//   const handleSignUp = useCallback(async () => {
//     if (!name || !mobileNumber) {
//       Alert.alert('Error', 'Please enter both name and mobile number.');
//       return;
//     }
//     if (!isValidPhoneNumber(mobileNumber)) {
//       Alert.alert('Error', 'Please enter a valid 10-digit Indian mobile number.');
//       return;
//     }
//     try {
//       setLoading(true);
//       const { data } = await axios.post(`${API_BASE_URL}/verify-phone`, { phoneNumber: mobileNumber });

//       if (data.success && !data.newUser) {
//         Alert.alert('Already Registered', 'This mobile number is already registered. Please sign in instead.');
//         setActiveTab('signin');
//         setSignInNumber(mobileNumber);
//         return;
//       }

//       const confirmation = await auth().signInWithPhoneNumber(`+91${mobileNumber}`);
//       setConfirm(confirmation);
//       Alert.alert('OTP Sent', 'Please check your phone for the OTP.');
//     } catch (error: any) {
//       if (error.response?.data?.error?.includes('already registered')) {
//         Alert.alert('Already Registered', 'This mobile number is already registered. Please sign in instead.');
//         setActiveTab('signin');
//         setSignInNumber(mobileNumber);
//       } else {
//         Alert.alert('Error', error.message || 'Something went wrong. Please try again.');
//       }
//     } finally {
//       setLoading(false);
//     }
//   }, [name, mobileNumber, isValidPhoneNumber]);

//   const switchTab = useCallback((tab: 'signin' | 'signup') => {
//     setActiveTab(tab);
//     setConfirm(null);
//     setCode('');
//   }, []);

//   return (
//     <KeyboardAvoidingView
//       style={styles.container}
//       behavior={Platform.OS === 'ios' ? 'padding' : undefined}
//       keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
//     >
//       <View style={styles.header}>
//         <Image
//           source={require('../assets/11111.png')}
//           style={styles.logo}
//           resizeMode="contain"
//         />
//       </View>

//       <View style={styles.card}>
//         <View style={styles.tabContainer}>
//           <TouchableOpacity
//             onPress={() => switchTab('signin')}
//             style={[styles.tab, activeTab === 'signin' && styles.activeTab]}
//           >
//             <Text style={[styles.tabText, activeTab === 'signin' && styles.activeTabText]}>
//               Sign In
//             </Text>
//           </TouchableOpacity>
//           <TouchableOpacity
//             onPress={() => switchTab('signup')}
//             style={[styles.tab, activeTab === 'signup' && styles.activeTab]}
//           >
//             <Text style={[styles.tabText, activeTab === 'signup' && styles.activeTabText]}>
//               Sign Up
//             </Text>
//           </TouchableOpacity>
//         </View>

//         {activeTab === 'signin' ? (
//           <>
//             <Text style={styles.loginText}>Login with your phone number</Text>
//             <TextInput
//               style={styles.input}
//               placeholder="+91 Mobile Number"
//               value={signInNumber}
//               onChangeText={text => setSignInNumber(text.replace(/[^0-9]/g, ''))}
//               keyboardType="phone-pad"
//               maxLength={10}
//             />
//             {confirm ? (
//               <>
//                 <TextInput
//                   style={styles.input}
//                   placeholder="Enter OTP"
//                   value={code}
//                   onChangeText={setCode}
//                   keyboardType="number-pad"
//                   maxLength={6}
//                 />
//                 <TouchableOpacity 
//                   style={styles.button} 
//                   onPress={confirmCode}
//                   disabled={loading}
//                 >
//                   {loading ? (
//                     <ActivityIndicator color="#fff" />
//                   ) : (
//                     <Text style={styles.buttonText}>Verify OTP</Text>
//                   )}
//                 </TouchableOpacity>
//               </>
//             ) : (
//               <TouchableOpacity 
//                 style={styles.button} 
//                 onPress={signInWithPhoneNumber}
//                 disabled={loading}
//               >
//                 {loading ? (
//                   <ActivityIndicator color="#fff" />
//                 ) : (
//                   <Text style={styles.buttonText}>Send OTP</Text>
//                 )}
//               </TouchableOpacity>
//             )}
//           </>
//         ) : (
//           <>
//             <TextInput
//               style={styles.input}
//               placeholder="Name"
//               value={name}
//               onChangeText={setName}
//             />
//             <TextInput
//               style={styles.input}
//               placeholder="+91 Mobile Number"
//               value={mobileNumber}
//               onChangeText={text => setMobileNumber(text.replace(/[^0-9]/g, ''))}
//               keyboardType="phone-pad"
//               maxLength={10}
//             />
//             {confirm ? (
//               <>
//                 <TextInput
//                   style={styles.input}
//                   placeholder="Enter OTP"
//                   value={code}
//                   onChangeText={setCode}
//                   keyboardType="number-pad"
//                   maxLength={6}
//                 />
//                 <TouchableOpacity 
//                   style={styles.button} 
//                   onPress={confirmCode}
//                   disabled={loading}
//                 >
//                   {loading ? (
//                     <ActivityIndicator color="#fff" />
//                   ) : (
//                     <Text style={styles.buttonText}>Verify OTP</Text>
//                   )}
//                 </TouchableOpacity>
//               </>
//             ) : (
//               <TouchableOpacity 
//                 style={styles.button} 
//                 onPress={handleSignUp}
//                 disabled={loading}
//               >
//                 {loading ? (
//                   <ActivityIndicator color="#fff" />
//                 ) : (
//                   <Text style={styles.buttonText}>Sign Up</Text>
//                 )}
//               </TouchableOpacity>
//             )}
//           </>
//         )}
//       </View>
//     </KeyboardAvoidingView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#00cc00',
//   },
//   header: {
//     flex: 2,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   logo: {
//     width: '60%',
//     height: '60%',
//   },
//   card: {
//     flex: 1,
//     backgroundColor: '#fff',
//     borderTopLeftRadius: 25,
//     borderTopRightRadius: 25,
//     padding: 20,
//     marginTop: -150,
//     elevation: 8,
//     shadowColor: '#000',
//     shadowOpacity: 0.15,
//     shadowRadius: 8,
//   },
//   tabContainer: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//     marginBottom: 15,
//   },
//   tab: {
//     marginHorizontal: 20,
//     paddingBottom: 5,
//   },
//   activeTab: {
//     borderBottomWidth: 2,
//     borderBottomColor: '#00cc00',
//   },
//   tabText: {
//     fontSize: 16,
//     color: '#888',
//   },
//   activeTabText: {
//     color: '#00cc00',
//     fontWeight: '600',
//   },
//   input: {
//     width: '100%',
//     backgroundColor: '#f5f5f5',
//     height: 45,
//     borderRadius: 8,
//     paddingHorizontal: 12,
//     fontSize: 15,
//     marginBottom: 12,
//   },
//   loginText: {
//     fontSize: 15,
//     color: '#444',
//     marginBottom: 10,
//     textAlign: 'center',
//   },
//   button: {
//     backgroundColor: '#00cc00',
//     borderRadius: 8,
//     height: 45,
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginTop: 8,
//   },
//   buttonText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: '600',
//   },
// });

// export default WelcomeScreen;