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
                placeholderTextColor="#6b7280"
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
                <ActivityIndicator color="#050816" />
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
    backgroundColor: '#050816',
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
  submitButton: {
    backgroundColor: '#38bdf8',
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
    color: '#050816',
    fontWeight: '600',
    fontSize: 16,
  },
  backLink: {
    color: '#38bdf8',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  confirmationText: {
    color: '#e5e7eb',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 24,
    textAlign: 'center',
  },
  resetLink: {
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1f2937',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  resetLinkText: {
    color: '#38bdf8',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default ForgotPasswordScreen;
