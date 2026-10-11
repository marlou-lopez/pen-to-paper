export interface DeliveryClient {
  deliver(filename: string, targetFolder: string, buffer: Buffer): Promise<string>;
}
