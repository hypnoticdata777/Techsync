import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {useAuth} from '../context/AuthContext';
import HintBubble from '../components/HintBubble';
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
  buildDetailSectionReadinessRows,
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
      return '#b98524'; // yellow
    case 'in_progress':
      return '#2f6f9f'; // blue
    case 'paused':
      return '#b86b2b'; // orange
    case 'escalated':
      return '#b24a3a'; // rose
    case 'completed':
      return '#5f8f62'; // green
    case 'cancelled':
      return '#b24a3a'; // red
    case 'archived':
      return '#655d52'; // slate
    default:
      return '#655d52'; // gray
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
const DETAIL_SECTION_LABELS = {
  approval: 'Client Approval',
  communication: 'Communication',
  proof: 'Attachments',
  lifecycle: 'Lifecycle Actions',
};

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
      return '#b98524';
    case 'approved':
      return '#5f8f62';
    case 'declined':
      return '#b24a3a';
    default:
      return '#655d52';
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
      return '#b98524';
    case 'in_progress':
    case 'active':
      return '#2f6f9f';
    case 'completed':
    case 'approved':
    case 'verified':
      return '#5f8f62';
    case 'cancelled':
    case 'declined':
    case 'escalated':
      return '#b24a3a';
    case 'paused':
    case 'override':
      return '#b86b2b';
    case 'archived':
      return '#655d52';
    default:
      return '#655d52';
  }
};

const SectionReadiness = ({row}) => {
  if (!row) return null;

  return (
    <View
      style={[
        styles.sectionReadiness,
        {borderLeftColor: getSummaryToneColor(row.tone)},
      ]}
      accessible
      accessibilityLabel={`${row.label}. ${row.value}. ${row.detail}`}>
      <View style={styles.inlineHelpRow}>
        <Text style={styles.sectionReadinessLabel}>{row.label}</Text>
        <HintBubble label={row.label} text={row.detail} align="left" />
      </View>
      <Text
        style={[
          styles.sectionReadinessValue,
          {color: getSummaryToneColor(row.tone)},
        ]}>
        {row.value}
      </Text>
    </View>
  );
};

const readableStatus = value =>
  value ? String(value).replace(/_/g, ' ') : 'Not recorded';

const firstPresent = values =>
  values.find(value => value !== undefined && value !== null && String(value).trim() !== '');

function buildWorkOrderStoryRows(workOrder, attachments, messages) {
  const requester = firstPresent([
    workOrder.customer_name,
    workOrder.client_name,
    workOrder.property_name,
    'Client request',
  ]);
  const location = firstPresent([
    workOrder.address,
    workOrder.property_name,
    workOrder.property_id ? `Property #${workOrder.property_id}` : null,
  ]);
  const assignedOwner = firstPresent([
    workOrder.technician_name,
    workOrder.assigned_technician_name,
    workOrder.assigned_technician_id ? `Technician #${workOrder.assigned_technician_id}` : null,
    workOrder.vendor_name,
  ]);
  const scheduledFor = firstPresent([
    workOrder.scheduled_for,
    workOrder.scheduled_at,
    workOrder.due_at,
    workOrder.due_date,
  ]);
  const proofImages = attachments.filter(isImageAttachment).length;
  const latestMessage = [...messages].sort(
    (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0),
  )[0];

  return [
    {
      key: 'intake',
      label: '1. Intake',
      value: formatDate(workOrder.created_at),
      detail: `${requester} opened the request${location ? ` for ${location}` : ''}.`,
      tone: 'active',
    },
    {
      key: 'schedule',
      label: '2. Schedule',
      value: scheduledFor ? formatDate(scheduledFor) : 'No scheduled window',
      detail: scheduledFor
        ? 'The field window is captured for planning and expectation setting.'
        : 'Add a scheduled window when operations needs client or technician timing clarity.',
      tone: scheduledFor ? 'verified' : 'pending',
    },
    {
      key: 'assignment',
      label: '3. Assignment',
      value: assignedOwner || 'Not assigned',
      detail: workOrder.vendor_name
        ? `Vendor context: ${workOrder.vendor_name}.`
        : 'Assignment should identify the technician or vendor responsible for the next move.',
      tone: assignedOwner ? 'verified' : 'pending',
    },
    {
      key: 'field',
      label: '4. Field Work',
      value: readableStatus(workOrder.status),
      detail: workOrder.completed_at
        ? `Completed ${formatDate(workOrder.completed_at)}.`
        : 'Status changes and notes should explain how the work progressed.',
      tone: workOrder.status,
    },
    {
      key: 'proof',
      label: '5. Proof',
      value: `${attachments.length} attachment${attachments.length === 1 ? '' : 's'}`,
      detail: `${proofImages} photo${proofImages === 1 ? '' : 's'} and ${
        messages.length
      } message${messages.length === 1 ? '' : 's'} are tied to this record.`,
      tone: attachments.length > 0 || workOrder.completion_proof_verified_at ? 'verified' : 'missing',
    },
    {
      key: 'latest',
      label: '6. Latest Update',
      value: latestMessage ? formatDate(latestMessage.created_at) : 'No messages yet',
      detail: latestMessage
        ? `${readableStatus(latestMessage.visibility)} lane: ${latestMessage.body}`
        : 'Use the communication lane below to record the next stakeholder-facing update.',
      tone: latestMessage ? 'active' : 'pending',
    },
  ];
}

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
  const scrollRef = useRef(null);
  const sectionOffsets = useRef({});

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
  const detailSectionReadinessRows = useMemo(
    () =>
      buildDetailSectionReadinessRows(
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
    () => buildWorkOrderFlowRows(workOrder, user?.role),
    [user?.role, workOrder],
  );
  const workOrderStoryRows = useMemo(
    () => buildWorkOrderStoryRows(workOrder, attachments, messages),
    [attachments, messages, workOrder],
  );
  const roleBoundaryRows = useMemo(
    () => buildRoleBoundaryRows(user?.role),
    [user?.role],
  );
  const communicationNotice = useMemo(
    () => getCommunicationLaneNotice(user?.role, messageVisibility),
    [messageVisibility, user?.role],
  );
  const handleSectionLayout = (key, event) => {
    sectionOffsets.current[key] = event.nativeEvent.layout.y;
  };
  const jumpToSection = key => {
    const y = sectionOffsets.current[key];
    if (typeof y === 'number') {
      scrollRef.current?.scrollTo({y: Math.max(y - 12, 0), animated: true});
    }
  };

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
    <ScrollView ref={scrollRef} style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{workOrder.title}</Text>

        <View style={styles.commandPanel}>
          <View style={styles.commandHeader}>
            <View style={styles.panelTitleRow}>
              <Text style={styles.commandTitle}>{roleContext.title}</Text>
              <HintBubble
                label={roleContext.title}
                text={roleContext.subtitle}
              />
            </View>
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
                <View style={styles.inlineHelpRow}>
                  <Text style={styles.flowLabel}>{row.label}</Text>
                  <HintBubble label={row.label} text={row.detail} align="left" />
                </View>
                <Text
                  style={[
                    styles.flowValue,
                    {color: getSummaryToneColor(row.tone)},
                  ]}>
                  {row.value}
                </Text>
              </View>
            ))}
          </View>
          <View style={styles.storyPanel}>
            <View style={styles.storyHeader}>
              <View style={styles.panelTitleRow}>
                <Text style={styles.storyTitle}>Work Story</Text>
                <HintBubble
                  label="Work Story"
                  text="Shows the work order path from intake through schedule, assignment, field progress, messages, and proof."
                />
              </View>
            </View>
            <View style={styles.storyGrid}>
              {workOrderStoryRows.map(row => (
                <View
                  key={row.key}
                  style={[
                    styles.storyStep,
                    {borderLeftColor: getSummaryToneColor(row.tone)},
                  ]}
                  accessible
                  accessibilityLabel={`${row.label}. ${row.value}. ${row.detail}`}>
                  <View style={styles.inlineHelpRow}>
                    <Text style={styles.storyStepLabel}>{row.label}</Text>
                    <HintBubble label={row.label} text={row.detail} align="left" />
                  </View>
                  <Text
                    style={[styles.storyStepValue, {color: getSummaryToneColor(row.tone)}]}
                    numberOfLines={2}>
                    {row.value}
                  </Text>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.actionPathGrid}>
            {detailActionPathRows.map(row => (
              <Pressable
                key={row.key}
                style={({hovered, pressed}) => [
                  styles.actionPathItem,
                  (hovered || pressed) && styles.actionPathItemInteractive,
                ]}
                onPress={() => jumpToSection(row.target)}
                accessible
                accessibilityRole="button"
                accessibilityLabel={`${row.label}: ${row.value}. ${row.detail} Jump to ${DETAIL_SECTION_LABELS[row.target] || 'section'}.`}>
                <View style={styles.inlineHelpRow}>
                  <Text style={styles.actionPathLabel}>{row.label}</Text>
                  <HintBubble label={row.label} text={row.detail} align="left" />
                </View>
                <Text
                  style={[
                    styles.actionPathValue,
                    {color: getSummaryToneColor(row.tone)},
                  ]}
                  numberOfLines={1}>
                  {row.value}
                </Text>
                <Text style={styles.actionPathJump}>Jump</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.eventPlaybook}>
            {roleEventPlaybookRows.map(row => (
              <View
                key={row.key}
                style={styles.eventPlaybookItem}
                accessible
                accessibilityLabel={`${row.label}: ${row.value}. ${row.detail}`}>
                <View style={styles.inlineHelpRow}>
                  <Text style={styles.eventPlaybookLabel}>{row.label}</Text>
                  <HintBubble label={row.label} text={row.detail} align="left" />
                </View>
                <Text
                  style={[
                    styles.eventPlaybookValue,
                    {color: getSummaryToneColor(row.tone)},
                  ]}
                  numberOfLines={2}>
                  {row.value}
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
              <View style={styles.inlineHelpRow}>
                <HintBubble label="Last Update" text={outcomeNotice.detail} align="left" />
              </View>
            </View>
          ) : null}
          <View style={styles.guidanceStack}>
            {detailGuidanceRows.map(row => (
              <View key={row.key} style={styles.guidanceRow}>
                <View style={styles.inlineHelpRow}>
                  <Text style={styles.guidanceLabel}>{row.label}</Text>
                  <HintBubble label={row.label} text={row.value} align="left" />
                </View>
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

        <View style={styles.section} onLayout={event => handleSectionLayout('approval', event)}>
          <Text style={styles.label}>Client Approval</Text>
          <SectionReadiness row={detailSectionReadinessRows.approval} />
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
                  placeholderTextColor="#8a7f70"
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

        <View style={styles.section} onLayout={event => handleSectionLayout('communication', event)}>
          <View style={styles.rowHeader}>
            <Text style={styles.label}>Communication</Text>
            {messagesLoading ? <ActivityIndicator color="#2f6f9f" size="small" /> : null}
          </View>
          <SectionReadiness row={detailSectionReadinessRows.communication} />

          <View
            style={styles.communicationNotice}
            accessible
            accessibilityLabel={`${communicationNotice.title}. ${communicationNotice.detail}`}>
            <View style={styles.inlineHelpRow}>
              <Text style={styles.communicationNoticeTitle}>{communicationNotice.title}</Text>
              <HintBubble
                label={communicationNotice.title}
                text={communicationNotice.detail}
                align="left"
              />
            </View>
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
                placeholderTextColor="#8a7f70"
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

        <View style={styles.section} onLayout={event => handleSectionLayout('proof', event)}>
          <View style={styles.rowHeader}>
            <Text style={styles.label}>Attachments</Text>
            {attachmentsLoading ? <ActivityIndicator color="#2f6f9f" size="small" /> : null}
          </View>
          <SectionReadiness row={detailSectionReadinessRows.proof} />

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
              placeholderTextColor="#8a7f70"
              value={notes}
              onChangeText={setNotes}
              {...inputA11y('Status change notes', {multiline: true})}
              multiline
            />
          </View>
        )}

        <View style={styles.actions} onLayout={event => handleSectionLayout('lifecycle', event)}>
          <SectionReadiness row={detailSectionReadinessRows.lifecycle} />
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
    backgroundColor: '#f1eadf',
  },
  content: {
    padding: 16,
    width: '100%',
    maxWidth: 1360,
    alignSelf: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#182532',
    marginBottom: 14,
  },
  commandPanel: {
    backgroundColor: '#fbf4e8',
    borderWidth: 1,
    borderColor: '#d2c2aa',
    borderRadius: 6,
    padding: 10,
    marginBottom: 14,
  },
  commandHeader: {
    marginBottom: 12,
  },
  panelTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'space-between',
  },
  inlineHelpRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: 6,
    justifyContent: 'space-between',
    minHeight: 18,
    overflow: 'visible',
  },
  commandTitle: {
    color: '#182532',
    fontSize: 16,
    fontWeight: '800',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  summaryTile: {
    flexBasis: '47%',
    flexGrow: 1,
    minHeight: 52,
    justifyContent: 'center',
    backgroundColor: '#f6eddf',
    borderWidth: 1,
    borderColor: '#d2c2aa',
    borderRadius: 5,
    paddingHorizontal: 10,
  },
  summaryLabel: {
    color: '#655d52',
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
    minHeight: 56,
    backgroundColor: '#fbf4e8',
    borderWidth: 1,
    borderColor: '#bfae94',
    borderRadius: 6,
    overflow: 'visible',
    padding: 9,
  },
  flowLabel: {
    color: '#2f6f9f',
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
    color: '#655d52',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
  },
  storyPanel: {
    backgroundColor: '#eee3d2',
    borderColor: '#bfae94',
    borderRadius: 6,
    borderWidth: 1,
    marginTop: 12,
    overflow: 'visible',
    padding: 10,
  },
  storyHeader: {
    borderBottomColor: '#d2c2aa',
    borderBottomWidth: 1,
    marginBottom: 10,
    paddingBottom: 8,
  },
  storyTitle: {
    color: '#182532',
    fontSize: 15,
    fontWeight: '900',
  },
  storyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  storyStep: {
    backgroundColor: '#fbf4e8',
    borderColor: '#d2c2aa',
    borderLeftWidth: 3,
    borderRadius: 5,
    borderWidth: 1,
    flexBasis: '31%',
    flexGrow: 1,
    minHeight: 76,
    minWidth: 190,
    overflow: 'visible',
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  storyStepLabel: {
    color: '#2f6f9f',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  storyStepValue: {
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 18,
    marginTop: 4,
    textTransform: 'capitalize',
  },
  storyStepDetail: {
    color: '#574f45',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
  },
  actionPathGrid: {
    borderTopColor: '#d2c2aa',
    borderTopWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
  },
  actionPathItem: {
    backgroundColor: '#fbf4e8',
    borderColor: '#bfae94',
    borderRadius: 6,
    borderWidth: 1,
    flexBasis: '47%',
    flexGrow: 1,
    minHeight: 56,
    borderLeftColor: '#2f6f9f',
    borderLeftWidth: 2,
    overflow: 'visible',
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  actionPathItemInteractive: {
    backgroundColor: '#efe3d1',
    borderColor: '#2f6f9f',
    shadowColor: '#2f6f9f',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: {width: 0, height: 2},
  },
  actionPathLabel: {
    color: '#2f6f9f',
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
    color: '#655d52',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 3,
  },
  actionPathJump: {
    alignSelf: 'flex-start',
    color: '#2f6f9f',
    fontSize: 10,
    fontWeight: '900',
    marginTop: 6,
    textTransform: 'uppercase',
  },
  eventPlaybook: {
    backgroundColor: '#fbf4e8',
    borderColor: '#bfae94',
    borderRadius: 6,
    borderWidth: 1,
    gap: 10,
    marginTop: 12,
    overflow: 'visible',
    padding: 10,
  },
  eventPlaybookItem: {
    minHeight: 44,
    overflow: 'visible',
  },
  eventPlaybookLabel: {
    color: '#2f6f9f',
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
    color: '#4f5f6f',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },
  outcomeNotice: {
    backgroundColor: '#eee3d2',
    borderColor: '#2f6f9f',
    borderLeftWidth: 3,
    borderRadius: 6,
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
    color: '#2f6f9f',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  outcomeDismiss: {
    color: '#2f6f9f',
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
    color: '#4f5f6f',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },
  guidanceStack: {
    borderTopWidth: 1,
    borderTopColor: '#d2c2aa',
    marginTop: 12,
    paddingTop: 10,
    gap: 8,
  },
  guidanceRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    overflow: 'visible',
  },
  guidanceLabel: {
    width: 112,
    color: '#2f6f9f',
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 16,
    textTransform: 'uppercase',
  },
  guidanceValue: {
    flex: 1,
    color: '#4f5f6f',
    fontSize: 12,
    lineHeight: 17,
  },
  boundaryStack: {
    borderTopColor: '#d2c2aa',
    borderTopWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
    paddingTop: 10,
  },
  boundaryRow: {
    borderLeftColor: '#5f8f62',
    borderLeftWidth: 2,
    flexBasis: '47%',
    flexGrow: 1,
    minHeight: 58,
    paddingLeft: 9,
    paddingRight: 6,
  },
  boundaryLabel: {
    color: '#2f6f9f',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  boundaryValue: {
    color: '#4f5f6f',
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
    color: '#655d52',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#d2c2aa',
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
    color: '#27313d',
    lineHeight: 24,
  },
  metaText: {
    fontSize: 14,
    color: '#27313d',
  },
  approvalPanel: {
    backgroundColor: '#fbf4e8',
    borderWidth: 1,
    borderColor: '#d2c2aa',
    borderRadius: 8,
    padding: 12,
  },
  approvalStatus: {
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  approvalNotes: {
    color: '#4f5f6f',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
  },
  sectionReadiness: {
    backgroundColor: '#fbf4e8',
    borderLeftWidth: 3,
    borderRadius: 8,
    marginBottom: 10,
    overflow: 'visible',
    paddingHorizontal: 11,
    paddingVertical: 10,
  },
  sectionReadinessLabel: {
    color: '#2f6f9f',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  sectionReadinessValue: {
    fontSize: 14,
    fontWeight: '900',
    marginTop: 4,
  },
  sectionReadinessDetail: {
    color: '#4f5f6f',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },
  approvalInput: {
    backgroundColor: '#f6eddf',
    borderWidth: 1,
    borderColor: '#bfae94',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#27313d',
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
    backgroundColor: '#5f8f62',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  approveButtonText: {
    color: '#e4f0e2',
    fontWeight: '800',
    fontSize: 14,
  },
  declineButton: {
    flex: 1,
    backgroundColor: '#d2c2aa',
    borderWidth: 1,
    borderColor: '#b24a3a',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  declineButtonText: {
    color: '#b24a3a',
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
    backgroundColor: '#fbf4e8',
    borderLeftColor: '#2f6f9f',
    borderLeftWidth: 2,
    borderRadius: 8,
    marginBottom: 10,
    overflow: 'visible',
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  communicationNoticeTitle: {
    color: '#2f6f9f',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  communicationNoticeDetail: {
    color: '#4f5f6f',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },
  visibilityTab: {
    minHeight: 44,
    minWidth: 92,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f6eddf',
    borderWidth: 1,
    borderColor: '#bfae94',
    borderRadius: 8,
  },
  visibilityTabActive: {
    backgroundColor: '#2f6f9f',
    borderColor: '#2f6f9f',
  },
  visibilityTabText: {
    color: '#4f5f6f',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  visibilityTabTextActive: {
    color: '#f1eadf',
  },
  messageInput: {
    backgroundColor: '#fbf4e8',
    borderWidth: 1,
    borderColor: '#d2c2aa',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#27313d',
    minHeight: 72,
    textAlignVertical: 'top',
  },
  messageButton: {
    backgroundColor: '#2f6f9f',
    minHeight: 44,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  messageButtonText: {
    color: '#f1eadf',
    fontWeight: '700',
    fontSize: 14,
  },
  messageItem: {
    backgroundColor: '#fbf4e8',
    borderWidth: 1,
    borderColor: '#d2c2aa',
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
    color: '#b98524',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  messageBadgeClient: {
    color: '#2f6f9f',
  },
  messageBadgeVendor: {
    color: '#5f8f62',
  },
  readOnlyNotice: {
    backgroundColor: '#fbf4e8',
    borderWidth: 1,
    borderColor: '#bfae94',
    borderRadius: 8,
    color: '#655d52',
    fontSize: 13,
    lineHeight: 18,
    padding: 12,
  },
  messageDate: {
    color: '#655d52',
    fontSize: 11,
  },
  messageBody: {
    color: '#27313d',
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
    backgroundColor: '#d2c2aa',
    minHeight: 44,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#bfae94',
  },
  secondaryButtonText: {
    color: '#27313d',
    fontWeight: '600',
    fontSize: 14,
    textAlign: 'center',
  },
  emptyAttachments: {
    color: '#655d52',
    fontSize: 13,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fbf4e8',
    borderWidth: 1,
    borderColor: '#d2c2aa',
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
  },
  attachmentThumb: {
    width: 48,
    height: 48,
    borderRadius: 6,
    backgroundColor: '#efe6d6',
  },
  fileBadge: {
    width: 48,
    height: 48,
    borderRadius: 6,
    backgroundColor: '#efe6d6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileBadgeText: {
    color: '#655d52',
    fontSize: 10,
    fontWeight: '700',
  },
  attachmentTextWrap: {
    flex: 1,
    marginLeft: 10,
  },
  attachmentName: {
    color: '#27313d',
    fontSize: 14,
    fontWeight: '600',
  },
  attachmentMeta: {
    color: '#655d52',
    fontSize: 12,
    marginTop: 2,
  },
  input: {
    backgroundColor: '#fbf4e8',
    borderWidth: 1,
    borderColor: '#d2c2aa',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#27313d',
    minHeight: 60,
    textAlignVertical: 'top',
  },
  actions: {
    marginTop: 12,
    gap: 12,
  },
  editButton: {
    backgroundColor: '#d2c2aa',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#27313d',
    fontWeight: '600',
    fontSize: 16,
  },
  primaryButton: {
    backgroundColor: '#2f6f9f',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#f1eadf',
    fontWeight: '600',
    fontSize: 16,
  },
  dangerButton: {
    backgroundColor: '#d2c2aa',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#b24a3a',
  },
  dangerButtonText: {
    color: '#b24a3a',
    fontWeight: '600',
    fontSize: 16,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});

export default WorkOrderDetailsScreen;
