export declare function isValidEmail(email: string): boolean;
export declare function clamp(value: number, min: number, max: number): number;
export declare function truncate(str: string, maxLength: number): string;
export declare function parsePaginationParams(page: unknown, limit: unknown, defaultPage?: number, defaultLimit?: number, maxLimit?: number): {
    page: number;
    limit: number;
};
export declare function generateRequestId(): string;
//# sourceMappingURL=index.d.ts.map