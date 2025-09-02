import CryptoJS from 'crypto-js';

// export const decryptedPersist = (key: string) => {
//     const encryptedData = LocalStorage.getJSON(key);
//     if (!encryptedData) return null;
//     // Decrypt the data
//     const bytes = CryptoJS.AES.decrypt(encryptedData, import.meta.env.VITE_COOKIE_PASSWORD);
//     const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
//     // Parse the JSON string back to an object
//     return JSON.parse(decryptedData);
// }
export const decryptedPersist = (key: any) => {
    if (typeof localStorage !== 'undefined') {
        const data : any = localStorage.getItem(key);
        // Decrypt the data
        const bytes = CryptoJS.AES.decrypt(data, import.meta.env.VITE_COOKIE_PASSWORD);
        const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
        // Parse the JSON string back to an object
        return JSON.parse(decryptedData);
        }
}