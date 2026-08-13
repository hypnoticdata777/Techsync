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
} from 'react-native';
import {useAuth} from '../context/AuthContext';
import {isValidEmail} from '../utils/validation';

/** RF-03: request a password reset link by email. */
function ForgotPasswordScreen({navigation}) {
  const {forgotPassword} = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!isValidEmail(email.trim())) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    const result = await forgotPassword(email.trim().toLowerCase());
    setLoading(false);

    if (result.success) {
      setSent(true);
    } else {
      Alert.alert('Error', result.error || 'Something went wrong');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.logo}>TechSync</Text>
        <Text style={styles.subtitle}>Reset Your Password</Text>

        {sent ? (
          <View style={styles.form}>
            <Text style={styles.confirmationText}>
              If that email is registered, a reset link has been sent. Follow the
              link to set a new password.
            </Text>
            <TouchableOpacity
              style={styles.resetLink}
              onPress={() => navigation.navigate('ResetPassword')}>
              <Text style={styles.resetLinkText}>I have a reset token</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.backLink}>Back to Sign In</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="email@example.com"
                placeholderTextColor="#8a7f70"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
              />
            </View>

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#f7f3ea" />
              ) : (
                <Text style={styles.submitButtonText}>Send Reset Link</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.backLink}>Back to Sign In</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f3ea',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  logo: {
    fontSize: 36,
    fontWeight: '700',
    color: '#2f6f9f',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#746a5d',
    textAlign: 'center',
    marginBottom: 48,
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
    color: '#746a5d',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fffaf0',
    borderWidth: 1,
    borderColor: '#d8ccb9',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#27313d',
  },
  submitButton: {
    backgroundColor: '#2f6f9f',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#f7f3ea',
    fontWeight: '600',
    fontSize: 16,
  },
  backLink: {
    color: '#2f6f9f',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  confirmationText: {
    color: '#27313d',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 24,
    textAlign: 'center',
  },
  resetLink: {
    backgroundColor: '#fffaf0',
    borderWidth: 1,
    borderColor: '#d8ccb9',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  resetLinkText: {
    color: '#2f6f9f',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default ForgotPasswordScreen;
