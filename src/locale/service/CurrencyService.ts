import CurrencyResources from '../CurrencyResources';
import {Currency} from '../model/Currency';

export interface CurrencyService {
  getCurrency(currencyCode: string): Currency;
}

class DefaultCurrencyService implements CurrencyService {
  getCurrency(currencyCode: string): Currency {
    if (!currencyCode) {
      return null;
    }
    const code = currencyCode.toUpperCase();
    const c = CurrencyResources[code];
    return (c ? {currencyCode: code, currencySymbol: c.currencySymbol, decimalDigits: c.decimalDigits} : null);
  }
}

export const currencyService = new DefaultCurrencyService();
