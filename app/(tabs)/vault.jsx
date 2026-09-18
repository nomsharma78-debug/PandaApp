import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Linking,
  Switch,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { AlertModal } from '../../components/ui/AlertModal';
import { vaultApi } from '../../services/api';
import {
  KeyRound,
  CreditCard,
  FileText,
  UserCheck,
  Layers,
  Search,
  Plus,
  Trash2,
  Pencil,
  Eye,
  EyeOff,
  Copy,
  Check,
  ExternalLink,
  Lock,
  X,
  Sparkles,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react-native';

const TABS = [
  { id: 'all', label: 'All', icon: Layers, color: '#94a3b8' },
  { id: 'login', label: 'Passwords', icon: KeyRound, color: '#2dd4bf' },
  { id: 'card', label: 'Cards', icon: CreditCard, color: '#818cf8' },
  { id: 'note', label: 'Notes', icon: FileText, color: '#34d399' },
  { id: 'identity', label: 'Identities', icon: UserCheck, color: '#fbbf24' },
];

export default function VaultScreen() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [visibleMap, setVisibleMap] = useState({});
  const [copiedMap, setCopiedMap] = useState({});

  // Modal State (Add & Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [modalType, setModalType] = useState('login');
  const [title, setTitle] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [url, setUrl] = useState('');
  const [cardholder, setCardholder] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [fullName, setFullName] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [saving, setSaving] = useState(false);

  // Password Generator State
  const [showGenerator, setShowGenerator] = useState(false);
  const [genLength, setGenLength] = useState(16);
  const [genSymbols, setGenSymbols] = useState(true);
  const [genNumbers, setGenNumbers] = useState(true);
  const [generatedPass, setGeneratedPass] = useState('');

  const parseItem = (item) => {
    let payload = item.decryptedPayload || item.payload || {};
    if (typeof payload === 'string') {
      try { payload = JSON.parse(payload); } catch {}
    }
    if (payload.data && typeof payload.data === 'object') {
      payload = payload.data;
    }
    if (typeof item.encrypted_payload === 'string' && (!payload || Object.keys(payload).length === 0)) {
      try {
        const parsed = JSON.parse(item.encrypted_payload);
        payload = parsed.data || parsed;
      } catch {}
    }

    return {
      title: item.title || payload.title || payload.name || 'Encrypted Item',
      username: payload.username || payload.email || payload.identifier || item.username || '',
      password: payload.password || payload.secret || payload.pin || item.password || '',
      url: payload.url || item.url || '',
      cardholder: payload.cardholder || '',
      cardNumber: payload.cardNumber || '',
      cardExpiry: payload.cardExpiry || '',
      cardCvv: payload.cardCvv || '',
      content: payload.content || payload.notes || item.notes || '',
      fullName: payload.fullName || '',
      idNumber: payload.idNumber || '',
    };
  };

  const fetchVaultItems = async () => {
    setLoading(true);
    try {
      const res = await vaultApi.list(activeFilter === 'all' ? null : activeFilter);
      const list = res?.items || res?.data || (Array.isArray(res) ? res : []);
      setItems(list);
    } catch (err) {
      console.warn('Vault fetch note:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVaultItems();
  }, [activeFilter]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchVaultItems();
    setRefreshing(false);
  };

  // Copy to clipboard with visual feedback
  const handleCopy = async (text, key) => {
    if (!text) return;
    await Clipboard.setStringAsync(text);
    setCopiedMap((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setCopiedMap((prev) => ({ ...prev, [key]: false }));
    }, 2000);
  };

  const toggleVisibility = (key) => {
    setVisibleMap((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Password Generator
  const generatePassword = () => {
    let chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (genNumbers) chars += '0123456789';
    if (genSymbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    let result = '';
    for (let i = 0; i < genLength; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setGeneratedPass(result);
  };

  useEffect(() => {
    if (showGenerator) {
      generatePassword();
    }
  }, [showGenerator, genLength, genSymbols, genNumbers]);

  const openAddModal = () => {
    setEditItem(null);
    setModalType(activeFilter === 'all' ? 'login' : activeFilter);
    setTitle('');
    setUsername('');
    setPassword('');
    setUrl('');
    setCardholder('');
    setCardNumber('');
    setCardExpiry('');
    setCardCvv('');
    setNoteContent('');
    setFullName('');
    setIdNumber('');
    setShowGenerator(false);
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditItem(item);
    setModalType(item.type || 'login');
    const details = parseItem(item);
    setTitle(details.title);
    setUsername(details.username);
    setPassword(details.password);
    setUrl(details.url);
    setCardholder(details.cardholder);
    setCardNumber(details.cardNumber);
    setCardExpiry(details.cardExpiry);
    setCardCvv(details.cardCvv);
    setNoteContent(details.content);
    setFullName(details.fullName);
    setIdNumber(details.idNumber);
    setShowGenerator(false);
    setIsModalOpen(true);
  };

  // Custom Alert Modal State
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'info',
    buttons: [],
  });

  const showAlert = (title, message, type = 'info', buttons = [{ text: 'OK' }]) => {
    setAlertConfig({
      visible: true,
      title,
      message,
      type,
      buttons,
    });
  };

  const closeAlert = () => {
    setAlertConfig((prev) => ({ ...prev, visible: false }));
  };

  const handleSave = async () => {
    if (!title.trim()) {
      showAlert('Validation Error', 'Title / Name is required', 'warning');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        type: modalType,
        username: username.trim(),
        password,
        url: url.trim(),
        cardholder: cardholder.trim(),
        cardNumber: cardNumber.trim(),
        cardExpiry: cardExpiry.trim(),
        cardCvv: cardCvv.trim(),
        content: noteContent.trim(),
        fullName: fullName.trim(),
        idNumber: idNumber.trim(),
      };

      if (editItem) {
        await vaultApi.update(editItem.id, payload);
      } else {
        await vaultApi.create(payload);
      }

      setIsModalOpen(false);
      fetchVaultItems();
    } catch (err) {
      showAlert('Error', err.message || 'Failed to save item', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id) => {
    showAlert(
      'Delete Encrypted Item',
      'Are you sure you want to permanently delete this secret from your vault?',
      'warning',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await vaultApi.delete(id);
              fetchVaultItems();
            } catch (err) {
              showAlert('Error', err.message || 'Could not delete item', 'error');
            }
          },
        },
      ]
    );
  };

  const filteredItems = items.filter((item) => {
    const details = parseItem(item);
    const q = search.toLowerCase();
    return (
      details.title.toLowerCase().includes(q) ||
      details.username.toLowerCase().includes(q) ||
      details.content.toLowerCase().includes(q)
    );
  });

  const getCategoryConfig = (type) => {
    switch (type) {
      case 'card':
        return { icon: CreditCard, label: 'Card', color: '#818cf8', bg: 'rgba(129, 140, 248, 0.12)' };
      case 'note':
        return { icon: FileText, label: 'Note', color: '#34d399', bg: 'rgba(52, 211, 153, 0.12)' };
      case 'identity':
        return { icon: UserCheck, label: 'Identity', color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.12)' };
      default:
        return { icon: KeyRound, label: 'Password', color: '#2dd4bf', bg: 'rgba(45, 212, 191, 0.12)' };
    }
  };

  const categoryCounts = useMemo(() => {
    const counts = { all: items.length, login: 0, card: 0, note: 0, identity: 0 };
    items.forEach((item) => {
      const t = (item.type || 'login').toLowerCase();
      if (counts[t] !== undefined) counts[t]++;
    });
    return counts;
  }, [items]);

  return (
    <ScreenWrapper
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#2dd4bf"
          colors={['#2dd4bf']}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Personal Vault</Text>
          <Text style={styles.headerSubtitle}>AES-256-GCM Zero-Knowledge Storage</Text>
        </View>
        <Button size="sm" icon={Plus} onPress={openAddModal}>
          New
        </Button>
      </View>

      {/* Search Input */}
      <View style={styles.searchBar}>
        <Search size={16} color="#94a3b8" />
        <TextInput
          placeholder="Search encrypted vault..."
          placeholderTextColor="#64748b"
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} style={styles.clearBtn}>
            <X size={14} color="#94a3b8" />
          </TouchableOpacity>
        )}
      </View>

      {/* Category Tabs with Dynamic Count Badges */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsRow}
      >
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeFilter === tab.id;
          const count = categoryCounts[tab.id] ?? 0;
          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setActiveFilter(tab.id)}
              style={[
                styles.tabPill,
                isActive && {
                  backgroundColor: 'rgba(45, 212, 191, 0.15)',
                  borderColor: tab.color,
                },
              ]}
            >
              <Icon size={14} color={isActive ? tab.color : '#64748b'} />
              <Text
                style={[
                  styles.tabPillText,
                  isActive && { color: tab.color, fontWeight: '700' },
                ]}
              >
                {tab.label}
              </Text>
              <View style={[styles.badgeTag, isActive && { backgroundColor: 'rgba(45, 212, 191, 0.25)' }]}>
                <Text style={[styles.badgeText, isActive && { color: tab.color }]}>{count}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Vault Items List */}
      <View style={styles.list}>
        {filteredItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <ShieldCheck size={32} color="#2dd4bf" />
            </View>
            <Text style={styles.emptyTitle}>No vault entries found</Text>
            <Text style={styles.emptySubtitle}>
              Tap "+ New" above to save passwords, payment cards, or secure notes.
            </Text>
          </View>
        ) : (
          filteredItems.map((item) => {
            const config = getCategoryConfig(item.type);
            const Icon = config.icon;
            const details = parseItem(item);
            const isPasswordVisible = visibleMap[`${item.id}_pass`];
            const isCardVisible = visibleMap[`${item.id}_card`];
            const isCvvVisible = visibleMap[`${item.id}_cvv`];

            return (
              <Card key={item.id} style={styles.cardContainer}>
                {/* Card Top Row: Icon + Title + Category + Edit/Delete */}
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    <View style={[styles.cardIconBadge, { backgroundColor: config.bg, borderColor: `${config.color}40` }]}>
                      <Icon size={18} color={config.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemTitle}>{details.title}</Text>
                      <View style={[styles.badge, { backgroundColor: config.bg }]}>
                        <Text style={[styles.badgeText, { color: config.color }]}>
                          {config.label}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      onPress={() => openEditModal(item)}
                      style={styles.actionBtn}
                    >
                      <Pencil size={15} color="#94a3b8" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDelete(item.id)}
                      style={[styles.actionBtn, styles.deleteBtn]}
                    >
                      <Trash2 size={15} color="#fda4af" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Card Inner Vault Data Box */}
                <View style={styles.vaultDataBox}>
                  {/* PASSWORD TYPE */}
                  {item.type === 'login' && (
                    <View style={styles.fieldStack}>
                      {/* Username Row */}
                      {details.username ? (
                        <View style={styles.fieldRow}>
                          <Text style={styles.fieldLabel}>User / Email</Text>
                          <View style={styles.fieldValueRow}>
                            <Text style={styles.fieldValueMono} numberOfLines={1}>
                              {details.username}
                            </Text>
                            <TouchableOpacity
                              onPress={() => handleCopy(details.username, `${item.id}_user`)}
                              style={styles.copyBtn}
                            >
                              {copiedMap[`${item.id}_user`] ? (
                                <Check size={14} color="#2dd4bf" />
                              ) : (
                                <Copy size={14} color="#94a3b8" />
                              )}
                            </TouchableOpacity>
                          </View>
                        </View>
                      ) : null}

                      {/* Password Row */}
                      {details.password ? (
                        <View style={styles.fieldRow}>
                          <Text style={styles.fieldLabel}>Password</Text>
                          <View style={styles.fieldValueRow}>
                            <Text style={[styles.fieldValueMono, { color: '#2dd4bf' }]}>
                              {isPasswordVisible ? details.password : '••••••••••••'}
                            </Text>
                            <View style={styles.rowBtns}>
                              <TouchableOpacity
                                onPress={() => toggleVisibility(`${item.id}_pass`)}
                                style={styles.copyBtn}
                              >
                                {isPasswordVisible ? (
                                  <EyeOff size={14} color="#2dd4bf" />
                                ) : (
                                  <Eye size={14} color="#94a3b8" />
                                )}
                              </TouchableOpacity>
                              <TouchableOpacity
                                onPress={() => handleCopy(details.password, `${item.id}_pass`)}
                                style={styles.copyBtn}
                              >
                                {copiedMap[`${item.id}_pass`] ? (
                                  <Check size={14} color="#2dd4bf" />
                                ) : (
                                  <Copy size={14} color="#94a3b8" />
                                )}
                              </TouchableOpacity>
                            </View>
                          </View>
                        </View>
                      ) : null}

                      {/* URL Row */}
                      {details.url ? (
                        <TouchableOpacity
                          onPress={() => {
                            const link = details.url.startsWith('http') ? details.url : `https://${details.url}`;
                            Linking.openURL(link).catch(() => {});
                          }}
                          style={styles.urlRow}
                        >
                          <Text style={styles.urlText} numberOfLines={1}>
                            {details.url}
                          </Text>
                          <ExternalLink size={12} color="#2dd4bf" />
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  )}

                  {/* CARD TYPE */}
                  {item.type === 'card' && (
                    <View style={styles.fieldStack}>
                      <View style={styles.fieldRow}>
                        <Text style={styles.fieldLabel}>Card Number</Text>
                        <View style={styles.fieldValueRow}>
                          <Text style={styles.fieldValueMono}>
                            {isCardVisible
                              ? details.cardNumber
                              : details.cardNumber
                              ? `•••• •••• •••• ${details.cardNumber.slice(-4)}`
                              : '•••• •••• •••• ••••'}
                          </Text>
                          <View style={styles.rowBtns}>
                            <TouchableOpacity
                              onPress={() => toggleVisibility(`${item.id}_card`)}
                              style={styles.copyBtn}
                            >
                              {isCardVisible ? (
                                <EyeOff size={14} color="#818cf8" />
                              ) : (
                                <Eye size={14} color="#94a3b8" />
                              )}
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => handleCopy(details.cardNumber.replace(/\s+/g, ''), `${item.id}_card`)}
                              style={styles.copyBtn}
                            >
                              {copiedMap[`${item.id}_card`] ? (
                                <Check size={14} color="#818cf8" />
                              ) : (
                                <Copy size={14} color="#94a3b8" />
                              )}
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>

                      <View style={styles.cardSubDetails}>
                        <Text style={styles.cardSubText}>
                          Exp: {details.cardExpiry || 'MM/YY'}
                        </Text>
                        <View style={styles.cvvRow}>
                          <Text style={styles.cardSubText}>
                            CVV: {isCvvVisible ? details.cardCvv : '•••'}
                          </Text>
                          <TouchableOpacity
                            onPress={() => toggleVisibility(`${item.id}_cvv`)}
                            style={styles.smallEyeBtn}
                          >
                            {isCvvVisible ? (
                              <EyeOff size={12} color="#818cf8" />
                            ) : (
                              <Eye size={12} color="#94a3b8" />
                            )}
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  )}

                  {/* NOTE TYPE */}
                  {item.type === 'note' && (
                    <View style={styles.fieldStack}>
                      <Text style={styles.noteContentText} numberOfLines={4}>
                        {details.content || 'Empty secure note'}
                      </Text>
                      <TouchableOpacity
                        onPress={() => handleCopy(details.content, `${item.id}_note`)}
                        style={styles.copyNoteBtn}
                      >
                        {copiedMap[`${item.id}_note`] ? (
                          <Check size={13} color="#34d399" />
                        ) : (
                          <Copy size={13} color="#94a3b8" />
                        )}
                        <Text style={styles.copyNoteText}>Copy Note</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* IDENTITY TYPE */}
                  {item.type === 'identity' && (
                    <View style={styles.fieldStack}>
                      {details.fullName ? (
                        <View style={styles.fieldRow}>
                          <Text style={styles.fieldLabel}>Full Name</Text>
                          <Text style={styles.fieldValue}>{details.fullName}</Text>
                        </View>
                      ) : null}
                      {details.idNumber ? (
                        <View style={styles.fieldRow}>
                          <Text style={styles.fieldLabel}>Document / ID Number</Text>
                          <View style={styles.fieldValueRow}>
                            <Text style={styles.fieldValueMono}>{details.idNumber}</Text>
                            <TouchableOpacity
                              onPress={() => handleCopy(details.idNumber, `${item.id}_id`)}
                              style={styles.copyBtn}
                            >
                              {copiedMap[`${item.id}_id`] ? (
                                <Check size={14} color="#fbbf24" />
                              ) : (
                                <Copy size={14} color="#94a3b8" />
                              )}
                            </TouchableOpacity>
                          </View>
                        </View>
                      ) : null}
                    </View>
                  )}
                </View>

                {/* Card Footer */}
                <View style={styles.cardFooter}>
                  <Text style={styles.footerDate}>
                    {item.updated_at ? `Updated ${new Date(item.updated_at).toLocaleDateString()}` : 'Encrypted Secret'}
                  </Text>
                  <View style={styles.encryptedTag}>
                    <Lock size={10} color="#2dd4bf" />
                    <Text style={styles.encryptedTagText}>AES-256-GCM</Text>
                  </View>
                </View>
              </Card>
            );
          })
        )}
      </View>

      {/* Add / Edit Secret Modal */}
      <Modal visible={isModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            {/* Modal Top Bar */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editItem ? 'Edit Vault Secret' : 'Add Vault Secret'}
              </Text>
              <TouchableOpacity
                onPress={() => setIsModalOpen(false)}
                style={styles.modalCloseBtn}
              >
                <X size={18} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalScrollContent}
            >
              {/* Type Picker Tabs */}
              <View style={styles.typeSelector}>
                {[
                  { id: 'login', label: 'Password', icon: KeyRound },
                  { id: 'card', label: 'Card', icon: CreditCard },
                  { id: 'note', label: 'Note', icon: FileText },
                  { id: 'identity', label: 'Identity', icon: UserCheck },
                ].map((t) => {
                  const Icon = t.icon;
                  const active = modalType === t.id;
                  return (
                    <TouchableOpacity
                      key={t.id}
                      onPress={() => setModalType(t.id)}
                      style={[styles.typeOption, active && styles.typeOptionActive]}
                    >
                      <Icon size={13} color={active ? '#020617' : '#94a3b8'} />
                      <Text
                        style={[
                          styles.typeOptionText,
                          active && styles.typeOptionTextActive,
                        ]}
                      >
                        {t.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Title / Name */}
              <Input
                label="Item Title"
                placeholder={
                  modalType === 'login'
                    ? 'e.g. Google, GitHub, Netflix'
                    : modalType === 'card'
                    ? 'e.g. Chase Sapphire Card'
                    : modalType === 'note'
                    ? 'e.g. Recovery Seeds / Server Keys'
                    : 'e.g. Passport / Driving License'
                }
                value={title}
                onChangeText={setTitle}
              />

              {/* LOGIN SPECIFIC FIELDS */}
              {modalType === 'login' && (
                <>
                  <Input
                    label="Username / Email"
                    placeholder="user@example.com"
                    value={username}
                    onChangeText={setUsername}
                  />

                  <View style={styles.passwordFieldHeader}>
                    <Text style={styles.inputLabel}>Password</Text>
                    <TouchableOpacity
                      onPress={() => setShowGenerator(!showGenerator)}
                      style={styles.generatorToggleBtn}
                    >
                      <Sparkles size={12} color="#2dd4bf" />
                      <Text style={styles.generatorToggleText}>
                        {showGenerator ? 'Hide Generator' : 'Password Generator'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Password Generator Box */}
                  {showGenerator && (
                    <View style={styles.generatorBox}>
                      <View style={styles.generatorPassRow}>
                        <Text style={styles.generatedPassText} numberOfLines={1}>
                          {generatedPass}
                        </Text>
                        <View style={styles.generatorActionBtns}>
                          <TouchableOpacity
                            onPress={generatePassword}
                            style={styles.genIconBtn}
                          >
                            <RefreshCw size={14} color="#2dd4bf" />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleCopy(generatedPass, 'gen_pass')}
                            style={styles.genIconBtn}
                          >
                            {copiedMap['gen_pass'] ? (
                              <Check size={14} color="#2dd4bf" />
                            ) : (
                              <Copy size={14} color="#94a3b8" />
                            )}
                          </TouchableOpacity>
                        </View>
                      </View>

                      {/* Length Selector */}
                      <View style={styles.genLengthRow}>
                        <Text style={styles.genOptionLabel}>Length: {genLength}</Text>
                        <View style={styles.genLengthPills}>
                          {[12, 16, 20, 24, 32].map((len) => (
                            <TouchableOpacity
                              key={len}
                              onPress={() => setGenLength(len)}
                              style={[
                                styles.genLengthPill,
                                genLength === len && styles.genLengthPillActive,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.genLengthPillText,
                                  genLength === len && styles.genLengthPillTextActive,
                                ]}
                              >
                                {len}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>

                      {/* Character Toggles */}
                      <View style={styles.genTogglesRow}>
                        <TouchableOpacity
                          onPress={() => setGenSymbols(!genSymbols)}
                          style={[
                            styles.toggleOption,
                            genSymbols && styles.toggleOptionActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.toggleOptionText,
                              genSymbols && styles.toggleOptionTextActive,
                            ]}
                          >
                            Symbols (!@#$)
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => setGenNumbers(!genNumbers)}
                          style={[
                            styles.toggleOption,
                            genNumbers && styles.toggleOptionActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.toggleOptionText,
                              genNumbers && styles.toggleOptionTextActive,
                            ]}
                          >
                            Numbers (0-9)
                          </Text>
                        </TouchableOpacity>
                      </View>

                      <Button
                        size="sm"
                        variant="secondary"
                        onPress={() => {
                          setPassword(generatedPass);
                          setShowGenerator(false);
                        }}
                      >
                        Use This Generated Password
                      </Button>
                    </View>
                  )}

                  <Input
                    placeholder="••••••••••••"
                    value={password}
                    onChangeText={setPassword}
                  />

                  <Input
                    label="Website URL"
                    placeholder="https://github.com"
                    value={url}
                    onChangeText={setUrl}
                  />
                </>
              )}

              {/* CARD SPECIFIC FIELDS */}
              {modalType === 'card' && (
                <>
                  <Input
                    label="Cardholder Name"
                    placeholder="JOHN DOE"
                    value={cardholder}
                    onChangeText={setCardholder}
                  />
                  <Input
                    label="Card Number"
                    placeholder="4111 2222 3333 4444"
                    keyboardType="numeric"
                    value={cardNumber}
                    onChangeText={setCardNumber}
                  />
                  <View style={styles.cardTwoCol}>
                    <View style={{ flex: 1 }}>
                      <Input
                        label="Expiry Date"
                        placeholder="MM/YY"
                        value={cardExpiry}
                        onChangeText={setCardExpiry}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Input
                        label="CVV Code"
                        placeholder="123"
                        keyboardType="numeric"
                        secureTextEntry
                        value={cardCvv}
                        onChangeText={setCardCvv}
                      />
                    </View>
                  </View>
                </>
              )}

              {/* NOTE SPECIFIC FIELDS */}
              {modalType === 'note' && (
                <Input
                  label="Secure Note Content"
                  placeholder="Enter secret recovery seeds, private keys, or instructions..."
                  multiline
                  numberOfLines={6}
                  value={noteContent}
                  onChangeText={setNoteContent}
                />
              )}

              {/* IDENTITY SPECIFIC FIELDS */}
              {modalType === 'identity' && (
                <>
                  <Input
                    label="Full Name"
                    placeholder="John Doe"
                    value={fullName}
                    onChangeText={setFullName}
                  />
                  <Input
                    label="Document / ID / Passport Number"
                    placeholder="A12345678"
                    value={idNumber}
                    onChangeText={setIdNumber}
                  />
                </>
              )}

              {/* Submit Button */}
              <Button
                variant="primary"
                loading={saving}
                onPress={handleSave}
                style={styles.submitBtn}
              >
                {editItem ? 'Save Changes' : 'Encrypt & Save to Vault'}
              </Button>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Dark Themed Alert Modal */}
      <AlertModal
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        buttons={alertConfig.buttons}
        onClose={closeAlert}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#0f172a',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginVertical: 12,
  },
  searchInput: {
    flex: 1,
    color: '#f8fafc',
    fontSize: 13,
    marginLeft: 10,
  },
  clearBtn: {
    padding: 4,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    paddingRight: 16,
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  tabPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  list: {
    gap: 12,
  },
  emptyContainer: {
    paddingVertical: 56,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(45, 212, 191, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#cbd5e1',
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 18,
  },
  cardContainer: {
    padding: 16,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 10,
  },
  cardIconBadge: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 3,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  deleteBtn: {
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    borderColor: 'rgba(244, 63, 94, 0.25)',
  },
  vaultDataBox: {
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 14,
    padding: 12,
  },
  fieldStack: {
    gap: 8,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  fieldLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  fieldValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fieldValueMono: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#e2e8f0',
    maxWidth: 160,
  },
  fieldValue: {
    fontSize: 12,
    color: '#f8fafc',
    fontWeight: '600',
  },
  rowBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  copyBtn: {
    padding: 5,
    borderRadius: 6,
    backgroundColor: '#0f172a',
  },
  urlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#0f172a',
  },
  urlText: {
    fontSize: 11,
    color: '#2dd4bf',
    flex: 1,
    marginRight: 8,
  },
  cardSubDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#0f172a',
  },
  cardSubText: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#94a3b8',
  },
  cvvRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  smallEyeBtn: {
    padding: 3,
  },
  noteContentText: {
    fontSize: 12,
    color: '#cbd5e1',
    lineHeight: 18,
  },
  copyNoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#0f172a',
    marginTop: 4,
  },
  copyNoteText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  footerDate: {
    fontSize: 10,
    color: '#64748b',
  },
  encryptedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  encryptedTagText: {
    fontSize: 9,
    fontFamily: 'monospace',
    color: '#2dd4bf',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 20,
    maxHeight: '88%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },
  modalCloseBtn: {
    padding: 6,
    borderRadius: 10,
    backgroundColor: '#1e293b',
  },
  modalScrollContent: {
    gap: 12,
    paddingBottom: 28,
  },
  typeSelector: {
    flexDirection: 'row',
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 14,
    padding: 4,
  },
  typeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    borderRadius: 10,
  },
  typeOptionActive: {
    backgroundColor: '#2dd4bf',
  },
  typeOptionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
  },
  typeOptionTextActive: {
    color: '#020617',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#cbd5e1',
  },
  passwordFieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  generatorToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(45, 212, 191, 0.1)',
  },
  generatorToggleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2dd4bf',
  },
  generatorBox: {
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 14,
    padding: 12,
    gap: 10,
  },
  generatorPassRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0f172a',
    padding: 10,
    borderRadius: 10,
  },
  generatedPassText: {
    fontSize: 13,
    fontFamily: 'monospace',
    color: '#2dd4bf',
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  generatorActionBtns: {
    flexDirection: 'row',
    gap: 6,
  },
  genIconBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#020617',
  },
  genLengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  genOptionLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  genLengthPills: {
    flexDirection: 'row',
    gap: 4,
  },
  genLengthPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#0f172a',
  },
  genLengthPillActive: {
    backgroundColor: '#2dd4bf',
  },
  genLengthPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
  },
  genLengthPillTextActive: {
    color: '#020617',
  },
  genTogglesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  toggleOption: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  toggleOptionActive: {
    backgroundColor: 'rgba(45, 212, 191, 0.15)',
    borderColor: '#2dd4bf',
  },
  toggleOptionText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
  },
  toggleOptionTextActive: {
    color: '#2dd4bf',
    fontWeight: '700',
  },
  cardTwoCol: {
    flexDirection: 'row',
    gap: 10,
  },
  submitBtn: {
    marginTop: 10,
  },
  badgeTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
    marginLeft: 2,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    fontFamily: 'monospace',
  },
});

