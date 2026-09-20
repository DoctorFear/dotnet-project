export interface SystemSettingData {
    settingKey: string;
    settingValue: string;
    dataType: 'INT' | 'FLOAT' | 'BOOL' | 'STRING';
    description: string;
    updatedAt: string;
    updatedBy: string;
}
