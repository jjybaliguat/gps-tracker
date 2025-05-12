export interface Device {
    id: string,
    name: string,
    deviceId: string,
    gpsTopic: string,
    emergencyTopic: string,
    battLevelTopic: string,
    accelTopic: string,
    gpsData: {
        lat: number,
        lon: number,
        direction: number
    }[],
    assignedBus: {
        capacity: number,
        plateNumber: string,
        driver: string,
        conductor: string
    }
}