// L'API Web NFC (écriture de tags NFC depuis le navigateur) est encore expérimentale
// et absente des typages DOM standards de TypeScript — disponible sur Chrome Android uniquement.
export {};

interface NDEFWriteOptions {
  records: { recordType: string; data: string }[];
}

interface NDEFReaderInstance {
  write(options: NDEFWriteOptions): Promise<void>;
}

declare global {
  interface Window {
    NDEFReader?: new () => NDEFReaderInstance;
  }
}
