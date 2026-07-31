import React, {useMemo} from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';

import {getRoleEvidenceDashboard} from '../utils/roleWalkthrough';

function RoleEvidenceScreen() {
  const dashboard = useMemo(() => getRoleEvidenceDashboard(), []);
  const {audit, manualChecklist, roleRows, safetyChecklist, screenshotRows} = dashboard;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Role Evidence</Text>
        <Text style={styles.subtitle}>
          Synthetic walkthrough checklist for the final local screenshot pass before hosting.
        </Text>

        <View style={styles.statusBand}>
          <View style={styles.statusMetric}>
            <Text style={styles.metricValue}>{audit.roleCount}</Text>
            <Text style={styles.metricLabel}>Roles</Text>
          </View>
          <View style={styles.statusMetric}>
            <Text style={styles.metricValue}>{audit.screenshotCount}</Text>
            <Text style={styles.metricLabel}>Shots</Text>
          </View>
          <View style={styles.statusMetric}>
            <Text style={[styles.metricValue, audit.passed ? styles.readyText : styles.blockedText]}>
              {audit.passed ? 'Ready' : 'Review'}
            </Text>
            <Text style={styles.metricLabel}>Audit</Text>
          </View>
        </View>

        <Section title="Automated Checks">
          {audit.checks.map(check => (
            <View key={check.key} style={styles.checkRow}>
              <Text style={[styles.checkMark, check.passed ? styles.readyText : styles.blockedText]}>
                {check.passed ? 'PASS' : 'FIX'}
              </Text>
              <Text style={styles.rowText}>{check.detail}</Text>
            </View>
          ))}
        </Section>

        <Section title="Role Capture Plan">
          {roleRows.map(role => (
            <View key={role.role} style={styles.roleRow}>
              <View style={styles.rowHeader}>
                <Text style={styles.roleName}>{role.role.replace(/_/g, ' ')}</Text>
                <Text style={styles.shotCount}>{role.screenshotCount} shots</Text>
              </View>
              <Text style={styles.persona}>{role.persona}</Text>
              <Text style={styles.login}>{role.loginEmail}</Text>
              {role.emptyStateLoginEmail ? (
                <Text style={styles.emptyLogin}>
                  Empty-state: {role.emptyStateLoginEmail}
                </Text>
              ) : null}
              <Text style={styles.objective}>{role.objective}</Text>
              <Text style={styles.guardrail}>
                Visible: {role.visibleControls.length ? role.visibleControls.join(', ') : 'None'}
              </Text>
              <Text style={styles.guardrail}>
                Hidden: {role.hiddenControls.length ? role.hiddenControls.join(', ') : 'None'}
              </Text>
            </View>
          ))}
        </Section>

        <Section title="Manual UX Checks">
          {manualChecklist.map(item => (
            <View key={item.key} style={styles.manualRow}>
              <Text style={styles.manualTitle}>{item.label}</Text>
              <Text style={styles.manualDetail}>{item.detail}</Text>
            </View>
          ))}
        </Section>

        <Section title="Screenshot Targets">
          {screenshotRows.map(item => (
            <View key={item.screenshotName} style={styles.screenshotRow}>
              <Text style={styles.fileName}>{item.screenshotName}</Text>
              <Text style={styles.routeText}>{item.role} / {item.route}</Text>
              <Text style={styles.proofText}>{item.proof}</Text>
            </View>
          ))}
        </Section>

        <Section title="Safety Checklist">
          {safetyChecklist.map(item => (
            <Text key={item} style={styles.safetyItem}>- {item}</Text>
          ))}
        </Section>
      </View>
    </ScrollView>
  );
}

const Section = ({title, children}) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050816',
  },
  content: {
    padding: 16,
    paddingBottom: 28,
  },
  title: {
    color: '#f9fafb',
    fontSize: 26,
    fontWeight: '800',
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
    marginBottom: 16,
  },
  statusBand: {
    backgroundColor: '#020617',
    borderColor: '#1f2937',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    padding: 12,
  },
  statusMetric: {
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
    borderRadius: 7,
    borderWidth: 1,
    flex: 1,
    minHeight: 58,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  metricValue: {
    color: '#38bdf8',
    fontSize: 18,
    fontWeight: '900',
  },
  metricLabel: {
    color: '#cbd5e1',
    fontSize: 10,
    fontWeight: '800',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    color: '#f9fafb',
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  checkRow: {
    alignItems: 'flex-start',
    backgroundColor: '#020617',
    borderColor: '#1f2937',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
    padding: 10,
  },
  checkMark: {
    fontSize: 11,
    fontWeight: '900',
    minWidth: 34,
  },
  readyText: {
    color: '#a3e635',
  },
  blockedText: {
    color: '#fb7185',
  },
  rowText: {
    color: '#d1d5db',
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  roleRow: {
    backgroundColor: '#020617',
    borderColor: '#1f2937',
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 10,
    padding: 12,
  },
  rowHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  roleName: {
    color: '#f9fafb',
    fontSize: 15,
    fontWeight: '900',
    textTransform: 'capitalize',
  },
  shotCount: {
    color: '#fbbf24',
    fontSize: 12,
    fontWeight: '800',
  },
  persona: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 6,
  },
  login: {
    color: '#cbd5e1',
    fontSize: 12,
    marginTop: 4,
  },
  emptyLogin: {
    color: '#fbbf24',
    fontSize: 12,
    marginTop: 4,
  },
  objective: {
    color: '#e5e7eb',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
  },
  guardrail: {
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 6,
  },
  screenshotRow: {
    borderBottomColor: '#1f2937',
    borderBottomWidth: 1,
    paddingVertical: 10,
  },
  manualRow: {
    backgroundColor: '#020617',
    borderColor: '#334155',
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
    padding: 10,
  },
  manualTitle: {
    color: '#fbbf24',
    fontSize: 13,
    fontWeight: '900',
  },
  manualDetail: {
    color: '#d1d5db',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },
  fileName: {
    color: '#f9fafb',
    fontSize: 13,
    fontWeight: '800',
  },
  routeText: {
    color: '#38bdf8',
    fontSize: 12,
    marginTop: 4,
  },
  proofText: {
    color: '#cbd5e1',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },
  safetyItem: {
    color: '#d1d5db',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 6,
  },
});

export default RoleEvidenceScreen;
