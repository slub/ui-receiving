import { PIECE_FORMAT } from '@folio/stripes-acq-components';

export const getPoLineExpectedReceiptDate = (poLine) => {
  return poLine?.physical?.expectedReceiptDate || poLine?.eresource?.expectedActivation;
};

// Same rule mod-orders applies when it creates the pieces of an opened order
export const getPieceExpectedReceiptDate = (poLine, pieceFormat) => {
  return pieceFormat === PIECE_FORMAT.electronic
    ? poLine?.eresource?.expectedActivation
    : poLine?.physical?.expectedReceiptDate;
};
