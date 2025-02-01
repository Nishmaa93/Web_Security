import { ActivityLog } from '../types';
import { calculateDistance } from './geoLocation';
import { isProxyIP } from './security';

interface AnomalyDetectionParams {
  ip: string;
  userAgent: string;
  deviceFingerprint: string;
  geoLocation: any;
  userId?: string;
  action: string;
}

interface AnomalyResult {
  type: 'location' | 'time' | 'device' | 'behavior';
  confidence: number;
  evidence: string[];
}

/**
 * Detect anomalies in user behavior
 */
export async function detectAnomalies(params: AnomalyDetectionParams): Promise<AnomalyResult | null> {
  const anomalies: AnomalyResult[] = [];

  // Get user's recent activity
  const recentActivity = await ActivityLog.find({
    user: params.userId,
    createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
  }).sort({ createdAt: -1 });

  // Check for location anomalies
  const locationAnomaly = await detectLocationAnomaly(params, recentActivity);
  if (locationAnomaly) anomalies.push(locationAnomaly);

  // Check for time-based anomalies
  const timeAnomaly = detectTimeAnomaly(params, recentActivity);
  if (timeAnomaly) anomalies.push(timeAnomaly);

  // Check for device anomalies
  const deviceAnomaly = detectDeviceAnomaly(params, recentActivity);
  if (deviceAnomaly) anomalies.push(deviceAnomaly);

  // Check for behavioral anomalies
  const behaviorAnomaly = detectBehaviorAnomaly(params, recentActivity);
  if (behaviorAnomaly) anomalies.push(behaviorAnomaly);

  // Return the highest confidence anomaly
  return anomalies.sort((a, b) => b.confidence - a.confidence)[0] || null;
}

async function detectLocationAnomaly(
  params: AnomalyDetectionParams,
  recentActivity: ActivityLog[]
): Promise<AnomalyResult | null> {
  const evidence: string[] = [];
  let confidence = 0;

  // Check if IP is from known proxy/VPN
  if (isProxyIP(params.ip)) {
    evidence.push('Access from known proxy/VPN IP');
    confidence += 30;
  }

  // Check for impossible travel
  const recentLocations = recentActivity
    .filter(log => log.geoLocation)
    .map(log => log.geoLocation);

  if (params.geoLocation && recentLocations.length > 0) {
    for (const prevLocation of recentLocations) {
      const distance = calculateDistance(
        params.geoLocation.latitude,
        params.geoLocation.longitude,
        prevLocation.latitude,
        prevLocation.longitude
      );

      const timeDiff = Date.now() - new Date(prevLocation.timestamp).getTime();
      const impossibleTravel = distance > 500 && timeDiff < 2 * 60 * 60 * 1000; // 2 hours

      if (impossibleTravel) {
        evidence.push(`Impossible travel detected: ${distance.toFixed(0)}km in ${(timeDiff/3600000).toFixed(1)} hours`);
        confidence += 50;
        break;
      }
    }
  }

  return evidence.length > 0 ? {
    type: 'location',
    confidence,
    evidence
  } : null;
}

function detectTimeAnomaly(
  params: AnomalyDetectionParams,
  recentActivity: ActivityLog[]
): AnomalyResult | null {
  const evidence: string[] = [];
  let confidence = 0;

  // Get user's typical activity hours
  const activityHours = recentActivity.map(log => 
    new Date(log.createdAt).getHours()
  );

  const currentHour = new Date().getHours();
  const unusualTime = !activityHours.includes(currentHour);

  if (unusualTime) {
    evidence.push(`Activity at unusual hour: ${currentHour}:00`);
    confidence += 20;
  }

  // Check for rapid successive actions
  const recentActions = recentActivity
    .filter(log => log.createdAt > Date.now() - 5 * 60 * 1000); // Last 5 minutes

  if (recentActions.length > 10) {
    evidence.push(`High frequency of actions: ${recentActions.length} in 5 minutes`);
    confidence += 30;
  }

  return evidence.length > 0 ? {
    type: 'time',
    confidence,
    evidence
  } : null;
}

function detectDeviceAnomaly(
  params: AnomalyDetectionParams,
  recentActivity: ActivityLog[]
): AnomalyResult | null {
  const evidence: string[] = [];
  let confidence = 0;

  // Check if device fingerprint is new
  const knownFingerprints = new Set(
    recentActivity.map(log => log.deviceFingerprint)
  );

  if (!knownFingerprints.has(params.deviceFingerprint)) {
    evidence.push('New device fingerprint detected');
    confidence += 25;
  }

  // Check for rapid device switching
  const recentDevices = recentActivity
    .filter(log => log.createdAt > Date.now() - 60 * 60 * 1000) // Last hour
    .map(log => log.deviceFingerprint);

  const uniqueDevices = new Set(recentDevices).size;
  if (uniqueDevices > 2) {
    evidence.push(`Multiple devices used: ${uniqueDevices} in last hour`);
    confidence += 35;
  }

  return evidence.length > 0 ? {
    type: 'device',
    confidence,
    evidence
  } : null;
}

function detectBehaviorAnomaly(
  params: AnomalyDetectionParams,
  recentActivity: ActivityLog[]
): AnomalyResult | null {
  const evidence: string[] = [];
  let confidence = 0;

  // Check for unusual action patterns
  const actionCounts = recentActivity.reduce((acc, log) => {
    acc[log.action] = (acc[log.action] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const avgCount = Object.values(actionCounts)
    .reduce((sum, count) => sum + count, 0) / Object.keys(actionCounts).length;

  if (actionCounts[params.action] > avgCount * 2) {
    evidence.push(`Unusual frequency of ${params.action} action`);
    confidence += 20;
  }

  // Check for failed actions
  const recentFailures = recentActivity.filter(log => 
    log.status === 'failure' &&
    log.createdAt > Date.now() - 15 * 60 * 1000 // Last 15 minutes
  );

  if (recentFailures.length > 3) {
    evidence.push(`High number of failed actions: ${recentFailures.length}`);
    confidence += 30;
  }

  return evidence.length > 0 ? {
    type: 'behavior',
    confidence,
    evidence
  } : null;
}