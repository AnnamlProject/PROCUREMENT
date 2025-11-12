
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (date: string | Date, dateFormat = 'dd MMM yyyy') => {
  return format(new Date(date), dateFormat, { locale: id });
};
