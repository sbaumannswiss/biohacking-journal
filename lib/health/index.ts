/**
 * Health Module
 * 
 * Zentrale Exports für native Health APIs (Health Connect / HealthKit)
 */

export {
  checkHealthAvailability,
  requestHealthPermissions,
  openHealthConnectStore,
  getStepsData,
  getHeartRateData,
  getSleepData,
  getHRVData,
  getSpO2Data,
  syncAllHealthData,
  isNativePlatform,
  getPlatform,
  HEALTH_DATA_TYPES,
  type HealthAvailability,
  type HealthPermissionStatus,
  type HealthDataType,
} from './nativeHealthService';
