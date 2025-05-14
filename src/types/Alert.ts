import { Device } from "./Device";

export interface Alert {
    id: string,
    devId: string,
    device: Device,
    type: AlertType,
    lat?: number,
    lon?: number,
    message: string,
    speed?: number,
    timestamp: Date
}

enum AlertType {
  GEOFENCE_BREACH = "GEOFENCE_BREACH",
  OVERSPEEDING = "OVERSPEEDING",
  EMERGENCY = "EMERGENCY"
}