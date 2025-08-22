import React, { useState, useEffect } from 'react';
import { useSocketManager, ConnectionState } from '../../utils/socketManager';
import { useTheme } from '../../contexts/ThemeContext';
import { Box, Text, Tooltip, RingProgress } from '@mantine/core';
import {
  IconWifi,
  IconWifiOff,
  IconRefresh,
  IconAlertCircle,
  IconCircleDot
} from '@tabler/icons-react';

interface ConnectionStatusProps {
  showDetails?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  showDetails = false,
  size = 'sm'
}) => {
  const { connectionState, getLastError, getQueueLength, getNetworkStatus } = useSocketManager();
  const { actualTheme } = useTheme();
  const [isVisible, setIsVisible] = useState(false);

  // Show status briefly on state changes
  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => {
      if (connectionState === ConnectionState.CONNECTED) {
        setIsVisible(false);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [connectionState]);

  const getStatusInfo = () => {
    switch (connectionState) {
      case ConnectionState.CONNECTED:
        return {
          icon: <IconWifi size={size === 'sm' ? 14 : size === 'md' ? 18 : 22} />,
          color: 'green',
          label: 'Connected',
          description: 'Real-time updates active'
        };
      case ConnectionState.CONNECTING:
        return {
          icon: <IconRefresh size={size === 'sm' ? 14 : size === 'md' ? 18 : 22} className="animate-spin" />,
          color: 'blue',
          label: 'Connecting...',
          description: 'Establishing connection'
        };
      case ConnectionState.RECONNECTING:
        return {
          icon: <IconRefresh size={size === 'sm' ? 14 : size === 'md' ? 18 : 22} className="animate-spin" />,
          color: 'yellow',
          label: 'Reconnecting...',
          description: 'Attempting to reconnect'
        };
      case ConnectionState.ERROR:
        return {
          icon: <IconAlertCircle size={size === 'sm' ? 14 : size === 'md' ? 18 : 22} />,
          color: 'red',
          label: 'Connection Error',
          description: getLastError()?.message || 'Unknown error'
        };
      case ConnectionState.DISCONNECTED:
        return {
          icon: <IconWifiOff size={size === 'sm' ? 14 : size === 'md' ? 18 : 22} />,
          color: 'gray',
          label: 'Disconnected',
          description: getNetworkStatus() === 'offline' ? 'Network offline' : 'No connection'
        };
      default:
        return {
          icon: <IconCircleDot size={size === 'sm' ? 14 : size === 'md' ? 18 : 22} />,
          color: 'gray',
          label: 'Unknown',
          description: 'Status unknown'
        };
    }
  };

  const statusInfo = getStatusInfo();
  const queueLength = getQueueLength();

  if (connectionState === ConnectionState.CONNECTED && !isVisible && !showDetails) {
    return null; // Hide when connected and not forced to show
  }

  const themeBasedColor = actualTheme === 'dark' ? {
    green: 'var(--mantine-color-green-4)',
    blue: 'var(--mantine-color-blue-4)',
    yellow: 'var(--mantine-color-yellow-4)',
    red: 'var(--mantine-color-red-4)',
    gray: 'var(--mantine-color-gray-4)'
  } : {
    green: 'var(--mantine-color-green-6)',
    blue: 'var(--mantine-color-blue-6)',
    yellow: 'var(--mantine-color-yellow-6)',
    red: 'var(--mantine-color-red-6)',
    gray: 'var(--mantine-color-gray-6)'
  };

  return (
    <Tooltip
      label={
        <div>
          <div style={{ fontWeight: 500 }}>{statusInfo.description}</div>
          {queueLength > 0 && (
            <div style={{ fontSize: '0.75rem', marginTop: '4px' }}>
              {queueLength} operation{queueLength !== 1 ? 's' : ''} queued
            </div>
          )}
        </div>
      }
      position="bottom"
      withArrow
    >
      <Box
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: size === 'sm' ? '4px 8px' : size === 'md' ? '6px 12px' : '8px 16px',
          borderRadius: '6px',
          backgroundColor: actualTheme === 'dark' ? 'var(--mantine-color-dark-6)' : 'var(--mantine-color-gray-0)',
          border: `1px solid ${themeBasedColor[statusInfo.color as keyof typeof themeBasedColor]}`,
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
      >
        <div style={{ color: themeBasedColor[statusInfo.color as keyof typeof themeBasedColor] }}>
          {statusInfo.icon}
        </div>
        {showDetails && (
          <Text size={size === 'sm' ? 'xs' : 'sm'} fw={500}>
            {statusInfo.label}
            {queueLength > 0 && (
              <span style={{ marginLeft: '4px', fontSize: '0.75em' }}>
                ({queueLength})
              </span>
            )}
          </Text>
        )}
      </Box>
    </Tooltip>
  );
};

export default ConnectionStatus;