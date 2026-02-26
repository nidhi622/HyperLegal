import { ENV } from 'src/constant';

export default function env(string: string, defaultValue?: any) {
    string = string.toUpperCase();
    return ENV.hasOwnProperty(string) ? ENV[string] : defaultValue;
}
