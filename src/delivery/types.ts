export interface DeliveryClient {
  deliver(filename: string, targetFolder: string, buffer: Buffer): Promise<string>;
}

export interface RemoteDocument {
  id?: string;
  name: string;        // e.g. "Sudoku_Medium_2026-10-13" or "[DONE] MiniCrossword_2026-10-13"
  path: string;        // e.g. "/Puzzles/Daily/Sudoku_Medium_2026-10-13"
  folder: string;      // e.g. "/Puzzles/Daily"
  tags: string[];      // e.g. ["DONE"]
}

export interface CleanupClient extends DeliveryClient {
  listDocuments(folder: string, recursive?: boolean): Promise<RemoteDocument[]>;
  moveDocument(sourcePath: string, destinationFolder: string): Promise<void>;
}
