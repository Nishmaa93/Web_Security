import { ActivityLog } from '../types';

interface RiskScoringParams {
  action: string;
  anomalies: any;
  geoLocation: any;
  deviceFingerprint: string;
  userHistory: ActivityLog[];
}

/**
 * Calculate risk score based on various factors
 */
export function calculateRiskScore(params: RiskScoringParams): number {
  let score = 0;
  const weights = {
    location: 30,
    device: 20,
    behavior: 25,
    history: 25
  };

  // Location-based risk
  score += calculateLocationRisk(params) * weights.location;

  // Device-based risk
  score += calculateDeviceRisk(params) * weights.device;

  // Behavior-based risk
  score += calculateBehaviorRisk(params) * weights.behavior;

  // Historical risk
  score += calculateHistoricalRisk(params) * weights.history;

  // Normalize to 0-100 range
  return Math.min(Math.max(Math.round(score), 0), 100);
}

function calculateLocationRisk(params: RiskScoringParams): number {
  let risk = 0;

  if (params.anomalies?.type === 'location') {
    risk += 0.7;
  }

  if (params.geoLocation) {
    // High-risk countries (example)
    const highR iskCountries = new Set([
    'Anonymous Proxy',
    'Satellite Provider',
    'Unknown'
  ]);

    if (highRiskCountries.has(params.geoLocation.country)) {
      risk += 0.3;
    }
  }

  return risk;
}

function calculateDeviceRisk(params: RiskScoringParams): number {
  let risk = 0;

  // New device fingerprint
  const knownDevices = new Set(
    params.userHistory.map(log => log.deviceFingerprint)
  );
  if (!knownDevices.has(params.deviceFingerprint)) {
    risk += 0.4;
  }

  // Device anomalies
  if (params.anomalies?.type === 'device') {
    risk += params.anomalies.confidence / 100;
  }

  // Multiple devices in short time
  const recentDevices = new Set(
    params.userHistory
      .filter(log => log.createdAt > Date.now() - 60 * 60 * 1000)
      .map(log => log.deviceFingerprint)
  );
  if (recentDevices.size > 2) {
    risk += 0.3;
  }

  return risk;
}

function calculateBehaviorRisk(params: RiskScoringParams): number {
  let risk = 0;

  // High-risk actions
  const highRiskActions = new Set([
    'password_reset',
    'mfa_disable',
    'role_update',
    'security_settings_update'
  ]);
  if (highRiskActions.has(params.action)) {
    risk += 0.5;
  }

  // Behavioral anomalies
  if (params.anomalies?.type === 'behavior') {
    risk += params.anomalies.confidence / 100;
  }

  // Failed attempts
  const recentFailures = params.userHistory.filter(log => 
    log.status === 'failure' &&
    log.createdAt > Date.now() - 15 * 60 * 1000
  );
  if (recentFailures.length > 3) {
    risk += 0.4;
  }

  return risk;
}

function calculateHistoricalRisk(params: RiskScoringParams): number {
  let risk = 0;

  // Account age
  const oldestActivity = params.userHistory
    .reduce((oldest, log) => 
      log.createdAt < oldest ? log.createdAt : oldest,
      Date.now()
    );
  const accountAge = Date.now() - new Date(oldestActivity).getTime();
  if (accountAge < 24 * 60 * 60 * 1000) { // Less than 24 hours
    risk += 0.4;
  }

  // Previous security incidents
  const securityIncidents = params.userHistory.filter(log =>
    log.status === 'failure' && 
    ['auth_failure', 'mfa_failure', 'suspicious_activity'].includes(log.action)
  );
  if (securityIncidents.length > 0) {
    risk += Math.min(securityIncidents.length * 0.1, 0.5);
  }

  // Suspicious patterns
  const suspiciousPatterns = detectSuspiciousPatterns(params.userHistory);
  risk += suspiciousPatterns * 0.3;

  return risk;
}

function detectSuspiciousPatterns(history: ActivityLog[]): number {
  let suspiciousScore = 0;

  // Check for rapid successive actions
  const actionIntervals = history
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map((log, i, arr) => {
      if (i === 0) return 0;
      return new Date(log.createdAt).getTime() - new Date(arr[i-1].createdAt).getTime();
    })
    .filter(interval => interval > 0);

  const avgInterval = actionIntervals.reduce((sum, int) => sum + int, 0) / actionIntervals.length;
  const rapidActions = actionIntervals.filter(int => int < avgInterval * 0.1).length;
  
  if (rapidActions > 5) {
    suspiciousScore += 0.5;
  }

  // Check for unusual hours
  const actionHours = history.map(log => new Date(log.createdAt).getHours());
  const unusualHours = actionHours.filter(hour => hour >= 22 || hour <= 5).length;
  
  if (unusualHours > history.length * 0.3) {
    suspiciousScore += 0.3;
  }

  return Math.min(suspiciousScore, 1);
}