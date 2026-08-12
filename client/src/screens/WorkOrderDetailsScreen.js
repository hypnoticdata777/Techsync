import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {useAuth} from '../context/AuthContext';
import ScreenErrorState from '../components/ScreenErrorState';
import {
  actionButtonA11y,
  inputA11y,
  statusActionA11y,
} from '../utils/accessibility';
import {
  buildActionOutcomeNotice,
  buildRoleBoundaryRows,
  buildDetailActionPathRows,
  buildDetailGuidanceRows,
  buildDetailSummary,
  buildRoleEventPlaybookRows,
  buildWorkOrderFlowRows,
  getDetailRoleContext,
  getCommunicationLaneNotice,
} from '../utils/roleWorkflows';

// Helper function to get status color
const getStatusColor = status => {
  switch (status) {
    case 'open':
      return '#fbbf24'; // yellow
    case 'in_progress':
      return '#38bdf8'; // blue
    case 'paused':
      return '#f97316'; // orange
    case 'escalated':
      return '#fb7185'; // rose
    case 'completed':
      return '#a3e635'; // green
    case 'cancelled':
      return '#ef4444'; // red
    case 'archived':
      return '#94a3b8'; // slate
    default:
      return '#9ca3af'; // gray
  }
};

// RF-18: only these transitions are legal, mirrors server/models/work_order.py
const ALLOWED_TRANSITIONS = {
  open: ['in_progress', 'paused', 'escalated', 'cancelled', 'archived'],
  in_progress: ['completed', 'paused', 'escalated', 'cancelled', 'open', 'archived'],
  paused: ['open', 'in_progress', 'escalated', 'cancelled', 'archived'],
  escalated: ['in_progress', 'paused', 'completed', 'cancelled', 'archived'],
  completed: ['archived'],
  cancelled: ['archived'],
  archived: [],
};

const STATUS_LABELS = {
  open: 'Open',
  in_progress: 'Start Work',
  paused: 'Pause',
  escalated: 'Escalate',
  completed: 'Mark Completed',
  cancelled: 'Cancel',
  archived: 'Archive',
};

const STATUS_CONFIRMATIONS = {
  cancelled: {
    title: 'Cancel work order?',
    message: 'This removes it from active operations and can only be archived afterward.',
    confirm: 'Yes, cancel',
  },
  archived: {
    title: 'Archive work order?',
    message: 'Archived work stays in history but leaves the active operating surface.',
    confirm: 'Archive',
  },
  escalated: {
    title: 'Escalate work order?',
    message: 'Escalated work remains active and should be reviewed by the coordinator queue.',
    confirm: 'Escalate',
  },
  paused: {
    title: 'Pause work order?',
    message: 'Paused work remains visible but is not counted as technician capacity pressure.',
    confirm: 'Pause',
  },
};

const INTERNAL_ROLES = ['org_admin', 'coordinator', 'technician'];

const getMessageVisibilityLabel = visibility => {
  switch (visibility) {
    case 'client':
      return 'Client-visible';
    case 'vendor':
      return 'Vendor-visible';
    default:
      return 'Internal';
  }
};

const getApprovalColor = status => {
  switch (status) {
    case 'pending':
      return '#fbbf24';
    case 'approved':
      return '#a3e635';
    case 'declined':
      return '#fb7185';
    default:
      return '#9ca3af';
  }
};

const getApprovalLabel = status => {
  switch (status) {
    case 'pending':
      return 'Pending Client Approval';
    case 'approved':
      return 'Approved';
    case 'declined':
      return 'Declined';
    default:
      return 'Not Requested';
  }
};

const getSummaryToneColor = tone => {
  switch (tone) {
    case 'open':
    case 'pending':
    case 'missing':
      return '#fbbf24';
    case 'in_progress':
    case 'active':
      return '#38bdf8';
    case 'completed':
    case 'approved':
    case 'verified':
      return '#a3e635';
    case 'cancelled':
    case 'declined':
    case 'escalated':
      return '#fb7185';
    case 'paused':
    case 'override':
      return '#f97316';
    case 'archived':
      return '#94a3b8';
    default:
      return '#94a3b8';
  }
};

function WorkOrderDetailsScreen({route, navigation}) {
  const {user, authFetch} = useAuth();
  const [workOrder, setWorkOrder] = useState(route.params.workOrder);
  const [notes, setNotes] = useState('');
  const [updating, setUpdating] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [attachmentsLoading, setAttachmentsLoading] = useState(true);
  const [attachmentsError, setAttachmentsError] = useState(null);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [messagesError, setMessagesError] = useState(null);
  const [messageBody, setMessageBody] = useState('');
  const [messageVisibility, setMessageVisibility] = useState('internal');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [updatingApproval, setUpdatingApproval] = useState(false);
  const [outcomeNotice, setOutcomeNotice] = useState(null);

  const canEdit = user?.role === 'org_admin' || user?.role === 'coordinator';
  const canUseInternalMessages = INTERNAL_ROLES.includes(user?.role);
  const canSendMessages = user?.role !== 'viewer';
  const forcedMessageVisibility = user?.role === 'vendor' ? 'vendor' : 'client';
  const canUpdateStatus = INTERNAL_ROLES.includes(user?.role);
  const canUploadAttachments = INTERNAL_ROLES.includes(user?.role);
  const canRequestApproval = canEdit && !!workOrder.client_id;
  const canDecideApproval =
    user?.role === 'client' && workOrder.client_approval_status === 'pending';
  const nextStatuses = canUpdateStatus
    ? (ALLOWED_TRANSITIONS[workOrder.status] || []).filter(
        nextStatus => nextStatus !== 'archived' || canEdit,
      )
    : [];
  const roleContext = useMemo(
    () => getDetailRoleContext(user?.role, workOrder),
    [user?.role, workOrder],
  );
  const detailSummary = useMemo(
    () => buildDetailSummary(workOrder, attachments, messages),
    [attachments, messages, workOrder],
  );
  const detailGuidanceRows = useMemo(
    () =>
      buildDetailGuidanceRows(user?.role, workOrder, {
        canEdit,
        canUpdateStatus,
        canUploadAttachments,
        canSendMessages,
        canRequestApproval,
        canDecideApproval,
        nextStatusCount: nextStatuses.length,
      }),
    [
      canDecideApproval,
      canEdit,
      canRequestApproval,
      canSendMessages,
      canUpdateStatus,
      canUploadAttachments,
      nextStatuses.length,
      user?.role,
      workOrder,
    ],
  );
  const detailActionPathRows = useMemo(
    () =>
      buildDetailActionPathRows(
        user?.role,
        workOrder,
        {
          canEdit,
          canUpdateStatus,
          canUploadAttachments,
          canSendMessages,
          canRequestApproval,
          canDecideApproval,
          nextStatusCount: nextStatuses.length,
        },
        {
          attachmentCount: attachments.length,
          messageCount: messages.length,
        },
      ),
    [
      attachments.length,
      canDecideApproval,
      canEdit,
      canRequestApproval,
      canSendMessages,
      canUpdateStatus,
      canUploadAttachments,
      messages.length,
      nextStatuses.length,
      user?.role,
      workOrder,
    ],
  );
  const roleEventPlaybookRows = useMemo(
    () =>
      buildRoleEventPlaybookRows(user?.role, workOrder, {
        attachmentCount: attachments.length,
        messageCount: messages.length,
      }),
    [attachments.length, messages.length, user?.role, workOrder],
  );
  const workOrderFlowRows = useMemo(
    () => buildWorkOrderFlowRows(workOrder),
    [workOrder],
  );
  const roleBoundaryRows = useMemo(
    () => buildRoleBoundaryRows(user?.role),
    [user?.role],
  );
  const communicationNotice = useMemo(
    () => getCommunicationLaneNotice(user?.role, messageVisibility),
    [messageVisibility, user?.role],
  );

  const loadAttachments = useCallback(async () => {
    try {
      setAttachmentsLoading(true);
      const res = await authFetch(`/work-orders/${workOrder.id}/attachments`);
      if (res.ok) {
        const data = await res.json();
        setAttachments(data);
        setAttachmentsError(null);
      } else if (res.status === 403) {
        setAttachmentsError('Attachments are not available for this role.');
      } else {
        setAttachmentsError('Unable to load attachments.');
      }
    } catch (error) {
      console.error('Attachment load error:', error);
      setAttachmentsError(error.message || 'Unable to load attachments.');
    } finally {
      setAttachmentsLoading(false);
    }
  }, [authFetch, workOrder.id]);

  useEffect(() => {
    loadAttachments();
  }, [loadAttachments]);

  const loadMessages = useCallback(async () => {
    try {
      setMessagesLoading(true);
      const res = await authFetch(`/work-orders/${workOrder.id}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
        setMessagesError(null);
      } else if (res.status === 403) {
        setMessagesError('Messages are not available for this role.');
      } else {
        setMessagesError('Unable to load messages.');
      }
    } catch (error) {
      console.error('Message load error:', error);
      setMessagesError(error.message || 'Unable to load messages.');
    } finally {
      setMessagesLoading(false);
    }
  }, [authFetch, workOrder.id]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    if (!canUseInternalMessages) {
      setMessageVisibility(forcedMessageVisibility);
    }
  }, [canUseInternalMessages, forcedMessageVisibility]);

  const handleEdit = () => {
    navigation.navigate('WorkOrderForm', {workOrder});
  };

  const handleTransition = async newStatus => {
    try {
      setUpdating(true);
      const res = await authFetch(`/work-orders/${workOrder.id}/status`, {
        method: 'PATCH',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({status: newStatus, notes: notes.trim() || null}),
      });

      if (res.ok) {
        const updated = await res.json();
        setWorkOrder(updated);
        setNotes('');
        setOutcomeNotice(
          buildActionOutcomeNotice(user?.role, {type: 'status', status: newStatus}, updated),
        );
      } else {
        const errorData = await res.json().catch(() => ({}));
        Alert.alert('Error', errorData.detail || 'Failed to update status');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', err.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const confirmTransition = newStatus => {
    const confirmation = STATUS_CONFIRMATIONS[newStatus];
    if (confirmation) {
      Alert.alert(confirmation.title, confirmation.message, [
        {text: 'No', style: 'cancel'},
        {
          text: confirmation.confirm,
          style: newStatus === 'cancelled' || newStatus === 'archived' ? 'destructive' : 'default',
          onPress: () => handleTransition(newStatus),
        },
      ]);
      return;
    }
    handleTransition(newStatus);
  };

  const sendMessage = async () => {
    if (!canSendMessages) {
      Alert.alert('Read-only access', 'Viewer users cannot add messages.');
      return;
    }

    const trimmed = messageBody.trim();
    if (!trimmed) {
      Alert.alert('Message needed', 'Add a message before sending.');
      return;
    }

    try {
      setSendingMessage(true);
      const res = await authFetch(`/work-orders/${workOrder.id}/messages`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          body: trimmed,
          visibility: canUseInternalMessages ? messageVisibility : forcedMessageVisibility,
        }),
      });

      if (res.ok) {
        const created = await res.json();
        setMessages(current => [created, ...current]);
        setMessageBody('');
        setOutcomeNotice(
          buildActionOutcomeNotice(
            user?.role,
            {
              type: 'message',
              visibility: canUseInternalMessages ? messageVisibility : forcedMessageVisibility,
            },
            workOrder,
          ),
        );
        return;
      }

      const errorData = await res.json().catch(() => ({}));
      Alert.alert('Message failed', errorData.detail || 'Unable to send message.');
    } catch (error) {
      console.error('Message send error:', error);
      Alert.alert('Message failed', error.message || 'Unable to send message.');
    } finally {
      setSendingMessage(false);
    }
  };

  const requestApproval = async () => {
    try {
      setUpdatingApproval(true);
      const res = await authFetch(`/work-orders/${workOrder.id}/approval-request`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({notes: approvalNotes.trim() || null}),
      });

      if (res.ok) {
        const updated = await res.json();
        setWorkOrder(updated);
        setApprovalNotes('');
        await loadMessages();
        setOutcomeNotice(
          buildActionOutcomeNotice(user?.role, {type: 'approval_request'}, updated),
        );
        return;
      }

      const errorData = await res.json().catch(() => ({}));
      Alert.alert('Approval request failed', errorData.detail || 'Unable to request approval.');
    } catch (error) {
      console.error('Approval request error:', error);
      Alert.alert('Approval request failed', error.message || 'Unable to request approval.');
    } finally {
      setUpdatingApproval(false);
    }
  };

  const decideApproval = async decision => {
    try {
      setUpdatingApproval(true);
      const res = await authFetch(`/work-orders/${workOrder.id}/approval`, {
        method: 'PATCH',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({decision, notes: approvalNotes.trim() || null}),
      });

      if (res.ok) {
        const updated = await res.json();
        setWorkOrder(updated);
        setApprovalNotes('');
        await loadMessages();
        setOutcomeNotice(
          buildActionOutcomeNotice(
            user?.role,
            {type: 'approval_decision', decision},
            updated,
          ),
        );
        return;
      }

      const errorData = await res.json().catch(() => ({}));
      Alert.alert('Approval update failed', errorData.detail || 'Unable to update approval.');
    } catch (error) {
      console.error('Approval decision error:', error);
      Alert.alert('Approval update failed', error.message || 'Unable to update approval.');
    } finally {
      setUpdatingApproval(false);
    }
  };

  const ensureImagePermission = async source => {
    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        'Permission needed',
        source === 'camera'
          ? 'Camera access is required to take work order photos.'
          : 'Photo library access is required to attach existing photos.',
      );
      return false;
    }
    return true;
  };

  const pickAttachment = async source => {
    const hasPermission = await ensureImagePermission(source);
    if (!hasPermission) return;

    const launchOptions = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    };

    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync(launchOptions)
        : await ImagePicker.launchImageLibraryAsync(launchOptions);

    if (result.canceled || result.cancelled) return;

    const asset = result.assets?.[0] || result;
    if (!asset?.uri && !asset?.file) {
      Alert.alert('Error', 'No photo was selected.');
      return;
    }

    await uploadAttachment(asset);
  };

  const uploadAttachment = async asset => {
    try {
      setUploadingAttachment(true);
      const formData = new FormData();
      const fileName = buildAttachmentFileName(asset, workOrder.id);
      const contentType = asset.mimeType || inferContentType(fileName);

      if (asset.file) {
        formData.append('file', asset.file);
      } else {
        formData.append('file', {
          uri: asset.uri,
          name: fileName,
          type: contentType,
        });
      }

      const res = await authFetch(`/work-orders/${workOrder.id}/attachments/upload`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const uploaded = await res.json();
        setAttachments(current => [uploaded, ...current]);
        setOutcomeNotice(
          buildActionOutcomeNotice(user?.role, {type: 'attachment'}, workOrder),
        );
        return;
      }

      const errorData = await res.json().catch(() => ({}));
      Alert.alert('Upload failed', errorData.detail || 'Unable to upload attachment.');
    } catch (error) {
      console.error('Attachment upload error:', error);
      Alert.alert('Upload failed', error.message || 'Unable to upload attachment.');
    } finally {
      setUploadingAttachment(false);
    }
  };

  const openAttachment = async attachment => {
    try {
      const supported = await Linking.canOpenURL(attachment.file_url);
      if (!supported) {
        Alert.alert('Unable to open', 'This attachment URL cannot be opened on this device.');
        return;
      }
      await Linking.openURL(attachment.file_url);
    } catch (error) {
      Alert.alert('Unable to open', error.message || 'Attachment could not be opened.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{workOrder.title}</Text>

        <View style={styles.commandPanel}>
          <View style={styles.commandHeader}>
            <Text style={styles.commandTitle}>{roleContext.title}</Text>
            <Text style={styles.commandSubtitle}>{roleContext.subtitle}</Text>
          </View>
          <View style={styles.summaryGrid}>
            {detailSummary.map(item => (
              <View key={item.key} style={styles.summaryTile}>
                <Text style={styles.summaryLabel}>{item.label}</Text>
                <Text
                  style={[
                    styles.summaryValue,
                    {color: getSummaryToneColor(item.tone)},
                  ]}
                  numberOfLines={2}>
                  {item.value}
                </Text>
              </View>
            ))}
          </View>
          <View style={styles.flowPanel}>
            {workOrderFlowRows.map(row => (
              <View
                key={row.key}
                style={styles.flowItem}
                accessible
                accessibilityLabel={`${row.label}: ${row.value}. ${row.detail}`}>
                <Text style={styles.flowLabel}>{row.label}</Text>
                <Text
                  style={[
                    styles.flowValue,
                    {color: getSummaryToneColor(row.tone)},
                  ]}>
                  {row.value}
                </Text>
                <Text style={styles.flowDetail}>{row.detail}</Text>
              </View>
            ))}
          </View>
          <View style={styles.actionPathGrid}>
            {detailActionPathRows.map(row => (
              <View
                key={row.key}
                style={styles.actionPathItem}
                accessible
                accessibilityLabel={`${row.label}: ${row.value}. ${row.detail}`}>
                <Text style={styles.actionPathLabel}>{row.label}</Text>
                <Text
                  style={[
                    styles.actionPathValue,
                    {color: getSummaryToneColor(row.tone)},
                  ]}
                  numberOfLines={1}>
                  {row.value}
                </Text>
                <Text style={styles.actionPathDetail} numberOfLines={2}>
                  {row.detail}
                </Text>
              </View>
            ))}
          </View>
          <View style={styles.eventPlaybook}>
            {roleEventPlaybookRows.map(row => (
              <View
                key={row.key}
                style={styles.eventPlaybookItem}
                accessible
                accessibilityLabel={`${row.label}: ${row.value}. ${row.detail}`}>
                <Text style={styles.eventPlaybookLabel}>{row.label}</Text>
                <Text
                  style={[
                    styles.eventPlaybookValue,
                    {color: getSummaryToneColor(row.tone)},
                  ]}
                  numberOfLines={2}>
                  {row.value}
                </Text>
                <Text style={styles.eventPlaybookDetail} numberOfLines={3}>
                  {row.detail}
                </Text>
              </View>
            ))}
          </View>
          {outcomeNotice ? (
            <View
              style={styles.outcomeNotice}
              accessible
              accessibilityLabel={`Last update: ${outcomeNotice.title}. ${outcomeNotice.detail}`}>
              <View style={styles.outcomeHeader}>
                <Text style={styles.outcomeLabel}>Last Update</Text>
                <TouchableOpacity
                  onPress={() => setOutcomeNotice(null)}
                  {...actionButtonA11y('Dismiss last update', 'Hides the latest action confirmation.')}>
                  <Text style={styles.outcomeDismiss}>Dismiss</Text>
                </TouchableOpacity>
              </View>
              <Text
                style={[
                  styles.outcomeTitle,
                  {color: getSummaryToneColor(outcomeNotice.tone)},
                ]}>
                {outcomeNotice.title}
              </Text>
              <Text style={styles.outcomeDetail}>{outcomeNotice.detail}</Text>
            </View>
          ) : null}
          <View style={styles.guidanceStack}>
            {detailGuidanceRows.map(row => (
              <View key={row.key} style={styles.guidanceRow}>
                <Text style={styles.guidanceLabel}>{row.label}</Text>
                <Text style={styles.guidanceValue}>{row.value}</Text>
              </View>
            ))}
          </View>
          <View style={styles.boundaryStack}>
            {roleBoundaryRows.map(row => (
              <View
                key={row.key}
                style={styles.boundaryRow}
                accessible
                accessibilityLabel={`${row.label}. ${row.value}`}>
                <Text style={styles.boundaryLabel}>{row.label}</Text>
                <Text style={styles.boundaryValue}>{row.value}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Status</Text>
          <View style={styles.statusBadge}>
            <Text style={[styles.statusText, {color: getStatusColor(workOrder.status)}]}>
              {workOrder.status.replace('_', ' ')}
            </Text>
          </View>
        </View>

        {workOrder.priority ? (
          <View style={styles.section}>
            <Text style={styles.label}>Priority</Text>
            <Text style={styles.metaText}>{workOrder.priority}</Text>
          </View>
        ) : null}

        {workOrder.customer_name ? (
          <View style={styles.section}>
            <Text style={styles.label}>Customer</Text>
            <Text style={styles.metaText}>{workOrder.customer_name}</Text>
          </View>
        ) : null}

        {workOrder.address ? (
          <View style={styles.section}>
            <Text style={styles.label}>Address</Text>
            <Text style={styles.metaText}>{workOrder.address}</Text>
          </View>
        ) : null}

        {workOrder.description ? (
          <View style={styles.section}>
            <Text style={styles.label}>Description</Text>
            <Text style={styles.description}>{workOrder.description}</Text>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.label}>Work Order ID</Text>
          <Text style={styles.metaText}>#{workOrder.id}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Client Approval</Text>
          <View style={styles.approvalPanel}>
            <Text
              style={[
                styles.approvalStatus,
                {color: getApprovalColor(workOrder.client_approval_status)},
              ]}>
              {getApprovalLabel(workOrder.client_approval_status)}
            </Text>
            {workOrder.client_approval_notes ? (
              <Text style={styles.approvalNotes}>{workOrder.client_approval_notes}</Text>
            ) : null}

            {(canRequestApproval || canDecideApproval) && (
              <>
                <TextInput
                  style={styles.approvalInput}
                  placeholder={
                    canDecideApproval
                      ? 'Decision note (optional)...'
                      : 'Approval request note (optional)...'
                  }
                  placeholderTextColor="#6b7280"
                  value={approvalNotes}
                  onChangeText={setApprovalNotes}
                  multiline
                />

                {canRequestApproval ? (
                  <TouchableOpacity
                    style={[styles.messageButton, updatingApproval && styles.buttonDisabled]}
                    {...actionButtonA11y(
                      'Request client approval',
                      'Creates a pending client approval request for this work order.',
                    )}
                    onPress={requestApproval}
                    disabled={updatingApproval}>
                    <Text style={styles.messageButtonText}>
                      {updatingApproval ? 'Requesting...' : 'Request Approval'}
                    </Text>
                  </TouchableOpacity>
                ) : null}

                {canDecideApproval ? (
                  <View style={styles.approvalActions}>
                    <TouchableOpacity
                      style={[styles.approveButton, updatingApproval && styles.buttonDisabled]}
                      {...actionButtonA11y(
                        'Approve work order',
                        'Approves the pending client approval request.',
                      )}
                      onPress={() => decideApproval('approved')}
                      disabled={updatingApproval}>
                      <Text style={styles.approveButtonText}>Approve</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.declineButton, updatingApproval && styles.buttonDisabled]}
                      {...actionButtonA11y(
                        'Decline work order',
                        'Declines the pending client approval request.',
                      )}
                      onPress={() => decideApproval('declined')}
                      disabled={updatingApproval}>
                      <Text style={styles.declineButtonText}>Decline</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
              </>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.rowHeader}>
            <Text style={styles.label}>Communication</Text>
            {messagesLoading ? <ActivityIndicator color="#38bdf8" size="small" /> : null}
          </View>

          <View
            style={styles.communicationNotice}
            accessible
            accessibilityLabel={`${communicationNotice.title}. ${communicationNotice.detail}`}>
            <Text style={styles.communicationNoticeTitle}>{communicationNotice.title}</Text>
            <Text style={styles.communicationNoticeDetail}>{communicationNotice.detail}</Text>
          </View>

          {canUseInternalMessages ? (
            <View style={styles.visibilityTabs}>
              <TouchableOpacity
                style={[
                  styles.visibilityTab,
                  messageVisibility === 'internal' && styles.visibilityTabActive,
                ]}
                {...actionButtonA11y(
                  'Internal messages tab',
                  'Shows and sends internal-only work-order messages.',
                )}
                onPress={() => setMessageVisibility('internal')}>
                <Text
                  style={[
                    styles.visibilityTabText,
                    messageVisibility === 'internal' && styles.visibilityTabTextActive,
                  ]}>
                  Internal
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.visibilityTab,
                  messageVisibility === 'client' && styles.visibilityTabActive,
                ]}
                {...actionButtonA11y(
                  'Client-visible messages tab',
                  'Shows and sends messages visible to the linked client.',
                )}
                onPress={() => setMessageVisibility('client')}>
                <Text
                  style={[
                    styles.visibilityTabText,
                    messageVisibility === 'client' && styles.visibilityTabTextActive,
                  ]}>
                  Client
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.visibilityTab,
                  messageVisibility === 'vendor' && styles.visibilityTabActive,
                ]}
                {...actionButtonA11y(
                  'Vendor-visible messages tab',
                  'Shows and sends messages visible to the linked vendor.',
                )}
                onPress={() => setMessageVisibility('vendor')}>
                <Text
                  style={[
                    styles.visibilityTabText,
                    messageVisibility === 'vendor' && styles.visibilityTabTextActive,
                  ]}>
                  Vendor
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {canSendMessages ? (
            <>
              <TextInput
                style={styles.messageInput}
                placeholder="Add a message..."
                placeholderTextColor="#6b7280"
                value={messageBody}
                onChangeText={setMessageBody}
                {...inputA11y('Work-order message', {multiline: true})}
                multiline
              />
              <TouchableOpacity
                style={[styles.messageButton, sendingMessage && styles.buttonDisabled]}
                {...actionButtonA11y(
                  'Send message',
                  canUseInternalMessages
                    ? `Sends a ${messageVisibility} message.`
                    : `Sends a ${getMessageVisibilityLabel(forcedMessageVisibility).toLowerCase()} message.`,
                )}
                onPress={sendMessage}
                disabled={sendingMessage}>
                <Text style={styles.messageButtonText}>
                  {sendingMessage ? 'Sending...' : 'Send Message'}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <Text style={styles.readOnlyNotice}>Viewer access is read-only.</Text>
          )}

          {messagesError ? (
            <ScreenErrorState
              compact
              title="Messages unavailable"
              message={messagesError}
              actionLabel="Retry messages"
              onRetry={loadMessages}
            />
          ) : null}

          {!messagesError && !messagesLoading && messages.length === 0 ? (
            <Text style={styles.emptyAttachments}>No messages yet.</Text>
          ) : null}

          {!messagesError && messages.map(message => (
            <View key={message.id} style={styles.messageItem}>
              <View style={styles.messageHeader}>
                <Text
                  style={[
                    styles.messageBadge,
                    message.visibility === 'client' && styles.messageBadgeClient,
                    message.visibility === 'vendor' && styles.messageBadgeVendor,
                  ]}>
                  {getMessageVisibilityLabel(message.visibility)}
                </Text>
                <Text style={styles.messageDate}>{formatDate(message.created_at)}</Text>
              </View>
              <Text style={styles.messageBody}>{message.body}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.rowHeader}>
            <Text style={styles.label}>Attachments</Text>
            {attachmentsLoading ? <ActivityIndicator color="#38bdf8" size="small" /> : null}
          </View>

          {canUploadAttachments ? (
            <View style={styles.attachmentActions}>
              <TouchableOpacity
                style={[styles.secondaryButton, uploadingAttachment && styles.buttonDisabled]}
                {...actionButtonA11y(
                  'Take proof photo',
                  'Opens the camera to upload work-order proof.',
                )}
                onPress={() => pickAttachment('camera')}
                disabled={uploadingAttachment}>
                <Text style={styles.secondaryButtonText}>
                  {uploadingAttachment ? 'Uploading...' : 'Take Photo'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.secondaryButton, uploadingAttachment && styles.buttonDisabled]}
                {...actionButtonA11y(
                  'Choose proof photo',
                  'Opens the photo library to upload work-order proof.',
                )}
                onPress={() => pickAttachment('library')}
                disabled={uploadingAttachment}>
                <Text style={styles.secondaryButtonText}>Choose Photo</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {attachmentsError ? (
            <ScreenErrorState
              compact
              title="Attachments unavailable"
              message={attachmentsError}
              actionLabel="Retry attachments"
              onRetry={loadAttachments}
            />
          ) : null}

          {!attachmentsError && !attachmentsLoading && attachments.length === 0 ? (
            <Text style={styles.emptyAttachments}>No attachments yet.</Text>
          ) : null}

          {!attachmentsError && attachments.map(attachment => (
            <TouchableOpacity
              key={attachment.id}
              style={styles.attachmentItem}
              {...actionButtonA11y(
                `Open attachment ${attachment.file_name}`,
                'Opens the attachment URL if the device supports it.',
              )}
              onPress={() => openAttachment(attachment)}>
              {isImageAttachment(attachment) ? (
                <Image source={{uri: attachment.file_url}} style={styles.attachmentThumb} />
              ) : (
                <View style={styles.fileBadge}>
                  <Text style={styles.fileBadgeText}>FILE</Text>
                </View>
              )}
              <View style={styles.attachmentTextWrap}>
                <Text style={styles.attachmentName} numberOfLines={1}>
                  {attachment.file_name}
                </Text>
                <Text style={styles.attachmentMeta}>
                  {attachment.content_type || 'attachment'}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {nextStatuses.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.label}>Notes (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Add notes for this status change..."
              placeholderTextColor="#6b7280"
              value={notes}
              onChangeText={setNotes}
              {...inputA11y('Status change notes', {multiline: true})}
              multiline
            />
          </View>
        )}

        <View style={styles.actions}>
          {canEdit && (
            <TouchableOpacity
              style={[styles.editButton, updating && styles.buttonDisabled]}
              {...actionButtonA11y(
                'Edit work order details',
                'Opens the work-order edit form.',
              )}
              onPress={handleEdit}
              disabled={updating}>
              <Text style={styles.editButtonText}>Edit Details</Text>
            </TouchableOpacity>
          )}

          {nextStatuses.map(nextStatus => (
            <TouchableOpacity
              key={nextStatus}
              style={[
                ['cancelled', 'archived'].includes(nextStatus)
                  ? styles.dangerButton
                  : nextStatus === 'paused' || nextStatus === 'escalated'
                    ? styles.secondaryButton
                    : styles.primaryButton,
                updating && styles.buttonDisabled,
              ]}
              {...statusActionA11y(nextStatus, workOrder.status)}
              onPress={() => confirmTransition(nextStatus)}
              disabled={updating}>
              <Text
                style={
                  ['cancelled', 'archived'].includes(nextStatus)
                    ? styles.dangerButtonText
                    : nextStatus === 'paused' || nextStatus === 'escalated'
                      ? styles.secondaryButtonText
                    : styles.primaryButtonText
                }>
                {updating ? 'Updating...' : STATUS_LABELS[nextStatus]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

function buildAttachmentFileName(asset, workOrderId) {
  if (asset.fileName) return asset.fileName;
  if (asset.file?.name) return asset.file.name;

  const extension = inferExtension(asset.mimeType || '') || extensionFromUri(asset.uri) || 'jpg';
  return `work-order-${workOrderId}-${Date.now()}.${extension}`;
}

function inferContentType(fileName) {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.pdf')) return 'application/pdf';
  return 'image/jpeg';
}

function inferExtension(mimeType) {
  if (mimeType === 'image/png') return 'png';
  if (mimeType === 'image/webp') return 'webp';
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') return 'jpg';
  return null;
}

function extensionFromUri(uri = '') {
  const match = uri.match(/\.([A-Za-z0-9]+)(?:\?|$)/);
  return match?.[1]?.toLowerCase();
}

function isImageAttachment(attachment) {
  return (attachment.content_type || '').startsWith('image/');
}

function formatDate(value) {
  if (!value) return 'No date';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'No date';

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050816',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#f9fafb',
    marginBottom: 14,
  },
  commandPanel: {
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1f2937',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  commandHeader: {
    marginBottom: 12,
  },
  commandTitle: {
    color: '#f9fafb',
    fontSize: 16,
    fontWeight: '800',
  },
  commandSubtitle: {
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  summaryTile: {
    flexBasis: '47%',
    flexGrow: 1,
    minHeight: 64,
    justifyContent: 'center',
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 7,
    paddingHorizontal: 10,
  },
  summaryLabel: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 18,
    textTransform: 'capitalize',
    marginTop: 4,
  },
  flowPanel: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  flowItem: {
    flexBasis: '31%',
    flexGrow: 1,
    minHeight: 78,
    backgroundColor: '#07111f',
    borderWidth: 1,
    borderColor: '#243449',
    borderRadius: 8,
    padding: 10,
  },
  flowLabel: {
    color: '#bfdbfe',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  flowValue: {
    fontSize: 15,
    fontWeight: '900',
    lineHeight: 20,
    marginTop: 4,
  },
  flowDetail: {
    color: '#94a3b8',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
  },
  actionPathGrid: {
    borderTopColor: '#1e293b',
    borderTopWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
  },
  actionPathItem: {
    flexBasis: '47%',
    flexGrow: 1,
    minHeight: 72,
    borderLeftColor: '#38bdf8',
    borderLeftWidth: 2,
    paddingLeft: 9,
    paddingRight: 6,
  },
  actionPathLabel: {
    color: '#bfdbfe',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  actionPathValue: {
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 17,
    marginTop: 3,
  },
  actionPathDetail: {
    color: '#94a3b8',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 3,
  },
  eventPlaybook: {
    backgroundColor: '#07111f',
    borderColor: '#243449',
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
    marginTop: 12,
    padding: 12,
  },
  eventPlaybookItem: {
    minHeight: 64,
  },
  eventPlaybookLabel: {
    color: '#bfdbfe',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  eventPlaybookValue: {
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 18,
    marginTop: 3,
  },
  eventPlaybookDetail: {
    color: '#cbd5e1',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },
  outcomeNotice: {
    backgroundColor: '#101827',
    borderColor: '#38bdf8',
    borderLeftWidth: 3,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 12,
    padding: 12,
  },
  outcomeHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  outcomeLabel: {
    color: '#bfdbfe',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  outcomeDismiss: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '800',
  },
  outcomeTitle: {
    fontSize: 15,
    fontWeight: '900',
    lineHeight: 20,
    marginTop: 5,
  },
  outcomeDetail: {
    color: '#cbd5e1',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },
  guidanceStack: {
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    marginTop: 12,
    paddingTop: 10,
    gap: 8,
  },
  guidanceRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  guidanceLabel: {
    width: 112,
    color: '#bfdbfe',
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 16,
    textTransform: 'uppercase',
  },
  guidanceValue: {
    flex: 1,
    color: '#cbd5e1',
    fontSize: 12,
    lineHeight: 17,
  },
  boundaryStack: {
    borderTopColor: '#1e293b',
    borderTopWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
    paddingTop: 10,
  },
  boundaryRow: {
    borderLeftColor: '#a3e635',
    borderLeftWidth: 2,
    flexBasis: '47%',
    flexGrow: 1,
    minHeight: 58,
    paddingLeft: 9,
    paddingRight: 6,
  },
  boundaryLabel: {
    color: '#bfdbfe',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  boundaryValue: {
    color: '#cbd5e1',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9ca3af',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#1f2937',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  description: {
    fontSize: 16,
    color: '#e5e7eb',
    lineHeight: 24,
  },
  metaText: {
    fontSize: 14,
    color: '#e5e7eb',
  },
  approvalPanel: {
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1f2937',
    borderRadius: 8,
    padding: 12,
  },
  approvalStatus: {
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  approvalNotes: {
    color: '#cbd5e1',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
  },
  approvalInput: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#e5e7eb',
    minHeight: 64,
    textAlignVertical: 'top',
    marginTop: 12,
  },
  approvalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  approveButton: {
    flex: 1,
    backgroundColor: '#a3e635',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  approveButtonText: {
    color: '#052e16',
    fontWeight: '800',
    fontSize: 14,
  },
  declineButton: {
    flex: 1,
    backgroundColor: '#1f2937',
    borderWidth: 1,
    borderColor: '#fb7185',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  declineButtonText: {
    color: '#fb7185',
    fontWeight: '800',
    fontSize: 14,
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  visibilityTabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  communicationNotice: {
    backgroundColor: '#07111f',
    borderLeftColor: '#38bdf8',
    borderLeftWidth: 2,
    borderRadius: 8,
    marginBottom: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  communicationNoticeTitle: {
    color: '#bfdbfe',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  communicationNoticeDetail: {
    color: '#cbd5e1',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },
  visibilityTab: {
    minHeight: 44,
    minWidth: 92,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
  },
  visibilityTabActive: {
    backgroundColor: '#38bdf8',
    borderColor: '#38bdf8',
  },
  visibilityTabText: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  visibilityTabTextActive: {
    color: '#050816',
  },
  messageInput: {
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1f2937',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#e5e7eb',
    minHeight: 72,
    textAlignVertical: 'top',
  },
  messageButton: {
    backgroundColor: '#38bdf8',
    minHeight: 44,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  messageButtonText: {
    color: '#050816',
    fontWeight: '700',
    fontSize: 14,
  },
  messageItem: {
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1f2937',
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  messageBadge: {
    color: '#fbbf24',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  messageBadgeClient: {
    color: '#38bdf8',
  },
  messageBadgeVendor: {
    color: '#a3e635',
  },
  readOnlyNotice: {
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 18,
    padding: 12,
  },
  messageDate: {
    color: '#64748b',
    fontSize: 11,
  },
  messageBody: {
    color: '#e5e7eb',
    fontSize: 14,
    lineHeight: 20,
  },
  attachmentActions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#1f2937',
    minHeight: 44,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  secondaryButtonText: {
    color: '#e5e7eb',
    fontWeight: '600',
    fontSize: 14,
    textAlign: 'center',
  },
  emptyAttachments: {
    color: '#9ca3af',
    fontSize: 13,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1f2937',
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
  },
  attachmentThumb: {
    width: 48,
    height: 48,
    borderRadius: 6,
    backgroundColor: '#111827',
  },
  fileBadge: {
    width: 48,
    height: 48,
    borderRadius: 6,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileBadgeText: {
    color: '#9ca3af',
    fontSize: 10,
    fontWeight: '700',
  },
  attachmentTextWrap: {
    flex: 1,
    marginLeft: 10,
  },
  attachmentName: {
    color: '#e5e7eb',
    fontSize: 14,
    fontWeight: '600',
  },
  attachmentMeta: {
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 2,
  },
  input: {
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1f2937',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#e5e7eb',
    minHeight: 60,
    textAlignVertical: 'top',
  },
  actions: {
    marginTop: 12,
    gap: 12,
  },
  editButton: {
    backgroundColor: '#1f2937',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#e5e7eb',
    fontWeight: '600',
    fontSize: 16,
  },
  primaryButton: {
    backgroundColor: '#38bdf8',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#050816',
    fontWeight: '600',
    fontSize: 16,
  },
  dangerButton: {
    backgroundColor: '#1f2937',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  dangerButtonText: {
    color: '#ef4444',
    fontWeight: '600',
    fontSize: 16,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});

export default WorkOrderDetailsScreen;
