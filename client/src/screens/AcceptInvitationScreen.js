import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import {useAuth} from '../context/AuthContext';
import {validatePassword} from '../utils/validation';

/** RF-07: join an organization using the invite token from the emailed link. */
function AcceptInvitationScreen({navigation}) {
  const {acceptInvitation} = useAuth();
  const [token, setToken] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    if (!token.trim() || !fullName.trim() || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      Alert.alert('Error', passwordValidation.error);
      return;
    }

    setLoading(true);
    const result = await acceptInvitation({
      token: token.trim(),
      full_name: fullName.trim(),
      password,
    });
    setLoading(false);

    if (!result.success) {
      Alert.alert('Could Not Join', result.error);
    }
    // Navigation handled by App.js based on auth state
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.logo}>TechSync</Text>
          <Text style={styles.subtitle}>Accept Your Invitation</Text>

          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>Invitation Token</Text>
              <TextInput
                style={styles.input}
                placeholder="Paste the token from your invite email"
                placeholderTextColor="#6b7280"
                value={token}
                onChangeText={setToken}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="John Doe"
                placeholderTextColor="#6b7280"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="At least 8 characters"
                placeholderTextColor="#6b7280"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Re-enter your password"
                placeholderTextColor="#6b7280"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity
              style={[styles.acceptButton, loading && styles.buttonDisabled]}
              onPress={handleAccept}
              disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#050816" />
              ) : (
                <Text style={styles.acceptButtonText}>Join Organization</Text>
              )}
            </TouchableOpacity>

            <View style={styles.loginSection}>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text style={styles.loginLink}>Back to Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050816',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  logo: {
    fontSize: 36,
    fontWeight: '700',
    color: '#38bdf8',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 32,
  },
  form: {
    width: '100%',
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9ca3af',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1f2937',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#e5e7eb',
  },
  acceptButton: {
    backgroundColor: '#38bdf8',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  acceptButtonText: {
    color: '#050816',
    fontWeight: '600',
    fontSize: 16,
  },
  loginSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  loginLink: {
    color: '#38bdf8',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default AcceptInvitationScreen;
