import { config as configConstant } from 'src/configs/config';
import env from './env.helper';



export function slugify(text: string): string {
    return text
        .toLowerCase()
        .trim()
        .replace(/[àáâãäåæāăą]/g, 'a')
        .replace(/[çćĉċč]/g, 'c')
        .replace(/[ďđ]/g, 'd')
        .replace(/[èéêëðēĕėęě]/g, 'e')
        .replace(/[ğĝġģ]/g, 'g')
        .replace(/[ĥħ]/g, 'h')
        .replace(/[ìíîïıĩīĭįĳ]/g, 'i')
        .replace(/ĵ/g, 'j')
        .replace(/[ķĸ]/g, 'k')
        .replace(/[ĺļľŀł]/g, 'l')
        .replace(/[ñńņňŉŋ]/g, 'n')
        .replace(/[òóôõöøōŏőœ]/g, 'o')
        .replace(/þ/g, 'p')
        .replace(/[ŕŗř]/g, 'r')
        .replace(/[şßśŝşš]/g, 's')
        .replace(/[ţťŧ]/g, 't')
        .replace(/[ùúûüũūŭůűų]/g, 'u')
        .replace(/ŵ/g, 'w')
        .replace(/[ýÿŷ]/g, 'y')
        .replace(/[źżž]/g, 'z')
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_\-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

export function config(string: string): any {
    var arr:any = string.split('.');
    let obj = configConstant;
    while (arr.length && (obj = obj[arr.shift()]));
    return obj;
}

export function isProd(): boolean {
    return env('APP_ENV') === 'production';
}

