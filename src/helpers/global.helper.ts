import { config as configConstant } from 'src/configs/config';
import env from './env.helper';

export function replacePlaceholders(
    inputString: string,
    replacements: any,
): string {
    const regex = /{{([^{}]+)}}/g;

    return inputString.replace(regex, (match, placeholder) =>
        replacements.hasOwnProperty(placeholder)
            ? replacements[placeholder]
            : match,
    );
}

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

export const makeNgrams = (
    word: string,
    minSize = 2,
    prefixOnly = false,
): string[] => {
    if (minSize <= 0) {
        throw new Error('minSize must be a positive integer.');
    }

    word = word.replace(/\s+/g, ' ').trim();

    const length = word.length;
    const sizeRange = Array.from(
        { length: length - minSize + 1 },
        (_, i) => i + minSize,
    );

    if (prefixOnly) {
        return sizeRange.map((size) => word.substring(0, size).toLowerCase());
    }

    const ngramsSet = new Set<string>();
    for (const size of sizeRange) {
        for (let i = 0; i <= Math.max(0, length - size); i++) {
            ngramsSet.add(word.substring(i, i + size).toLowerCase());
        }
    }

    return Array.from(ngramsSet); // Convert Set to array
};

/**
 * Adds delay to scripts
 *
 * @param delay
 * @returns Promise<void>
 */
export const sleep = (delay: number): Promise<void> =>
    new Promise((resolve) => setTimeout(resolve, delay));

/**
 * Trim character from the end of the string
 * @param string string to trim character from
 * @param char character
 * @returns string
 */
export const rtrim = (string: string, char = '/'): string => {
    string = string.endsWith(char)
        ? string.substring(0, string.length - 1)
        : string;
    return string;
};

export const rmxspace = (string: string): string => {
    return string.replace(/\s+/g, ' ').trim();
};

export const uniqueStr = (
    sentence: string,
    caseSensitive: boolean = true,
): string[] => {
    if (!caseSensitive) {
        sentence = sentence.toLowerCase();
    }

    const words = sentence.split(/\s+/);
    const uniqueSet = new Set(words);

    return Array.from(uniqueSet);
};

export function chunkData(data: any[], chunkSize: number = 50) {
    const chunks:any = [];
    for (let i = 0; i < data.length; i += chunkSize) {
        chunks.push(data.slice(i, i + chunkSize));
    }
    return chunks;
}

export function shuffle(data: any[]): any[] {
    for (let i = data.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [data[i], data[j]] = [data[j], data[i]];
    }
    return data;
}

export function keyBy(data: any[], key: string): any {
    return data.reduce((acc, item) => {
        acc[item[key]] = item;
        return acc;
    }, {});
}

Object.defineProperty(String.prototype, 'ucfirst', {
    value: function() {
      return this.charAt(0).toUpperCase() + this.slice(1);
    },
    enumerable: false
  });
