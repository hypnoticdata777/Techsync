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
import {isValidEmail, validatePassword} from '../utils/validation';

/** RF-06: self-service org creation -- company + first admin in one step. */
function OnboardingScreen({navigation}) {
  const {onboardOrganization} = useAuth();
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateOrganization = async () => {
    if (!companyName.trim() || !fullName.trim() || !email.trim() || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!isValidEmail(email.trim())) {
      Alert.alert('Error', 'Please enter a valid email address');
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
    const result = await onboardOrganization({
      company_name: companyName.trim(),
      industry: industry.trim() || null,
      timezone: 'UTC',
      admin_full_name: fullName.trim(),
      admin_email: email.trim().toLowerCase(),
      admin_password: password,
    });
    setLoading(false);

    if (!result.success) {
      Alert.alert('Setup Failed', result.error);
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
          <Text style={styles.subtitle}>Set Up Your Organization</Text>

          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>Company Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Acme Field Services"
                placeholderTextColor="#6b7280"
                value={companyName}
                onChangeText={setCompanyName}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Industry (optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Plumbing, HVAC"
                placeholderTextColor="#6b7280"
                value={industry}
                onChangeText={setIndustry}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.field}>
              <Text style={styles.label}>Your Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Jane Admin"
                placeholderTextColor="#6b7280"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Your Email</Text>
              <TextInput
                style={styles.input}
                placeholder="jane@acme.com"
                placeholderTextColor="#6b7280"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
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
              style={[styles.registerButton, loading && styles.buttonDisabled]}
              onPress={handleCreateOrganization}
              disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#050816" />
              ) : (
                <Text style={styles.registerButtonText}>Create Organization</Text>
              )}
            </TouchableOpacity>

            <View style={styles.loginSection}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text style={styles.loginLink}>Sign In</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.loginSection}>
              <Text style={styles.loginText}>Have an invite link instead? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('AcceptInvitation')}>
                <Text style={styles.loginLink}>Accept Invitation</Text>
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
  divider: {
    height: 1,
    backgroundColor: '#1f2937',
    marginVertical: 12,
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
  registerButton: {
    backgroundColor: '#38bdf8',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  registerButtonText: {
    color: '#050816',
    fontWeight: '600',
    fontSize: 16,
  },
  loginSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  loginText: {
    color: '#9ca3af',
    fontSize: 14,
  },
  loginLink: {
    color: '#38bdf8',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default OnboardingScreen;
