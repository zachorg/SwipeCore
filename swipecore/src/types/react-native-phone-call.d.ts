declare module 'react-native-phone-call' {
    export function phoneCall(phoneNumber: string, skipPrompt?: boolean): Promise<void>;
}
