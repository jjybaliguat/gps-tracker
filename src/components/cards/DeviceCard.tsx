'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Device } from '@/types/Device';
import mqtt from 'mqtt';

const DeviceCard = ({ device }: { device: Device }) => {
  const [batteryVoltage, setBatteryVoltage] = useState(0);
  const [batteryPercentage, setBatteryPercentage] = useState(0);
  const [isOnline, setIsOnline] = useState(false);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const clientRef = useRef<mqtt.MqttClient | null>(null);

  useEffect(() => {
    const client = mqtt.connect(process.env.NEXT_PUBLIC_MQTT_BROKER_URL || '', {
      username: process.env.NEXT_PUBLIC_MQTT_USER,
      password: process.env.NEXT_PUBLIC_MQTT_PASS,
      reconnectPeriod: 1000,
    });

    clientRef.current = client;

    client.on('connect', () => {
      client.subscribe(device.battLevelTopic);
      client.subscribe(device.gpsTopic);
      startDataTimeout();
    });

    client.on('message', (topic, message) => {
      if (topic === device.battLevelTopic) {
        startDataTimeout();
        setIsOnline(true);

        const voltage = parseFloat(message.toString());
        const clamped = Math.min(Math.max(voltage, 9.0), 12.6);
        const percent = ((clamped - 9.0) / (12.6 - 9.0)) * 100;

        setBatteryVoltage(clamped);
        setBatteryPercentage(Math.round(percent));
      }
    });

    client.on('error', (err) => {
      console.error('MQTT Error:', err);
      setIsOnline(false);
    });

    client.on('close', () => {
      setIsOnline(false);
      clearTimeoutIfExists();
    });

    return () => {
      client.end();
      clearTimeoutIfExists();
    };
  }, []);

  const startDataTimeout = () => {
    clearTimeoutIfExists();
    timeoutRef.current = setTimeout(() => setIsOnline(false), 10000);
  };

  const clearTimeoutIfExists = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  return (
    <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 shadow-md p-5 flex flex-col gap-4 transition hover:shadow-lg">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{device.name}</h2>
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              isOnline ? 'bg-green-500' : 'bg-gray-400 dark:bg-gray-600'
            }`}
          />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>

      <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
        <p>
          <strong className="text-gray-900 dark:text-white">Device ID:</strong> {device.deviceId}
        </p>
        <p>
          <strong className="text-gray-900 dark:text-white">Plate No:</strong>{' '}
          {device.assignedBus.plateNumber}
        </p>
      </div>

      <div className="mt-2">
        <p className="text-sm font-medium mb-1 text-gray-900 dark:text-white">Battery</p>
        <div className="relative w-full h-6 bg-gray-300 dark:bg-gray-700 rounded-lg overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              !isOnline
                ? 'bg-gray-400 dark:bg-gray-600'
                : batteryPercentage > 50
                ? 'bg-green-500'
                : batteryPercentage > 20
                ? 'bg-yellow-400'
                : 'bg-red-500'
            }`}
            style={{ width: `${batteryPercentage}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-center text-xs dark:text-white font-semibold">
            {batteryPercentage}% ({batteryVoltage.toFixed(2)}V)
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeviceCard;
