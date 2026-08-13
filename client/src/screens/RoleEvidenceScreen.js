import React, {useMemo} from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';

import {getRoleEvidenceDashboard} from '../utils/roleWalkthrough';

function RoleEvidenceScreen() {
  const dashboard = useMemo(() => getRoleEvidenceDashboard(), []);
  const {
    audit,
    capturePreflightRows,
    captureStatusRows,
    captureViewportRows,
    manualChecklist,
    roleRows,
    safetyChecklist,
    screenshotRows,
  } = dashboard;

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

        <Section title="Capture Preflight">
          {capturePreflightRows.map((step, index) => (
            <View key={step.key} style={styles.preflightRow}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepNumber}>{index + 1}</Text>
              </View>
              <View style={styles.stepBody}>
                <View style={styles.rowHeader}>
                  <Text style={styles.stepTitle}>{step.label}</Text>
                  <Text style={styles.stepOwner}>{step.owner}</Text>
                </View>
                <Text style={styles.manualDetail}>{step.detail}</Text>
              </View>
            </View>
          ))}
        </Section>

        <Section title="Viewport Gates">
          {captureViewportRows.map(viewport => (
            <View key={viewport.key} style={styles.viewportRow}>
              <Text style={styles.manualTitle}>{viewport.label}</Text>
              <Text style={styles.viewportSize}>{viewport.size}</Text>
              <Text style={styles.manualDetail}>{viewport.proof}</Text>
            </View>
          ))}
        </Section>

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

        <Section title="Role Friction Focus">
          {captureStatusRows.map(role => (
            <View key={role.role} style={styles.roleRow}>
              <View style={styles.rowHeader}>
                <Text style={styles.roleName}>{role.role.replace(/_/g, ' ')}</Text>
                <Text style={styles.shotCount}>{role.screenshotCount} shots</Text>
              </View>
              <Text style={styles.login}>Primary: {role.primaryLoginEmail}</Text>
              {role.emptyStateLoginEmail ? (
                <Text style={styles.emptyLogin}>Empty-state: {role.emptyStateLoginEmail}</Text>
              ) : null}
              {role.focusChecks.map(check => (
                <Text key={check} style={styles.focusItem}>- {check}</Text>
              ))}
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
    backgroundColor: '#f7f3ea',
  },
  content: {
    padding: 16,
    paddingBottom: 28,
  },
  title: {
    color: '#1f2933',
    fontSize: 26,
    fontWeight: '800',
  },
  subtitle: {
    color: '#746a5d',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
    marginBottom: 16,
  },
  statusBand: {
    backgroundColor: '#fffaf0',
    borderColor: '#d8ccb9',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    padding: 12,
  },
  statusMetric: {
    backgroundColor: '#fdf8ef',
    borderColor: '#d8ccb9',
    borderRadius: 7,
    borderWidth: 1,
    flex: 1,
    minHeight: 58,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  metricValue: {
    color: '#2f6f9f',
    fontSize: 18,
    fontWeight: '900',
  },
  metricLabel: {
    color: '#4f5f6f',
    fontSize: 10,
    fontWeight: '800',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    color: '#1f2933',
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  checkRow: {
    alignItems: 'flex-start',
    backgroundColor: '#fffaf0',
    borderColor: '#d8ccb9',
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
  preflightRow: {
    alignItems: 'flex-start',
    backgroundColor: '#fffaf0',
    borderColor: '#c7b89f',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
    padding: 10,
  },
  stepBadge: {
    alignItems: 'center',
    backgroundColor: '#2f6f9f',
    borderRadius: 7,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  stepNumber: {
    color: '#fffaf0',
    fontSize: 13,
    fontWeight: '900',
  },
  stepBody: {
    flex: 1,
  },
  stepTitle: {
    color: '#1f2933',
    flex: 1,
    fontSize: 13,
    fontWeight: '900',
  },
  stepOwner: {
    color: '#b98524',
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'right',
    textTransform: 'uppercase',
  },
  viewportRow: {
    backgroundColor: '#fffaf0',
    borderColor: '#9eb4c8',
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
    padding: 10,
  },
  viewportSize: {
    color: '#2f6f9f',
    fontSize: 12,
    fontWeight: '900',
    marginTop: 4,
  },
  readyText: {
    color: '#5f8f62',
  },
  blockedText: {
    color: '#b24a3a',
  },
  rowText: {
    color: '#384452',
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  roleRow: {
    backgroundColor: '#fffaf0',
    borderColor: '#d8ccb9',
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
    color: '#1f2933',
    fontSize: 15,
    fontWeight: '900',
    textTransform: 'capitalize',
  },
  shotCount: {
    color: '#b98524',
    fontSize: 12,
    fontWeight: '800',
  },
  persona: {
    color: '#2f6f9f',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 6,
  },
  login: {
    color: '#4f5f6f',
    fontSize: 12,
    marginTop: 4,
  },
  emptyLogin: {
    color: '#b98524',
    fontSize: 12,
    marginTop: 4,
  },
  focusItem: {
    color: '#384452',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
  },
  objective: {
    color: '#27313d',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
  },
  guardrail: {
    color: '#746a5d',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 6,
  },
  screenshotRow: {
    borderBottomColor: '#d8ccb9',
    borderBottomWidth: 1,
    paddingVertical: 10,
  },
  manualRow: {
    backgroundColor: '#fffaf0',
    borderColor: '#c7b89f',
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
    padding: 10,
  },
  manualTitle: {
    color: '#b98524',
    fontSize: 13,
    fontWeight: '900',
  },
  manualDetail: {
    color: '#384452',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },
  fileName: {
    color: '#1f2933',
    fontSize: 13,
    fontWeight: '800',
  },
  routeText: {
    color: '#2f6f9f',
    fontSize: 12,
    marginTop: 4,
  },
  proofText: {
    color: '#4f5f6f',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },
  safetyItem: {
    color: '#384452',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 6,
  },
});

export default RoleEvidenceScreen;
