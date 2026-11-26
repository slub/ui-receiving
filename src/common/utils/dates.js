import { dayjs } from '@folio/stripes/components';
import { DATE_FORMAT } from '@folio/stripes-acq-components';

export const getUTCDay = (date) => {
  return date ? dayjs.utc(date).format(DATE_FORMAT) : undefined;
};

export const isSameOrBeforeDay = (leftDay, rightDay) => {
  return dayjs(leftDay).isSameOrBefore(dayjs(rightDay).startOf('day'), 'day');
};

export const isBeforeDay = (leftDay, rightDay) => {
  return dayjs(leftDay).isBefore(dayjs(rightDay).startOf('day'), 'day');
};

export const isAfterDay = (leftDay, rightDay) => {
  return dayjs(leftDay).isAfter(dayjs(rightDay).startOf('day'), 'day');
};
