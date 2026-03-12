interface Auth{
    login(email: string, password: string): Promise<any>;
    forgotPassword(email: string): Promise<any>;
    resetPassword(token: string, newPassword: string): Promise<any>;
    confirmNewPassword(email: string, newPass: string, session: string): Promise<any>;
    calculateSecretHash(username: string): string;
    validatePasswordPolicy(password: string): string[];
    // generateTempPassword(length: number): string;
    // getRandom(str: string): string;
}