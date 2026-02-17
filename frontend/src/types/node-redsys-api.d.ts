declare module "node-redsys-api" {
  export class Redsys {
    createMerchantParameters(params: Record<string, string>): string;
    createMerchantSignature(secret: string, params: Record<string, string>): string;
    decodeMerchantParameters(encoded: string): Record<string, string>;
    createMerchantSignatureNotif(secret: string, encodedParams: string): string;
    merchantSignatureIsValid(received: string, expected: string): boolean;
  }
}
