import * as moment from 'moment';
import CurrencyResources from '../CurrencyResources';
import LocaleResources from '../LocaleResources';
import {Locale} from '../model/Locale';
import ShortLocaleIdMap from '../ShortLocaleIdMap';

export interface LocaleService {
  getLocale(id: string): Locale;
  getLocaleOrDefault(id: string): Locale;
  getZeroCurrencyByLanguage(language: string);
  getZeroCurrency(locale: Locale);
  formatDate(value: Date, locale: Locale): string;
  formatCurrency(value: any, currencyCode: string, locale: Locale): string;
  formatInteger(value: any, locale: Locale): string;
}

class DefaultLocaleService implements LocaleService {
  // private _nreg = / |\$|€|£|¥|'|٬|،| /g;
  private _r1 = / |,|\$|€|£|¥|'|٬|،| /g;
  private _r2 = / |\.|\$|€|£|¥|'|٬|،| /g;
  private _r3 = /,/g;

  parseNumber(value: string, locale?: Locale, scale?: number): number {
    if (!locale) {
      locale = this.getLocale('en-US');
    }
    if (locale.decimalSeparator === '.') {
      const n2: any = value.replace(this._r1, '');
      if (isNaN(n2)) {
        return null;
      } else {
        return this.round(n2, scale);
      }
    } else {
      const n1 = value.replace(this._r2, '');
      const n2: any = n1.replace(locale.groupSeparator, '.');
      if (isNaN(n2)) {
        return null;
      } else {
        return this.round(n2, scale);
      }
    }
  }

  private round(v: number, scale: number = null): number {
    return (scale ? parseFloat(v.toFixed(scale)) : v);
  }

  getLocale(id: string): Locale {
    let locale = this.getLocaleFromResources(id);
    if (!locale) {
      const newId = ShortLocaleIdMap.get(id);
      locale = this.getLocaleFromResources(newId);
    }
    return locale;
  }

  getLocaleOrDefault(id: string): Locale {
    let locale = this.getLocaleFromResources(id);
    if (!locale) {
      const newId = ShortLocaleIdMap.get(id);
      locale = this.getLocaleFromResources(newId);
    }
    if (!locale) {
      locale = this.getLocaleFromResources('en-US');
    }
    return locale;
  }

  private getLocaleFromResources(id: string): Locale {
    return LocaleResources[id];
  }

  getZeroCurrencyByLanguage(language: string) {
    return this.getZeroCurrency(this.getLocale(language));
  }

  getZeroCurrency(locale: Locale) {
    if (locale) {
      if (locale.decimalDigits <= 0) {
        return '0';
      } else {
        const start = '0' + locale.decimalSeparator;
        const padLength = start.length + locale.decimalDigits;
        return this.padRight(start, padLength, '0');
      }
    } else  {
      return '0.00';
    }
  }

  formatDate(value: Date, locale: Locale): string {
    if (!value) {
      return '';
    }
    if (locale) {
      return moment(value).format(locale.dateFormat.toUpperCase());
    } else {
      return moment(value).format('M/D/YYYY');
    }
  }

  formatCurrency(value: number, currencyCode: string, locale?: Locale, includingCurrencySymbol: boolean = false): string {
    if (!value) {
      return '';
    }
    if (locale) {
      currencyCode = locale.currencyCode;
    }
    if (!currencyCode) {
      currencyCode = 'USD';
    }

    currencyCode = currencyCode.toUpperCase();
    let currency = CurrencyResources[currencyCode];
    if (!currency) {
      currency = CurrencyResources['USD'];
    }
    let v;
    if (locale) {
      // const scale = (locale.decimalDigits && locale.decimalDigits >= 0 ? locale.decimalDigits : 2);
      const scale = currency.decimalDigits;
      v = this._formatNumber(value, scale, locale.decimalSeparator, locale.groupSeparator);
    } else {
      v = this._formatNumber(value, currency.decimalDigits, '.', ',');
    }
    if (locale && includingCurrencySymbol) {
      const symbol = (locale.currencyCode === currencyCode ? locale.currencySymbol : currency.currencySymbol);
      switch (locale.currencyPattern) {
        case 0:
          v = symbol + v;
          break;
        case 1:
          v = '' + v + symbol;
          break;
        case 2:
          v = symbol + ' ' + v;
          break;
        case 3:
          v = '' + v + ' ' + symbol;
          break;
        default:
          break;
      }
    }
    return v;
  }

  formatInteger(value: number, locale: Locale): string {
    if (locale) {
      return this._formatNumber(value, 0, locale.decimalSeparator, locale.groupSeparator);
    } else {
      return this._formatNumber(value, 0, '.', ',');
    }
  }

  formatNumber(value: number, scale: number, locale: Locale): string {
    if (locale) {
      return this._formatNumber(value, scale, locale.decimalSeparator, locale.groupSeparator);
    } else {
      return this._formatNumber(value, scale, '.', ',');
    }
  }

  formatNum(v: number, format: string, locale: Locale) {
    let f = this._format(v, format);
    if (locale) {
      if (locale.decimalSeparator !== '.') {
        f = f.replace('.', '|');
        f = f.replace(this._r3, locale.groupSeparator);
        f = f.replace('|', locale.decimalSeparator);
      } else if (locale.groupSeparator !== ',') {
        f = f.replace(this._r3, locale.groupSeparator);
      }
      return f;
    } else {
      return f;
    }
  }
   _formatNumber(value: number, scale: number, decimalSeparator: string, groupSeparator: string): string {
    if (!value) {
      return '';
    }
    if (!groupSeparator && !decimalSeparator) {
      groupSeparator = ',';
      decimalSeparator = '.';
    }
    const s = (scale === 0 || scale ? value.toFixed(scale) : value.toString());
    const x = s.split('.', 2);
    const y = x[0];
    const arr = [];
    const len = y.length - 1;
    for (let k = 0; k < len; k++) {
      arr.push(y[len - k]);
      if ((k + 1) % 3 === 0) {
        arr.push(groupSeparator);
      }
    }
    arr.push(y[0]);
    if (x.length === 1) {
      return arr.reverse().join('');
    } else {
      return arr.reverse().join('') + decimalSeparator + x[1];
    }
  }

  private padRight(str, length, pad) {
    if (!str) {
      return str;
    }
    if (typeof str !== 'string') {
      str = '' + str;
    }
    if (str.length >= length) {
      return str;
    }
    let str2 = str;
    if (!pad) {
      pad = ' ';
    }
    while (str2.length < length) {
      str2 = str2 + pad;
    }
    return str2;
  }
  /* tslint:disable */
  private _format(a: any, b: any): string {
    let j: any, e: any, h: any, c: any;
    a = a + '';
    if (a == 0 || a == '0') return '0';
    if (!b || isNaN(+a)) return a;
    a = b.charAt(0) == '-' ? -a : +a, j = a < 0 ? a = -a : 0, e = b.match(/[^\d\-\+#]/g), h = e &&
      e[e.length - 1] || '.', e = e && e[1] && e[0] || ',', b = b.split(h), a = a.toFixed(b[1] && b[1].length),
    a = +a + '', d = b[1] && b[1].lastIndexOf('0'), c = a.split('.');
    if (!c[1] || c[1] && c[1].length <= d) a = (+a).toFixed(d + 1);
    d = b[0].split(e); b[0] = d.join('');
    let f = b[0] && b[0].indexOf('0');
    if (f > -1) for (; c[0].length < b[0].length - f;) c[0] = '0' + c[0];
    else +c[0] == 0 && (c[0] = '');
    a = a.split('.'); a[0] = c[0];
    if (c = d[1] && d[d.length - 1].length) {
      f = '';
      for (var d = a[0], k = d.length % c, g = 0, i = d.length; g < i; g++)
        f += d.charAt(g), !((g - k + 1) % c) && g < i - c && (f += e);
      a[0] = f;
    } a[1] = b[1] && a[1] ? h + a[1] : '';
    return (j ? '-' : '') + a[0] + a[1];
  }
}

export const localeService = new DefaultLocaleService();
