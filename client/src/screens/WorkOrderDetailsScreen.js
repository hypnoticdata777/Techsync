import React, {useCallback, useEffect, useState} from 'react';
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

// Helper function to get status color
const getStatusColor = status => {
  switch (status) {
    case 'open':
      return '#fbbf24'; // yellow
    case 'in_progress':
      return '#38bdf8'; // blue
    case 'completed':
      return '#a3e635'; // green
    case 'cancelled':
      return '#ef4444'; // red
    default:
      return '#9ca3af'; // gray
  }
};

// RF-18: only these transitions are legal, mirrors server/models/work_order.py
const ALLOWED_TRANSITIONS = {
  open: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled', 'open'],
  completed: [],
  cancelled: [],
};

const STATUS_LABELS = {
  open: 'Open',
  in_progress: 'Start Work',
  completed: 'Mark Completed',
  cancelled: 'Cancel',
};

function WorkOrderDetailsScreen({route, navigation}) {
  const {user, authFetch} = useAuth();
  const [workOrder, setWorkOrder] = useState(route.params.workOrder);
  const [notes, setNotes] = useState('');
  const [updating, setUpdating] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [attachmentsLoading, setAttachmentsLoading] = useState(true);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);

  const canEdit = user?.role === 'org_admin' || user?.role === 'coordinator';
  const nextStatuses = ALLOWED_TRANSITIONS[workOrder.status] || [];

  const loadAttachments = useCallback(async () => {
    try {
      setAttachmentsLoading(true);
      const res = await authFetch(`/work-orders/${workOrder.id}/attachments`);
      if (res.ok) {
        const data = await res.json();
        setAttachments(data);
      }
    } catch (error) {
      console.error('Attachment load error:', error);
    } finally {
      setAttachmentsLoading(false);
    }
  }, [authFetch, workOrder.id]);

  useEffect(() => {
    loadAttachments();
  }, [loadAttachments]);

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
    if (newStatus === 'cancelled') {
      Alert.alert('Cancel work order?', 'This cannot be undone.', [
        {text: 'No', style: 'cancel'},
        {text: 'Yes, cancel', style: 'destructive', onPress: () => handleTransition(newStatus)},
      ]);
      return;
    }
    handleTransition(newStatus);
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
        Alert.alert('Attached', 'Photo added to the work order.');
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
          <View style={styles.attachmentHeader}>
            <Text style={styles.label}>Attachments</Text>
            {attachmentsLoading ? <ActivityIndicator color="#38bdf8" size="small" /> : null}
          </View>

          <View style={styles.attachmentActions}>
            <TouchableOpacity
              style={[styles.secondaryButton, uploadingAttachment && styles.buttonDisabled]}
              onPress={() => pickAttachment('camera')}
              disabled={uploadingAttachment}>
              <Text style={styles.secondaryButtonText}>
                {uploadingAttachment ? 'Uploading...' : 'Take Photo'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.secondaryButton, uploadingAttachment && styles.buttonDisabled]}
              onPress={() => pickAttachment('library')}
              disabled={uploadingAttachment}>
              <Text style={styles.secondaryButtonText}>Choose Photo</Text>
            </TouchableOpacity>
          </View>

          {!attachmentsLoading && attachments.length === 0 ? (
            <Text style={styles.emptyAttachments}>No attachments yet.</Text>
          ) : null}

          {attachments.map(attachment => (
            <TouchableOpacity
              key={attachment.id}
              style={styles.attachmentItem}
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
              multiline
            />
          </View>
        )}

        <View style={styles.actions}>
          {canEdit && (
            <TouchableOpacity
              style={[styles.editButton, updating && styles.buttonDisabled]}
              onPress={handleEdit}
              disabled={updating}>
              <Text style={styles.editButtonText}>Edit Details</Text>
            </TouchableOpacity>
          )}

          {nextStatuses.map(nextStatus => (
            <TouchableOpacity
              key={nextStatus}
              style={[
                nextStatus === 'cancelled' ? styles.dangerButton : styles.primaryButton,
                updating && styles.buttonDisabled,
              ]}
              onPress={() => confirmTransition(nextStatus)}
              disabled={updating}>
              <Text
                style={
                  nextStatus === 'cancelled'
                    ? styles.dangerButtonText
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
    marginBottom: 24,
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
  attachmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  attachmentActions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#1f2937',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  secondaryButtonText: {
    color: '#e5e7eb',
    fontWeight: '600',
    fontSize: 14,
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
