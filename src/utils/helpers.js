import { format, parseISO, formatDistance } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Formate un montant en FCFA
 */
export const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return '0 FCFA';
  return `${Number(amount).toLocaleString('fr-FR')} FCFA`;
};

/**
 * Formate une date
 */
export const formatDate = (date, formatStr = 'dd MMMM yyyy') => {
  if (!date) return '-';
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatStr, { locale: fr });
};

/**
 * Formate une date avec l'heure
 */
export const formatDateTime = (date) => {
  if (!date) return '-';
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'dd MMM yyyy HH:mm', { locale: fr });
};

/**
 * Retourne la distance relative à maintenant
 */
export const formatRelativeDate = (date) => {
  if (!date) return '-';
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return formatDistance(dateObj, new Date(), { addSuffix: true, locale: fr });
};

/**
 * Formate un numéro de téléphone
 */
export const formatPhone = (phone) => {
  if (!phone) return '-';
  // Format: XX XX XX XX XX
  return phone.replace(/(\d{2})(?=\d)/g, '$1 ');
};

/**
 * Calcule le pourcentage
 */
export const calculatePercentage = (value, total) => {
  if (!total || total === 0) return 0;
  return ((value / total) * 100).toFixed(1);
};

/**
 * Tronque un texte
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Valide un email
 */
export const isValidEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

/**
 * Valide un numéro de téléphone
 */
export const isValidPhone = (phone) => {
  const regex = /^[\d\s+()-]{8,}$/;
  return regex.test(phone);
};

/**
 * Génère une couleur aléatoire pour les avatars
 */
export const getRandomColor = () => {
  const colors = [
    '#2C3E50', '#3498DB', '#27AE60', '#F39C12', 
    '#E74C3C', '#9B59B6', '#1ABC9C', '#E67E22'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

/**
 * Obtient les initiales d'un nom
 */
export const getInitials = (firstName, lastName) => {
  if (!firstName && !lastName) return 'U';
  const first = firstName?.charAt(0) || '';
  const last = lastName?.charAt(0) || '';
  return (first + last).toUpperCase();
};

/**
 * Convertit une chaîne en slug
 */
export const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

/**
 * Copie du texte dans le presse-papiers
 */
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy:', err);
    return false;
  }
};

/**
 * Télécharge un fichier
 */
export const downloadFile = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.parentNode.removeChild(link);
  window.URL.revokeObjectURL(url);
};

/**
 * Debounce une fonction
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Retourne le statut de fidélité d'un client
 */
export const getFidelityStatus = (nombrePassages, passagesGratuit = 10) => {
  const passagesRestants = passagesGratuit - (nombrePassages % passagesGratuit);
  const prochainGratuit = passagesRestants === passagesGratuit;
  
  return {
    prochainGratuit,
    passagesRestants: prochainGratuit ? 0 : passagesRestants,
    progression: ((nombrePassages % passagesGratuit) / passagesGratuit) * 100,
  };
};

export default {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatRelativeDate,
  formatPhone,
  calculatePercentage,
  truncateText,
  isValidEmail,
  isValidPhone,
  getRandomColor,
  getInitials,
  slugify,
  copyToClipboard,
  downloadFile,
  debounce,
  getFidelityStatus,
};