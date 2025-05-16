export interface Device {
    id: string,
    name: string,
    deviceId: string,
    gpsTopic: string,
    emergencyTopic: string,
    battLevelTopic: string,
    passengerCountTopic: string,
    accelTopic: string,
    passengerCount: number,
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